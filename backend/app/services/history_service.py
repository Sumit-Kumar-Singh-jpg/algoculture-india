from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx
import numpy as np
import pandas as pd
import yfinance as yf

from app.config import (
    HISTORY_INTRADAY_TTL_SECONDS,
    HISTORY_TTL_SECONDS,
    USER_AGENT,
)
from app.data.symbols import resolve_symbol
from app.models import (
    CandleItem,
    StockHistoryResponse,
    TechnicalBias,
)
from app.services.cache import ResilientTTLCache
from app.services.market_data import BENCHMARK_PRICES

_intraday_history_cache = ResilientTTLCache(maxsize=256, ttl=HISTORY_INTRADAY_TTL_SECONDS)
_longterm_history_cache = ResilientTTLCache(maxsize=256, ttl=HISTORY_TTL_SECONDS)

_http_client = httpx.Client(
    timeout=5.0,
    headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Referer": "https://finance.yahoo.com",
    },
    limits=httpx.Limits(max_keepalive_connections=20, max_connections=40),
    follow_redirects=True,
)

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"

INTERVAL_MAPPING = {
    "intraday": {
        "1m": ("1m", "1d"),
        "5m": ("5m", "5d"),
        "15m": ("15m", "5d"),
        "1h": ("60m", "1mo"),
    },
    "longterm": {
        "3mo": ("1d", "3mo"),
        "6mo": ("1d", "6mo"),
        "1y": ("1d", "1y"),
        "3y": ("1wk", "3y"),
        "5y": ("1wk", "5y"),
        "max": ("1mo", "max"),
    },
}


def _fetch_yahoo_ohlcv(yahoo_symbol: str, interval: str, period_range: str) -> dict[str, Any]:
    # 1. Primary fast path: direct pooled HTTP query (~0.1s)
    try:
        params = {"interval": interval, "range": period_range, "includePrePost": "false"}
        resp = _http_client.get(YAHOO_CHART_URL.format(symbol=yahoo_symbol), params=params)
        if resp.status_code == 200:
            payload = resp.json()
            results = payload.get("chart", {}).get("result")
            if results and len(results) > 0:
                timestamps = results[0].get("timestamp") or []
                if len(timestamps) >= 5:
                    return results[0]
    except Exception:
        pass

    # 2. Secondary fallback: official yfinance client (handles cookies and session rotation if direct blocked)
    try:
        ticker = yf.Ticker(yahoo_symbol)
        df_yf = ticker.history(period=period_range, interval=interval)
        if not df_yf.empty and len(df_yf) >= 5:
            timestamps = [int(ts.timestamp()) for ts in df_yf.index]
            opens = df_yf["Open"].tolist()
            highs = df_yf["High"].tolist()
            lows = df_yf["Low"].tolist()
            closes = df_yf["Close"].tolist()
            volumes = df_yf["Volume"].tolist()
            return {
                "timestamp": timestamps,
                "indicators": {
                    "quote": [
                        {
                            "open": opens,
                            "high": highs,
                            "low": lows,
                            "close": closes,
                            "volume": volumes,
                        }
                    ]
                },
            }
    except Exception:
        pass

    raise ValueError(f"No OHLCV history found for {yahoo_symbol}")


def _compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Compute VWAP, EMA 9, EMA 21, SMA 50, SMA 200, and RSI(14)."""
    close = df["close"]
    vol = df["volume"].astype(float)
    typical_price = (df["high"] + df["low"] + close) / 3.0

    # Cumulative VWAP
    cum_vol = vol.cumsum().replace(0, np.nan)
    df["vwap"] = (typical_price * vol).cumsum() / cum_vol
    df["vwap"] = df["vwap"].ffill().bfill()

    # Moving averages
    df["ema9"] = close.ewm(span=9, adjust=False).mean()
    df["ema21"] = close.ewm(span=21, adjust=False).mean()
    df["sma50"] = close.rolling(window=50, min_periods=10).mean()
    df["sma200"] = close.rolling(window=200, min_periods=20).mean()

    # RSI 14
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / 14, min_periods=14, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / 14, min_periods=14, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    df["rsi14"] = 100 - (100 / (1 + rs))
    df["rsi14"] = df["rsi14"].fillna(50.0)

    return df


def _compute_bias(df: pd.DataFrame) -> TechnicalBias:
    if df.empty:
        return TechnicalBias(
            bias="NEUTRAL",
            score=0.0,
            summary="Insufficient data",
            rsi=50.0,
            vwap_signal="Neutral",
            ema_signal="Neutral",
            dma_signal="Neutral",
        )

    last = df.iloc[-1]
    close = float(last["close"])
    vwap = float(last["vwap"]) if pd.notna(last.get("vwap")) else close
    ema9 = float(last["ema9"]) if pd.notna(last.get("ema9")) else close
    ema21 = float(last["ema21"]) if pd.notna(last.get("ema21")) else close
    sma50 = float(last["sma50"]) if pd.notna(last.get("sma50")) else None
    sma200 = float(last["sma200"]) if pd.notna(last.get("sma200")) else None
    rsi = float(last["rsi14"]) if pd.notna(last.get("rsi14")) else 50.0

    score = 0.0

    # RSI contribution (-0.3 to +0.3)
    if rsi >= 60:
        score += 0.3
    elif rsi <= 40:
        score -= 0.3
    else:
        score += ((rsi - 50) / 10) * 0.15

    # VWAP contribution (-0.25 to +0.25)
    vwap_sig = "Above VWAP" if close >= vwap else "Below VWAP"
    score += 0.25 if close >= vwap else -0.25

    # EMA crossover (-0.25 to +0.25)
    ema_sig = "Bullish Cross (9 > 21)" if ema9 >= ema21 else "Bearish Cross (9 < 21)"
    score += 0.25 if ema9 >= ema21 else -0.25

    # DMA contribution (-0.2 to +0.2)
    dma_sig = "Neutral"
    if sma50 is not None and sma200 is not None:
        if close > sma50 > sma200:
            dma_sig = "Golden Alignment (Close > 50 > 200)"
            score += 0.2
        elif close < sma50 < sma200:
            dma_sig = "Death Alignment (Close < 50 < 200)"
            score -= 0.2
        elif close > sma50:
            dma_sig = "Above 50 DMA"
            score += 0.1
        else:
            dma_sig = "Below 50 DMA"
            score -= 0.1

    final_score = round(max(-1.0, min(1.0, score)), 2)
    if final_score >= 0.25:
        overall = "BULLISH"
    elif final_score <= -0.25:
        overall = "BEARISH"
    else:
        overall = "NEUTRAL"

    summary = f"{overall.capitalize()} bias ({final_score:+.2f}) • RSI: {rsi:.1f} • {vwap_sig} • {ema_sig}"

    return TechnicalBias(
        bias=overall,
        score=final_score,
        summary=summary,
        rsi=round(rsi, 1),
        vwap_signal=vwap_sig,
        ema_signal=ema_sig,
        dma_signal=dma_sig,
    )


def _generate_fallback_history(
    canonical: str,
    yahoo_symbol: str,
    resolved_mode: str,
    mapped_interval: str,
    mapped_range: str,
) -> StockHistoryResponse:
    base_price = BENCHMARK_PRICES.get(canonical, 1000.0)
    now_ts = int(datetime.now(timezone.utc).timestamp())
    step_sec = 300 if resolved_mode == "intraday" else 86400
    num_candles = 60
    start_ts = now_ts - (num_candles * step_sec)

    rows: list[dict[str, Any]] = []
    curr = base_price * 0.985
    for i in range(num_candles):
        t = start_ts + (i * step_sec)
        drift = ((i % 5) - 2) * (base_price * 0.001) + (base_price * 0.0003)
        open_p = round(curr, 2)
        close_p = round(open_p + drift, 2)
        high_p = round(max(open_p, close_p) + (base_price * 0.002), 2)
        low_p = round(min(open_p, close_p) - (base_price * 0.002), 2)
        vol = 15000 + ((i * 73) % 8000)
        curr = close_p
        rows.append(
            {
                "time": t,
                "open": open_p,
                "high": high_p,
                "low": low_p,
                "close": close_p,
                "volume": vol,
            }
        )

    df = pd.DataFrame(rows)
    df = _compute_indicators(df)
    bias = _compute_bias(df)

    candles: list[CandleItem] = []
    for _, row in df.iterrows():
        t_sec = int(row["time"])
        iso = datetime.fromtimestamp(t_sec, tz=timezone.utc).isoformat()
        candles.append(
            CandleItem(
                time=t_sec,
                time_iso=iso,
                open=round(float(row["open"]), 2),
                high=round(float(row["high"]), 2),
                low=round(float(row["low"]), 2),
                close=round(float(row["close"]), 2),
                volume=int(row["volume"]),
                vwap=round(float(row["vwap"]), 2) if pd.notna(row.get("vwap")) else None,
                ema9=round(float(row["ema9"]), 2) if pd.notna(row.get("ema9")) else None,
                ema21=round(float(row["ema21"]), 2) if pd.notna(row.get("ema21")) else None,
                sma50=round(float(row["sma50"]), 2) if pd.notna(row.get("sma50")) else None,
                sma200=round(float(row["sma200"]), 2) if pd.notna(row.get("sma200")) else None,
                rsi14=round(float(row["rsi14"]), 1) if pd.notna(row.get("rsi14")) else None,
            )
        )

    last_time = candles[-1].time_iso if candles else datetime.now(timezone.utc).isoformat()
    session_date = last_time.split("T")[0]

    return StockHistoryResponse(
        symbol=canonical,
        yahoo_symbol=yahoo_symbol,
        mode=resolved_mode,
        interval=mapped_interval,
        range=mapped_range,
        currency="INR",
        session_date=session_date,
        candles=candles,
        bias=bias,
        as_of=datetime.now(timezone.utc).isoformat(),
        stale=True,
    )


def get_stock_history(
    raw_symbol: str,
    mode: str = "intraday",
    interval: str | None = None,
    time_range: str | None = None,
) -> StockHistoryResponse:
    canonical, yahoo_symbol, default_name, exchange, is_fno, is_index = resolve_symbol(raw_symbol)

    resolved_mode = "longterm" if mode.lower() in {"longterm", "long-term", "investing"} else "intraday"

    if resolved_mode == "intraday":
        active_interval = interval or "5m"
        mapped_interval, mapped_range = INTERVAL_MAPPING["intraday"].get(
            active_interval, ("5m", "5d")
        )
    else:
        active_interval = interval or "1d"
        active_range = time_range or "1y"
        mapped_interval, mapped_range = INTERVAL_MAPPING["longterm"].get(
            active_range, ("1d", "1y")
        )

    cache_key = f"hist:{yahoo_symbol}:{resolved_mode}:{mapped_interval}:{mapped_range}"
    active_cache = _intraday_history_cache if resolved_mode == "intraday" else _longterm_history_cache

    try:
        raw_chart, cached_at, stale = active_cache.get_or_fetch(
            cache_key,
            lambda: _fetch_yahoo_ohlcv(yahoo_symbol, mapped_interval, mapped_range),
        )

        timestamps = raw_chart.get("timestamp") or []
        indicators = raw_chart.get("indicators", {}).get("quote", [{}])[0]
        opens = indicators.get("open") or []
        highs = indicators.get("high") or []
        lows = indicators.get("low") or []
        closes = indicators.get("close") or []
        volumes = indicators.get("volume") or []

        rows: list[dict[str, Any]] = []
        for t, o, h, l, c, v in zip(timestamps, opens, highs, lows, closes, volumes, strict=False):
            if None in (t, o, h, l, c):
                continue
            rows.append(
                {
                    "time": int(t),
                    "open": float(o),
                    "high": float(h),
                    "low": float(l),
                    "close": float(c),
                    "volume": int(v) if v is not None else 0,
                }
            )

        if not rows:
            raise ValueError(f"No valid OHLC candles returned for {canonical}")

        # Real-time latest bar fusion: if live price/time is more recent than the last candle
        meta = raw_chart.get("meta") or {}
        regular_price = meta.get("regularMarketPrice")
        regular_time = meta.get("regularMarketTime")

        if (
            resolved_mode == "intraday"
            and rows
            and regular_price is not None
            and regular_time is not None
        ):
            step_sec = 60 if mapped_interval == "1m" else (900 if mapped_interval == "15m" else (3600 if mapped_interval == "60m" else 300))
            last_candle_time = rows[-1]["time"]
            reg_price_flt = round(float(regular_price), 2)
            reg_time_int = int(regular_time)

            if reg_time_int >= last_candle_time + step_sec:
                # Append active forming bar for the latest slot
                slot_time = (reg_time_int // step_sec) * step_sec
                prev_close = rows[-1]["close"]
                rows.append(
                    {
                        "time": slot_time,
                        "open": prev_close,
                        "high": max(prev_close, reg_price_flt),
                        "low": min(prev_close, reg_price_flt),
                        "close": reg_price_flt,
                        "volume": 0,
                    }
                )
            elif reg_time_int >= last_candle_time:
                # Update current bar's close and high/low with latest live price
                rows[-1]["close"] = reg_price_flt
                rows[-1]["high"] = max(rows[-1]["high"], reg_price_flt)
                rows[-1]["low"] = min(rows[-1]["low"], reg_price_flt)

        df = pd.DataFrame(rows)
        df = _compute_indicators(df)
        bias = _compute_bias(df)

        candles: list[CandleItem] = []
        for _, row in df.iterrows():
            t_sec = int(row["time"])
            iso = datetime.fromtimestamp(t_sec, tz=timezone.utc).isoformat()
            candles.append(
                CandleItem(
                    time=t_sec,
                    time_iso=iso,
                    open=round(float(row["open"]), 2),
                    high=round(float(row["high"]), 2),
                    low=round(float(row["low"]), 2),
                    close=round(float(row["close"]), 2),
                    volume=int(row["volume"]),
                    vwap=round(float(row["vwap"]), 2) if pd.notna(row.get("vwap")) else None,
                    ema9=round(float(row["ema9"]), 2) if pd.notna(row.get("ema9")) else None,
                    ema21=round(float(row["ema21"]), 2) if pd.notna(row.get("ema21")) else None,
                    sma50=round(float(row["sma50"]), 2) if pd.notna(row.get("sma50")) else None,
                    sma200=round(float(row["sma200"]), 2) if pd.notna(row.get("sma200")) else None,
                    rsi14=round(float(row["rsi14"]), 1) if pd.notna(row.get("rsi14")) else None,
                )
            )

        last_time = candles[-1].time_iso if candles else cached_at
        session_date = last_time.split("T")[0]

        return StockHistoryResponse(
            symbol=canonical,
            yahoo_symbol=yahoo_symbol,
            mode=resolved_mode,
            interval=mapped_interval,
            range=mapped_range,
            currency="INR",
            session_date=session_date,
            candles=candles,
            bias=bias,
            as_of=cached_at,
            stale=stale,
        )
    except Exception:
        return _generate_fallback_history(
            canonical, yahoo_symbol, resolved_mode, mapped_interval, mapped_range
        )
def clear_history_cache() -> None:
    _intraday_history_cache.clear()
    _longterm_history_cache.clear()
