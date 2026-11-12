from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.services.news_service import clear_news_cache

client = TestClient(app)

MOCK_RAW_ARTICLES = [
    {
        "title": "Reliance Industries Q2 Profit Rallies 12% on Telecom Surge",
        "url": "https://www.moneycontrol.com/news/business/reliance-q2-profit-123.html",
        "source": "Moneycontrol",
        "published_at": "12 Nov 2026, 10:00 UTC",
        "published_iso": "2026-11-12T10:00:00+00:00",
        "time_sec": 1794477600,
        "summary": "Reliance Industries reports stellar earnings growth as Jio subscriber base expands.",
    },
    {
        "title": "Analysts Maintain Buy on Reliance With Upgraded Target Price",
        "url": "https://economictimes.indiatimes.com/markets/stocks/news/reliance-buy.html",
        "source": "Economic Times",
        "published_at": "11 Nov 2026, 08:30 UTC",
        "published_iso": "2026-11-11T08:30:00+00:00",
        "time_sec": 1794385800,
        "summary": "Brokerages maintain bullish outlook citing oil-to-chemicals stabilization.",
    },
    {
        "title": "Petrochemical Margins Slump as Debt Lingers for Oil Majors",
        "url": "https://www.livemint.com/market/mark-to-market/petrochem-slump.html",
        "source": "LiveMint",
        "published_at": "05 Nov 2026, 06:15 UTC",
        "published_iso": "2026-11-05T06:15:00+00:00",
        "time_sec": 1793868900,
        "summary": "Global refining spread weakness creates headwind for refining companies.",
    },
]


def setup_function() -> None:
    clear_news_cache()


def test_news_endpoint_aggregates_and_scores_sentiment() -> None:
    with patch("app.services.news_service._fetch_rss_articles", return_value=MOCK_RAW_ARTICLES):
        resp = client.get("/api/stocks/RELIANCE/news")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "RELIANCE"
        assert data["total_articles"] == 3
        first = data["articles"][0]
        assert first["source"] == "Moneycontrol"
        assert first["sentiment"] == "BULLISH"
        assert data["sentiment_breakdown"]["BULLISH"] >= 1


def test_news_endpoint_source_filter() -> None:
    with patch("app.services.news_service._fetch_rss_articles", return_value=MOCK_RAW_ARTICLES):
        resp = client.get("/api/stocks/RELIANCE/news", params={"source": "moneycontrol"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_articles"] == 1
        assert data["articles"][0]["source"] == "Moneycontrol"
