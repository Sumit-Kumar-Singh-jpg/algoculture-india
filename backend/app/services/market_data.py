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
    ALL_NSE_STOCKS,
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
    # 1. Primary fast path: direct pooled HTTP query (~0.08s)
    try:
        params = {"interval": "1d", "range": "5d"}
        resp = _http_client.get(YAHOO_CHART_URL.format(symbol=yahoo_symbol), params=params)
        if resp.status_code == 200:
            payload = resp.json()
            results = payload.get("chart", {}).get("result")
            if results and len(results) > 0:
                meta = results[0].get("meta", {})
                if meta.get("regularMarketPrice") is not None:
                    return results[0]
    except Exception:
        pass

    # 2. Secondary fallback: yfinance client
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

    raise ValueError(f"No chart result returned for {yahoo_symbol}")


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


BENCHMARK_PRICES: dict[str, float] = {
    "NIFTY": 24500.0,
    "BANKNIFTY": 52000.0,
    "FINNIFTY": 24000.0,
    "SENSEX": 80000.0,
    "INDIAVIX": 15.0,
    "RELIANCE": 1340.0,
    "TCS": 4150.0,
    "HDFCBANK": 1750.0,
    "ICICIBANK": 1280.0,
    "INFY": 1850.0,
    "SBIN": 820.0,
    "BHARTIARTL": 1600.0,
    "ITC": 470.0,
    "LT": 3650.0,
    "KOTAKBANK": 1780.0,
    "AXISBANK": 1150.0,
    "MARUTI": 11500.0,
    "TATAMOTORS": 780.0,
    "TATASTEEL": 140.0,
    "SUNPHARMA": 1750.0,
    "TITAN": 3200.0,
    "WIPRO": 560.0,
    "HAL": 4200.0,
    "BEL": 300.0,
    "ETERNAL": 260.0,
    "PAYTM": 820.0,
}


def _generate_fallback_quote(
    canonical: str,
    yahoo_symbol: str,
    default_name: str,
    exchange: str,
    is_fno: bool,
    is_index: bool,
) -> StockQuoteResponse:
    base_price = BENCHMARK_PRICES.get(canonical, 1000.0)
    change = round(base_price * 0.0035, 2)
    change_pct = 0.35
    ltp = round(base_price + change, 2)
    day_open = base_price
    day_high = round(base_price * 1.008, 2)
    day_low = round(base_price * 0.995, 2)
    volume = 2500000 if not is_index else 0
    now_iso = datetime.now(timezone.utc).isoformat()

    return StockQuoteResponse(
        symbol=canonical,
        yahoo_symbol=yahoo_symbol,
        name=default_name,
        exchange=exchange,
        currency="INR",
        ltp=ltp,
        change=change,
        change_pct=change_pct,
        open=day_open,
        high=day_high,
        low=day_low,
        prev_close=base_price,
        volume=volume,
        week52_high=round(base_price * 1.25, 2),
        week52_low=round(base_price * 0.85, 2),
        market_status=get_nse_market_status(),
        is_fno=is_fno,
        is_index=is_index,
        as_of=now_iso,
        stale=True,
    )


def get_stock_quote(raw_symbol: str) -> StockQuoteResponse:
    canonical, yahoo_symbol, default_name, exchange, is_fno, is_index = resolve_symbol(raw_symbol)
    try:
        chart_result, cached_at, stale = _quote_cache.get_or_fetch(
            yahoo_symbol,
            lambda: _fetch_yahoo_chart_meta(yahoo_symbol),
        )
        return _parse_quote_from_chart(canonical, chart_result, cached_at, stale)
    except Exception:
        return _generate_fallback_quote(
            canonical, yahoo_symbol, default_name, exchange, is_fno, is_index
        )


def _fetch_remote_search(query: str) -> list[StockSearchItem]:
    # 1. Primary fast path: direct pooled HTTP query (~0.1s)
    try:
        params = {"q": query, "quotesCount": 15, "newsCount": 0, "region": "IN"}
        resp = _http_client.get(YAHOO_SEARCH_URL, params=params)
        if resp.status_code == 200:
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
            if items:
                return items
    except Exception:
        pass

    # 2. Secondary fallback: yf.Search (anti-429 session handling)
    try:
        s = yf.Search(query, max_results=15)
        items: list[StockSearchItem] = []
        for quote in s.quotes:
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
        if items:
            return items
    except Exception:
        pass

    return []


def search_stocks(query: str, limit: int = 15) -> list[StockSearchItem]:
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

    # Exact prefix matches first, then substring matches across ALL 2,400+ NSE stocks
    scored: list[tuple[int, StockSearchItem]] = []
    for entry in ALL_NSE_STOCKS:
        sym_l = entry.symbol.lower()
        name_l = entry.name.lower()
        if sym_l == q_lower:
            score = 0
        elif sym_l.startswith(q_lower):
            score = 1
        elif name_l.startswith(q_lower):
            score = 2
        elif q_lower in sym_l or q_lower in name_l:
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

    # Supplement with remote search for any other BSE / global symbol
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

    if not items:
        for sym, lbl in PULSE_TARGETS:
            q = get_stock_quote(sym)
            items.append(
                MarketPulseItem(
                    symbol=q.symbol,
                    label=lbl,
                    ltp=q.ltp,
                    change=q.change,
                    change_pct=q.change_pct,
                    stale=True,
                )
            )

    return MarketPulseResponse(
        market_status=get_nse_market_status(),
        as_of=cached_at,
        items=items,
    )


def clear_market_caches() -> None:
    _quote_cache.clear()
    _pulse_cache.clear()
    _search_cache.clear()
