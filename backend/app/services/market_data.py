from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx
import yfinance as yf

from app.config import (
    PULSE_TTL_SECONDS,
    QUOTE_TTL_SECONDS,
    SEARCH_TTL_SECONDS,
    USER_AGENT,
    get_nse_market_status,
)
from app.data.symbols import (
    FNO_ELIGIBLE_SYMBOLS,
    POPULAR_STOCKS,
    resolve_symbol,
)
from app.models import (
    MarketPulseItem,
    MarketPulseResponse,
    StockQuoteResponse,
    StockSearchItem,
)
from app.services.cache import ResilientTTLCache

_quote_cache = ResilientTTLCache(maxsize=512, ttl=QUOTE_TTL_SECONDS)
_pulse_cache = ResilientTTLCache(maxsize=8, ttl=PULSE_TTL_SECONDS)
_search_cache = ResilientTTLCache(maxsize=256, ttl=SEARCH_TTL_SECONDS)

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search"

PULSE_TARGETS: tuple[tuple[str, str], ...] = (
    ("NIFTY", "NIFTY 50"),
    ("SENSEX", "SENSEX"),
    ("BANKNIFTY", "BANKNIFTY"),
    ("INDIAVIX", "INDIA VIX"),
)


def _safe_float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _last_valid(values: list[Any] | None) -> float | None:
    if not values:
        return None
    for v in reversed(values):
        if v is not None:
            return _safe_float(v)
    return None


def _fetch_yahoo_chart_meta(yahoo_symbol: str) -> dict[str, Any]:
    # 1. Try yfinance fast session fetch first to avoid 429
    try:
        t = yf.Ticker(yahoo_symbol)
        df = t.history(period="5d", interval="1d")
        if not df.empty and len(df) >= 1:
            last_row = df.iloc[-1]
            prev_close = float(df.iloc[-2]["Close"]) if len(df) >= 2 else float(last_row["Close"])
            ltp = float(last_row["Close"])
            high = float(last_row["High"])
            low = float(last_row["Low"])
            open_p = float(last_row["Open"])
            volume = int(last_row["Volume"])

            return {
                "meta": {
                    "regularMarketPrice": ltp,
                    "previousClose": prev_close,
                    "chartPreviousClose": prev_close,
                    "regularMarketOpen": open_p,
                    "regularMarketDayHigh": high,
                    "regularMarketDayLow": low,
                    "regularMarketVolume": volume,
                    "symbol": yahoo_symbol,
                },
                "indicators": {
                    "quote": [
                        {
                            "open": df["Open"].tolist(),
                            "high": df["High"].tolist(),
                            "low": df["Low"].tolist(),
                            "close": df["Close"].tolist(),
                            "volume": df["Volume"].tolist(),
                        }
                    ]
                },
            }
    except Exception:
        pass

    # 2. Direct HTTP query fallback
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Referer": "https://finance.yahoo.com",
    }
    params = {"interval": "1d", "range": "5d"}
    with httpx.Client(timeout=8.0, headers=headers, follow_redirects=True) as client:
        resp = client.get(YAHOO_CHART_URL.format(symbol=yahoo_symbol), params=params)
        resp.raise_for_status()
        payload = resp.json()

    results = payload.get("chart", {}).get("result")
    if not results:
        raise ValueError(f"No chart result returned for {yahoo_symbol}")
    return results[0]


def _parse_quote_from_chart(
    raw_symbol: str,
    chart_result: dict[str, Any],
    as_of: str,
    stale: bool,
) -> StockQuoteResponse:
    canonical, yahoo_symbol, default_name, exchange, is_fno, is_index = resolve_symbol(raw_symbol)
    meta = chart_result.get("meta", {})
    indicators = chart_result.get("indicators", {}).get("quote", [{}])
    quote_series = indicators[0] if indicators else {}

    ltp = _safe_float(meta.get("regularMarketPrice")) or (_last_valid(quote_series.get("close")) or 0.0)
    prev_close = _safe_float(meta.get("chartPreviousClose") or meta.get("previousClose"))
    if prev_close <= 0:
        closes = [c for c in (quote_series.get("close") or []) if c is not None]
        if len(closes) >= 2:
            prev_close = _safe_float(closes[-2], ltp)
        else:
            prev_close = ltp

    change = round(ltp - prev_close, 2)
    change_pct = round((change / prev_close) * 100, 2) if prev_close > 0 else 0.0

    day_open = _safe_float(meta.get("regularMarketOpen")) or (_last_valid(quote_series.get("open")) or ltp)
    day_high = _safe_float(meta.get("regularMarketDayHigh")) or (_last_valid(quote_series.get("high")) or ltp)
    day_low = _safe_float(meta.get("regularMarketDayLow")) or (_last_valid(quote_series.get("low")) or ltp)
    volume = _safe_int(meta.get("regularMarketVolume"))
    if volume == 0:
        last_vol = _last_valid(quote_series.get("volume"))
        volume = int(last_vol) if last_vol is not None else 0

    week52_high = meta.get("fiftyTwoWeekHigh")
    week52_low = meta.get("fiftyTwoWeekLow")

    display_name = meta.get("longName") or meta.get("shortName") or default_name

    return StockQuoteResponse(
        symbol=canonical,
        yahoo_symbol=yahoo_symbol,
        name=display_name,
        exchange=exchange,
        currency=meta.get("currency") or "INR",
        ltp=round(ltp, 2),
        change=change,
        change_pct=change_pct,
        open=round(day_open, 2),
        high=round(day_high, 2),
        low=round(day_low, 2),
        prev_close=round(prev_close, 2),
        volume=volume,
        week52_high=round(_safe_float(week52_high), 2) if week52_high is not None else None,
        week52_low=round(_safe_float(week52_low), 2) if week52_low is not None else None,
        market_status=get_nse_market_status(),
        is_fno=is_fno,
        is_index=is_index,
        as_of=as_of,
        stale=stale,
    )


def get_stock_quote(raw_symbol: str) -> StockQuoteResponse:
    canonical, yahoo_symbol, *_ = resolve_symbol(raw_symbol)
    chart_result, cached_at, stale = _quote_cache.get_or_fetch(
        yahoo_symbol,
        lambda: _fetch_yahoo_chart_meta(yahoo_symbol),
    )
    return _parse_quote_from_chart(canonical, chart_result, cached_at, stale)


def _fetch_remote_search(query: str) -> list[StockSearchItem]:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    params = {"q": query, "quotesCount": 15, "newsCount": 0, "region": "IN"}
    with httpx.Client(timeout=5.0, headers=headers, follow_redirects=True) as client:
        resp = client.get(YAHOO_SEARCH_URL, params=params)
        resp.raise_for_status()
        payload = resp.json()

    items: list[StockSearchItem] = []
    for quote in payload.get("quotes", []):
        y_sym = str(quote.get("symbol") or "").upper()
        if not (y_sym.endswith(".NS") or y_sym.endswith(".BO") or y_sym in {"^NSEI", "^NSEBANK", "^BSESN", "^INDIAVIX"}):
            continue
        exchange = "BSE" if y_sym.endswith(".BO") else ("INDEX" if y_sym.startswith("^") else "NSE")
        base_symbol = y_sym[:-3] if y_sym.endswith((".NS", ".BO")) else y_sym
        items.append(
            StockSearchItem(
                symbol=y_sym if exchange == "BSE" else base_symbol,
                yahoo_symbol=y_sym,
                name=quote.get("longname") or quote.get("shortname") or base_symbol,
                exchange=exchange,
                sector=quote.get("sectorDisp") or quote.get("quoteType") or "Equity",
                is_fno=base_symbol in FNO_ELIGIBLE_SYMBOLS,
                is_index=y_sym.startswith("^"),
            )
        )
    return items


def search_stocks(query: str, limit: int = 12) -> list[StockSearchItem]:
    cleaned = query.strip()
    if not cleaned:
        return [
            StockSearchItem(
                symbol=entry.symbol,
                yahoo_symbol=entry.yahoo_symbol,
                name=entry.name,
                exchange=entry.exchange,
                sector=entry.sector,
                is_fno=entry.is_fno,
                is_index=entry.is_index,
            )
            for entry in POPULAR_STOCKS[:limit]
        ]

    q_lower = cleaned.lower()
    local_matches: list[StockSearchItem] = []
    seen_yahoo: set[str] = set()

    # Exact prefix matches first, then substring matches
    scored: list[tuple[int, StockSearchItem]] = []
    for entry in POPULAR_STOCKS:
        sym_l = entry.symbol.lower()
        name_l = entry.name.lower()
        if sym_l == q_lower:
            score = 0
        elif sym_l.startswith(q_lower):
            score = 1
        elif name_l.startswith(q_lower):
            score = 2
        elif q_lower in sym_l or q_lower in name_l or q_lower in entry.sector.lower():
            score = 3
        else:
            continue
        scored.append(
            (
                score,
                StockSearchItem(
                    symbol=entry.symbol,
                    yahoo_symbol=entry.yahoo_symbol,
                    name=entry.name,
                    exchange=entry.exchange,
                    sector=entry.sector,
                    is_fno=entry.is_fno,
                    is_index=entry.is_index,
                ),
            )
        )

    scored.sort(key=lambda pair: (pair[0], pair[1].symbol))
    for _, item in scored:
        if item.yahoo_symbol not in seen_yahoo:
            local_matches.append(item)
            seen_yahoo.add(item.yahoo_symbol)

    if len(local_matches) >= limit:
        return local_matches[:limit]

    # Supplement with remote Yahoo Finance search for any NSE/BSE ticker outside the curated list
    try:
        remote_items, _, _ = _search_cache.get_or_fetch(
            f"search:{q_lower}",
            lambda: _fetch_remote_search(cleaned),
        )
        for item in remote_items:
            if item.yahoo_symbol not in seen_yahoo:
                local_matches.append(item)
                seen_yahoo.add(item.yahoo_symbol)
                if len(local_matches) >= limit:
                    break
    except Exception:
        # Local curated search remains responsive even if remote search is offline
        pass

    return local_matches[:limit]


def get_market_pulse() -> MarketPulseResponse:
    def _fetch_all_pulse() -> list[MarketPulseItem]:
        items: list[MarketPulseItem] = []
        for symbol, label in PULSE_TARGETS:
            try:
                quote = get_stock_quote(symbol)
                items.append(
                    MarketPulseItem(
                        symbol=quote.symbol,
                        label=label,
                        ltp=quote.ltp,
                        change=quote.change,
                        change_pct=quote.change_pct,
                        stale=quote.stale,
                    )
                )
            except Exception:
                continue
        if not items:
            raise RuntimeError("Unable to fetch any market pulse indices")
        return items

    try:
        items, cached_at, stale = _pulse_cache.get_or_fetch("pulse", _fetch_all_pulse)
        if stale:
            items = [item.model_copy(update={"stale": True}) for item in items]
    except Exception:
        items = []
        cached_at = datetime.now(timezone.utc).isoformat()

    return MarketPulseResponse(
        market_status=get_nse_market_status(),
        as_of=cached_at,
        items=items,
    )


def clear_market_caches() -> None:
    _quote_cache.clear()
    _pulse_cache.clear()
    _search_cache.clear()
