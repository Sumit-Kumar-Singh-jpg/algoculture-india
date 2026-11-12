from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

MOCK_HISTORY_PAYLOAD = {
    "timestamp": [1731405600, 1731405900, 1731406200, 1731406500, 1731406800],
    "indicators": {
        "quote": [
            {
                "open": [1280.0, 1282.0, 1285.0, 1284.0, 1288.0],
                "high": [1284.0, 1286.0, 1288.0, 1289.0, 1292.0],
                "low": [1279.0, 1281.0, 1283.0, 1282.0, 1286.0],
                "close": [1283.0, 1285.0, 1284.0, 1288.0, 1291.0],
                "volume": [10000, 15000, 20000, 12000, 25000],
            }
        ]
    },
}


def test_history_endpoint_intraday() -> None:
    with patch("app.services.history_service._fetch_yahoo_ohlcv", return_value=MOCK_HISTORY_PAYLOAD):
        resp = client.get("/api/stocks/RELIANCE/history", params={"mode": "intraday", "interval": "5m"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "RELIANCE"
        assert data["mode"] == "intraday"
        assert len(data["candles"]) == 5
        assert data["candles"][0]["close"] == 1283.0
        assert data["candles"][-1]["vwap"] is not None
        assert data["candles"][-1]["ema9"] is not None
        assert "bias" in data
        assert data["bias"]["bias"] in {"BULLISH", "BEARISH", "NEUTRAL"}


def test_history_endpoint_longterm() -> None:
    with patch("app.services.history_service._fetch_yahoo_ohlcv", return_value=MOCK_HISTORY_PAYLOAD):
        resp = client.get("/api/stocks/RELIANCE/history", params={"mode": "longterm", "range": "1y"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["mode"] == "longterm"
        assert data["range"] == "1y"
        assert len(data["candles"]) == 5


def test_fno_endpoint_eligible_symbol() -> None:
    resp = client.get("/api/stocks/NIFTY/fno")
    assert resp.status_code == 200
    data = resp.json()
    assert data["symbol"] == "NIFTY"
    assert data["fno_eligible"] is True
    assert data["pcr"] is not None
    assert data["max_pain"] is not None
    assert len(data["strikes"]) > 0


def test_fno_endpoint_non_fno_symbol() -> None:
    resp = client.get("/api/stocks/SUZLON/fno")
    assert resp.status_code == 200
    data = resp.json()
    assert data["symbol"] == "SUZLON"
    assert data["fno_eligible"] is False
    assert "not in the NSE F&O segment" in data["message"]
