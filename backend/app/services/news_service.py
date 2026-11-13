from __future__ import annotations

import hashlib
import re
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Any

import feedparser
import httpx
from bs4 import BeautifulSoup

from app.config import NEWS_TTL_SECONDS, USER_AGENT
from app.data.symbols import resolve_symbol
from app.models import NewsArticleItem, StockNewsResponse
from app.services.cache import ResilientTTLCache

_news_cache = ResilientTTLCache(maxsize=128, ttl=NEWS_TTL_SECONDS)

# Positive & negative financial sentiment lexicon
BULLISH_KEYWORDS = frozenset([
    "rally", "surge", "gain", "jumps", "soar", "profit", "growth", "upgrade",
    "bull", "bullish", "record high", "dividend", "q2 net up", "q3 net up",
    "q4 net up", "revenue up", "order win", "contract", "target raised",
    "outperform", "buy rating", "strong", "beat", "positive", "high"
])

BEARISH_KEYWORDS = frozenset([
    "plunge", "fall", "drop", "slump", "loss", "crash", "downgrade", "bear",
    "bearish", "record low", "q2 net down", "q3 net down", "q4 net down",
    "revenue down", "penalty", "fraud", "investigation", "target cut",
    "underperform", "sell rating", "weak", "miss", "negative", "low", "debt"
])

# Public RSS & news endpoints
MONEYCONTROL_RSS = "https://www.moneycontrol.com/rss/MCtopnews.xml"
MONEYCONTROL_STOCK_FEED = "https://www.moneycontrol.com/rss/latestnews.xml"
GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"


def _clean_html(raw_html: str) -> str:
    soup = BeautifulSoup(raw_html, "html.parser")
    text = soup.get_text(separator=" ").strip()
    return re.sub(r"\s+", " ", text)


def _compute_sentiment(headline: str, summary: str) -> tuple[str, float]:
    content = f"{headline.lower()} {summary.lower()}"
    bull_count = sum(1 for kw in BULLISH_KEYWORDS if kw in content)
    bear_count = sum(1 for kw in BEARISH_KEYWORDS if kw in content)

    if bull_count > bear_count:
        score = min(1.0, 0.3 + (bull_count - bear_count) * 0.25)
        return "BULLISH", round(score, 2)
    if bear_count > bull_count:
        score = max(-1.0, -0.3 - (bear_count - bull_count) * 0.25)
        return "BEARISH", round(score, 2)
    return "NEUTRAL", 0.0


def _parse_pubdate(entry: Any) -> tuple[str, str, int]:
    time_struct = entry.get("published_parsed")
    if time_struct:
        dt = datetime(*time_struct[:6], tzinfo=timezone.utc)
    else:
        dt = datetime.now(timezone.utc)
    sec = int(dt.timestamp())
    iso = dt.isoformat()
    formatted = dt.strftime("%d %b %Y, %H:%M UTC")
    return formatted, iso, sec


def _fetch_rss_articles(url: str, default_source: str) -> list[dict[str, Any]]:
    headers = {"User-Agent": USER_AGENT}
    with httpx.Client(timeout=8.0, headers=headers, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()
        raw_xml = resp.text

    feed = feedparser.parse(raw_xml)
    articles: list[dict[str, Any]] = []

    for entry in feed.entries:
        title = entry.get("title", "").strip()
        link = entry.get("link", "").strip()
        raw_desc = entry.get("summary") or entry.get("description") or ""
        clean_desc = _clean_html(raw_desc)
        formatted_date, date_iso, time_sec = _parse_pubdate(entry)

        # Detect publication source
        src = default_source
        if "moneycontrol" in link.lower() or "moneycontrol" in title.lower():
            src = "Moneycontrol"
        elif "economictimes" in link.lower() or "economic times" in title.lower():
            src = "Economic Times"
        elif "livemint" in link.lower() or "mint" in title.lower():
            src = "LiveMint"

        articles.append({
            "title": title,
            "url": link,
            "source": src,
            "published_at": formatted_date,
            "published_iso": date_iso,
            "time_sec": time_sec,
            "summary": clean_desc[:280] + ("..." if len(clean_desc) > 280 else ""),
        })

    return articles


def get_stock_news(
    raw_symbol: str,
    timeframe: str = "all",
    source_filter: str = "all",
) -> StockNewsResponse:
    canonical, yahoo_symbol, name, exchange, is_fno, is_index = resolve_symbol(raw_symbol)

    cache_key = f"news:{canonical}"

    def _fetch_and_aggregate() -> list[NewsArticleItem]:
        # Formulate query for Moneycontrol / Google News RSS
        search_kw = name if len(name.split()) <= 3 else canonical
        query_str = f"{search_kw} stock moneycontrol OR {canonical} share"
        encoded_query = urllib.parse.quote(query_str)

        all_raw: list[dict[str, Any]] = []

        # 1. Google News Indian Financial RSS query
        try:
            g_url = GOOGLE_NEWS_RSS.format(query=encoded_query)
            all_raw.extend(_fetch_rss_articles(g_url, "Google News"))
        except Exception:
            pass

        # 2. Moneycontrol dedicated latest news RSS
        try:
            all_raw.extend(_fetch_rss_articles(MONEYCONTROL_STOCK_FEED, "Moneycontrol"))
        except Exception:
            pass

        # Deduplicate by clean title hash
        seen_titles: set[str] = set()
        items: list[NewsArticleItem] = []

        for raw in all_raw:
            norm_title = re.sub(r"[^\w\s]", "", raw["title"].lower()).strip()
            if not norm_title or norm_title in seen_titles:
                continue
            seen_titles.add(norm_title)

            # Sentiment scoring
            sentiment, score = _compute_sentiment(raw["title"], raw["summary"])

            art_id = hashlib.md5(norm_title.encode("utf-8")).hexdigest()[:12]

            items.append(
                NewsArticleItem(
                    id=art_id,
                    title=raw["title"],
                    url=raw["url"],
                    source=raw["source"],
                    published_at=raw["published_at"],
                    published_iso=raw["published_iso"],
                    time_sec=raw["time_sec"],
                    summary=raw["summary"],
                    sentiment=sentiment,
                    sentiment_score=score,
                )
            )

        # Sort by publication date newest first
        items.sort(key=lambda a: a.time_sec, reverse=True)
        return items

    try:
        articles, cached_at, stale = _news_cache.get_or_fetch(cache_key, _fetch_and_aggregate)
    except Exception:
        articles, cached_at, stale = [], datetime.now(timezone.utc).isoformat(), True

    # Apply timeframe filter
    now_sec = int(datetime.now(timezone.utc).timestamp())
    filtered = articles

    if timeframe == "today":
        cutoff = now_sec - 86400
        filtered = [a for a in filtered if a.time_sec >= cutoff]
    elif timeframe == "7d":
        cutoff = now_sec - (7 * 86400)
        filtered = [a for a in filtered if a.time_sec >= cutoff]
    elif timeframe == "30d":
        cutoff = now_sec - (30 * 86400)
        filtered = [a for a in filtered if a.time_sec >= cutoff]

    # Apply source filter
    if source_filter.lower() != "all":
        s_lower = source_filter.lower()
        filtered = [a for a in filtered if s_lower in a.source.lower()]

    # Sentiment breakdown
    breakdown = {"BULLISH": 0, "BEARISH": 0, "NEUTRAL": 0}
    for a in filtered:
        breakdown[a.sentiment] = breakdown.get(a.sentiment, 0) + 1

    return StockNewsResponse(
        symbol=canonical,
        name=name,
        timeframe=timeframe,
        source_filter=source_filter,
        total_articles=len(filtered),
        sentiment_breakdown=breakdown,
        articles=filtered,
        as_of=cached_at,
        stale=stale,
    )
def clear_news_cache() -> None:
    _news_cache.clear()
