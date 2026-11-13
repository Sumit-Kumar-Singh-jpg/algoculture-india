from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.services.history_service import clear_history_cache
from app.services.prediction_service import clear_predict_cache

client = TestClient(app)


def setup_function() -> None:
    clear_history_cache()
    clear_predict_cache()


# 30 mock candles
MOCK_30_CANDLES = {
    "timestamp": [1731400000 + i * 300 for i in range(30)],
    "indicators": {
        "quote": [
            {
                "open": [1200.0 + (i * 1.5) for i in range(30)],
                "high": [1205.0 + (i * 1.5) for i in range(30)],
                "low": [1198.0 + (i * 1.5) for i in range(30)],
                "close": [1203.0 + (i * 1.5) for i in range(30)],
                "volume": [10000 + (i * 500) for i in range(30)],
            }
        ]
    },
}


def test_predict_endpoint_intraday() -> None:
    with patch("app.services.history_service._fetch_yahoo_ohlcv", return_value=MOCK_30_CANDLES):
        resp = client.get("/api/stocks/RELIANCE/predict?mode=intraday")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "RELIANCE"
        assert data["mode"] == "intraday"
        assert len(data["forecast"]) == 8
        first_pt = data["forecast"][0]
        assert first_pt["lower_2sigma"] <= first_pt["lower_1sigma"]
        assert first_pt["lower_1sigma"] <= first_pt["predicted"]
        assert first_pt["predicted"] <= first_pt["upper_1sigma"]
        assert first_pt["upper_1sigma"] <= first_pt["upper_2sigma"]
        assert data["metrics"]["directional_accuracy_pct"] >= 40.0
        assert "disclaimer" in data
        assert data.get("stop_loss") is not None
        assert data.get("risk_reward_ratio") is not None
        assert len(data.get("horizons", [])) == 6
        h5m = next(h for h in data["horizons"] if h["horizon_id"] == "5m")
        assert h5m["stop_loss"] > 0
        assert h5m["risk_reward_ratio"] > 0


def test_predict_endpoint_longterm() -> None:
    with patch("app.services.history_service._fetch_yahoo_ohlcv", return_value=MOCK_30_CANDLES):
        resp = client.get("/api/stocks/RELIANCE/predict?mode=longterm")
        assert resp.status_code == 200
        data = resp.json()
        assert data["mode"] == "longterm"
        assert len(data["forecast"]) == 30
        assert data["projected_direction"] in {"BULLISH", "BEARISH", "NEUTRAL"}
