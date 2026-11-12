from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx
import numpy as np
import pandas as pd

from app.config import (
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

_history_cache = ResilientTTLCache(maxsize=256, ttl=HISTORY_TTL_SECONDS)

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
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    params = {"interval": interval, "range": period_range, "includePrePost": "false"}
    with httpx.Client(timeout=10.0, headers=headers, follow_redirects=True) as client:
        resp = client.get(YAHOO_CHART_URL.format(symbol=yahoo_symbol), params=params)
        resp.raise_for_status()
        payload = resp.json()

    results = payload.get("chart", {}).get("result")
    if not results:
        raise ValueError(f"No OHLCV history found for {yahoo_symbol}")
    return results[0]


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

    raw_chart, cached_at, stale = _history_cache.get_or_fetch(
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
