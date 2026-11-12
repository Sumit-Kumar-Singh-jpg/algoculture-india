# PulseTrade India

## What This Is

PulseTrade India is a focused Indian stock market (NSE/BSE) analytics web application designed for Intraday, Futures & Options (F&O), and Long-Term trading. For any selected stock or index, it displays live-polled market data, interactive multi-timeframe charts, horizon-specific AI price prediction charts, and aggregated current and historical stock news from Moneycontrol and other Indian financial media—with zero broker API keys required.

## Core Value

Select any Indian stock and immediately inspect its Intraday, F&O, and Long-Term charts alongside an AI prediction forecast and Moneycontrol-sourced stock news in one clean terminal.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Instant search and selection of any NSE/BSE stock or index (`NIFTY 50`, `BANKNIFTY`, equities)
- [ ] Live-polled price header (LTP, change, % change, day high/low, volume, market open/closed status)
- [ ] Intraday Chart mode (1m/5m/15m/1h candles, VWAP, EMA 9/21, RSI, Volume)
- [ ] F&O Chart & Derivatives mode (underlying chart, live/cached NSE Option Chain OI & Change in OI chart, PCR, Max Pain, ATM IV, expiry selector)
- [ ] Long-Term Chart mode (1D/1W/1M historical charts up to 5Y/Max, 50 & 200 DMA, 52W High/Low)
- [ ] AI Prediction Chart overlay & projection bands tailored to each horizon (Intraday, F&O expected range/direction, Long-Term trend) with walk-forward backtest accuracy metric
- [ ] Stock News Section aggregating current and historical news from Moneycontrol, Economic Times, LiveMint, and Google News RSS with source & date filters

### Out of Scope

- Real-money order execution or broker account login — user explicitly wants charts, AI prediction, and news only
- Portfolio/order-book management or paper-trading order blotter — excluded to keep UI clean and distraction-free
- Paid market data feeds — must operate purely on free public data sources (Yahoo Finance, NSE public endpoints, RSS/news feeds)

## Context

- **Market Ecosystem:** Indian equities (`.NS` for NSE, `.BO` for BSE) and F&O contracts (`NIFTY`, `BANKNIFTY`, `FINNIFTY`, and F&O-eligible stocks). NSE public option-chain APIs enforce cookie/session headers and rate limits, so the backend must handle session priming, TTL caching, and graceful fallback.
- **Tech Stack:** Next.js (TypeScript, Tailwind CSS, TradingView `lightweight-charts`) frontend + Python FastAPI (`yfinance`, `pandas`, `numpy`, `scikit-learn`, `feedparser`, `beautifulsoup4`, `httpx`) backend.
- **Quality Workflow:** Planned with GSD + Ralph PRD, built phase-by-phase, and reviewed via CodeRabbit CLI before each phase completion.

## Constraints

- **Data Cost**: Zero paid API keys — rely strictly on public Yahoo Finance, NSE public endpoints, and public RSS/web news feeds.
- **Compliance/Disclaimers**: AI prediction charts must be clearly labeled as statistical/ML projections for educational/analytical use, not financial advice.
- **Performance**: Cache market quotes (5–15s TTL), option chains (30–60s TTL), historical OHLCV (5–15m TTL), and news (5m TTL) in-memory/SQLite to avoid upstream rate limits.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + FastAPI split | FastAPI gives native access to `yfinance`, `pandas`, `scikit-learn`, and Python scraping/RSS tools; Next.js + TradingView `lightweight-charts` delivers crisp financial charting | — Pending |
| No broker/order UI in v1 | User requested strictly charts (Intraday, F&O, Long-Term), AI prediction chart, and stock news | — Pending |
| Statistical/ML local forecasting | Running Ridge/GradientBoosting + volatility confidence bands locally avoids external LLM/API costs and yields reproducible backtest metrics | — Pending |

---
*Last updated: 2026-11-12 after initial project scoping*
