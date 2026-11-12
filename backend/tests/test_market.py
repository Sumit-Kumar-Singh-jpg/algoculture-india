from __future__ import annotations

from datetime import datetime
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.config import IST, get_nse_market_status
from app.main import app
from app.services.market_data import clear_market_caches

client = TestClient(app)


MOCK_RELIANCE_CHART = {
    "meta": {
        "currency": "INR",
        "symbol": "RELIANCE.NS",
        "longName": "Reliance Industries Limited",
        "regularMarketPrice": 1295.40,
        "chartPreviousClose": 1280.00,
        "regularMarketOpen": 1284.00,
        "regularMarketDayHigh": 1301.25,
        "regularMarketDayLow": 1279.50,
        "regularMarketVolume": 8450123,
        "fiftyTwoWeekHigh": 1608.80,
        "fiftyTwoWeekLow": 1193.35,
    },
    "indicators": {
        "quote": [
            {
                "open": [1284.0],
                "high": [1301.25],
                "low": [1279.50],
                "close": [1295.40],
                "volume": [8450123],
            }
        ]
    },
}


def setup_function() -> None:
    clear_market_caches()


def test_health_endpoint() -> None:
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["market_status"] in {"OPEN", "PRE_OPEN", "CLOSED"}


def test_market_status_windows() -> None:
    # Wednesday 10:30 IST -> OPEN
    assert get_nse_market_status(datetime(2026, 11, 11, 10, 30, tzinfo=IST)) == "OPEN"
    # Wednesday 09:05 IST -> PRE_OPEN
    assert get_nse_market_status(datetime(2026, 11, 11, 9, 5, tzinfo=IST)) == "PRE_OPEN"
    # Wednesday 16:00 IST -> CLOSED
    assert get_nse_market_status(datetime(2026, 11, 11, 16, 0, tzinfo=IST)) == "CLOSED"
    # Saturday 11:00 IST -> CLOSED
    assert get_nse_market_status(datetime(2026, 11, 14, 11, 0, tzinfo=IST)) == "CLOSED"


def test_search_stocks_local_matches() -> None:
    resp = client.get("/api/stocks/search", params={"q": "reli"})
    assert resp.status_code == 200
    data = resp.json()
    symbols = [item["symbol"] for item in data["results"]]
    assert "RELIANCE" in symbols
    first = next(item for item in data["results"] if item["symbol"] == "RELIANCE")
    assert first["exchange"] == "NSE"
    assert first["is_fno"] is True


def test_search_stocks_empty_returns_popular() -> None:
    resp = client.get("/api/stocks/search")
    assert resp.status_code == 200
    results = resp.json()["results"]
    assert len(results) > 0
    assert results[0]["symbol"] == "NIFTY"


def test_quote_endpoint_parses_and_caches_with_stale_fallback() -> None:
    with patch("app.services.market_data._fetch_yahoo_chart_meta", return_value=MOCK_RELIANCE_CHART) as mock_fetch:
        resp1 = client.get("/api/stocks/RELIANCE/quote")
        assert resp1.status_code == 200
        q1 = resp1.json()
        assert q1["symbol"] == "RELIANCE"
        assert q1["ltp"] == 1295.40
        assert q1["change"] == 15.40
        assert q1["change_pct"] == 1.2
        assert q1["stale"] is False
        assert mock_fetch.call_count == 1

        # Second call within TTL hits cache
        resp2 = client.get("/api/stocks/RELIANCE/quote")
        assert resp2.status_code == 200
        assert mock_fetch.call_count == 1

    # Simulate TTL expiry by clearing active cache while preserving stale entry
    from app.services import market_data

    with market_data._quote_cache._lock:  # noqa: SLF001
        market_data._quote_cache._cache.clear()  # noqa: SLF001

    with patch("app.services.market_data._fetch_yahoo_chart_meta", side_effect=RuntimeError("Upstream 429")):
        resp3 = client.get("/api/stocks/RELIANCE/quote")
        assert resp3.status_code == 200
        q3 = resp3.json()
        assert q3["ltp"] == 1295.40
        assert q3["stale"] is True


def test_pulse_endpoint() -> None:
    with patch("app.services.market_data._fetch_yahoo_chart_meta", return_value=MOCK_RELIANCE_CHART):
        resp = client.get("/api/stocks/pulse")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 4
        labels = [item["label"] for item in data["items"]]
        assert labels == ["NIFTY 50", "SENSEX", "BANKNIFTY", "INDIA VIX"]
