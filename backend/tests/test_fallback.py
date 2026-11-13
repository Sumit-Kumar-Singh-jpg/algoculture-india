from __future__ import annotations

import socket
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.history_service import clear_history_cache
from app.services.market_data import clear_market_caches
from app.services.prediction_service import clear_predict_cache

client = TestClient(app)


def setup_function() -> None:
    clear_history_cache()
    clear_market_caches()
    clear_predict_cache()


def test_quote_dns_failure_fallback() -> None:
    """When Yahoo Finance DNS fails, quote endpoint should return graceful fallback data instead of 502."""
    with patch(
        "app.services.market_data._fetch_yahoo_chart_meta",
        side_effect=socket.gaierror(-3, "Temporary failure in name resolution"),
    ):
        resp = client.get("/api/stocks/BANKNIFTY/quote")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "BANKNIFTY"
        assert data["ltp"] > 0
        assert data["open"] > 0
        assert data["high"] >= data["low"]
        assert data["stale"] is True


def test_history_dns_failure_fallback() -> None:
    """When Yahoo Finance DNS fails, history endpoint should return synthetic candles with indicators."""
    with patch(
        "app.services.history_service._fetch_yahoo_ohlcv",
        side_effect=socket.gaierror(-3, "Temporary failure in name resolution"),
    ):
        resp = client.get("/api/stocks/BANKNIFTY/history?mode=intraday&interval=5m")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "BANKNIFTY"
        assert len(data["candles"]) >= 30
        assert data["stale"] is True
        assert data["candles"][-1]["close"] > 0
        assert data["bias"] is not None


def test_pulse_dns_failure_fallback() -> None:
    """When network fails, market pulse should return fallback items for all 4 key indices."""
    with patch(
        "app.services.market_data._fetch_yahoo_chart_meta",
        side_effect=socket.gaierror(-3, "Temporary failure in name resolution"),
    ):
        resp = client.get("/api/stocks/pulse")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 4
        symbols = [item["symbol"] for item in data["items"]]
        assert "NIFTY" in symbols
        assert "BANKNIFTY" in symbols
