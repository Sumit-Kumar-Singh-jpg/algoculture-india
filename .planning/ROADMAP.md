# Roadmap: PulseTrade India

## Overview

PulseTrade India will be built in four focused phases—starting with the Next.js + FastAPI scaffold and NSE/BSE live quote/search pipeline, followed by multi-horizon TradingView charts (Intraday, F&O Option Chain, Long-Term), the horizon-aware AI prediction engine with confidence bands and backtest metrics, and finally the Moneycontrol & Indian financial news aggregator. CodeRabbit review runs at the end of each phase before advancing.

## Phases

- [ ] **Phase 1: Foundation & Live Market Data** - Monorepo scaffold (Next.js + FastAPI), NSE/BSE symbol search, TTL-cached Yahoo Finance/NSE quote endpoints, and live header UI.
- [ ] **Phase 2: Intraday, F&O & Long-Term Charts** - TradingView Lightweight Charts for Intraday (`1m`–`1h` + VWAP/EMA/RSI), F&O Option Chain & OI analytics (PCR, Max Pain, IV), and Long-Term (`3M`–`MAX` + 50/200 DMA).
- [ ] **Phase 3: AI Prediction Engine & Forecast Charts** - Local ML/statistical price forecasting per horizon with 1σ/2σ confidence cones, walk-forward backtest accuracy, and overlay/split forecast UI.
- [ ] **Phase 4: Moneycontrol & Multi-Source News Engine** - Stock-specific current & historical news scraper/RSS aggregator (Moneycontrol, ET, LiveMint, Google News), sentiment tagging, and interactive News Panel (+ CodeRabbit final review).

## Phase Details

### Phase 1: Foundation & Live Market Data
**Goal**: Users can search any NSE/BSE stock or index and see a live-polled quote header, Market Pulse top ticker (`NIFTY 50`, `SENSEX`, `BANKNIFTY`, `INDIA VIX`), and 1-click Local Watchlist backed by a cached FastAPI service.
**Depends on**: Nothing (first phase)
**Requirements**: MKT-01, MKT-02, MKT-03, OPT-03, OPT-04
**Success Criteria** (what must be TRUE):
  1. FastAPI `/api/health`, `/api/stocks/search?q=...`, and `/api/stocks/{symbol}/quote` return live NSE/BSE stock data with TTL caching and graceful fallback.
  2. Next.js dark-theme terminal shell loads with a debounced stock search bar supporting NSE/BSE equities and indices (`NIFTY 50`, `BANKNIFTY`).
  3. Live Quote Bar displays LTP, change, % change, day range, volume, market open/closed badge, and auto-polls every 10s.
  4. CodeRabbit CLI review passes with zero critical/major findings.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Initialize FastAPI backend + Next.js TypeScript Tailwind frontend scaffold
- [ ] 01-02: Implement NSE/BSE symbol catalog, search endpoint, and TTL-cached quote service
- [ ] 01-03: Build Terminal Shell, Stock Search Bar, and auto-polling Live Quote Header

### Phase 2: Intraday, F&O & Long-Term Charts
**Goal**: Users can switch seamlessly between Intraday, F&O, and Long-Term tabs for the selected stock and inspect interactive charts and derivatives data.
**Depends on**: Phase 1
**Requirements**: CHT-01, CHT-02, CHT-03, OPT-02
**Success Criteria** (what must be TRUE):
  1. Intraday tab renders `1m`/`5m`/`15m`/`1h` candlesticks with Volume, VWAP, EMA 9/21, and RSI(14).
  2. F&O tab renders underlying price chart plus Call/Put OI bar chart by strike, Expiry selector, PCR, Max Pain, and ATM IV (or clear non-F&O message).
  3. Long-Term tab renders `3M`/`6M`/`1Y`/`3Y`/`5Y`/`MAX` candlesticks with 50 DMA, 200 DMA, and 52W High/Low markers.
  4. Quick Technical & F&O Bias Strip displays Bullish/Neutral/Bearish gauge above the chart.
  5. CodeRabbit CLI review passes with zero critical/major findings.
**Plans**: 3 plans

Plans:
- [ ] 02-01: Build FastAPI OHLCV + technical indicator endpoint and NSE Option Chain parser
- [ ] 02-02: Implement TradingView Lightweight Charts component for Intraday & Long-Term modes
- [ ] 02-03: Build F&O Derivatives & Option Chain OI visualization panel

### Phase 3: AI Prediction Engine & Forecast Charts
**Goal**: Every trading mode displays an AI-generated price forecast chart with confidence intervals and transparent historical backtest accuracy.
**Depends on**: Phase 2
**Requirements**: AIP-01, AIP-02, AIP-03
**Success Criteria** (what must be TRUE):
  1. Backend generates horizon-specific forecasts (Intraday next-candles, F&O expected range cone, Long-Term 30/90-day trajectory) using historical OHLCV + technical features.
  2. Each forecast includes 1σ/2σ upper/lower bands and walk-forward directional accuracy % + MAPE/RMSE metrics.
  3. Frontend renders the AI Prediction dashed trajectory & shaded confidence zone on the chart with a non-advisory badge and model metrics card.
  4. CodeRabbit CLI review passes with zero critical/major findings.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Implement Python ML/statistical forecasting module and `/api/stocks/{symbol}/predict` endpoint
- [ ] 03-02: Integrate AI Forecast overlay, confidence bands, and backtest accuracy display into chart UI

### Phase 4: Moneycontrol & Multi-Source News Engine
**Goal**: Users can read current and historical stock-specific news from Moneycontrol and Indian financial feeds with timeframe, source, and sentiment filters.
**Depends on**: Phase 1
**Requirements**: NWS-01, NWS-02, NWS-03, OPT-01
**Success Criteria** (what must be TRUE):
  1. Backend aggregates and deduplicates stock-specific current and historical articles from Moneycontrol, Economic Times, LiveMint, and Google News RSS.
  2. News items carry source badges, relative/absolute timestamps, and Bullish/Bearish/Neutral sentiment tags.
  3. News panel supports filtering by timeframe (Today, 7D, 30D, Historical) and source, and opens full articles externally.
  4. News Event Pins plot major news dates on the Long-Term chart so users can correlate price moves with headlines.
  5. Full end-to-end verification and final CodeRabbit CLI review pass cleanly.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Build Moneycontrol & multi-source RSS/news aggregator with sentiment scoring endpoint
- [ ] 04-02: Build Stock News feed panel with source/date/sentiment filters and verify full app

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Live Market Data | 3/3 | Complete | 2026-11-12 |
| 2. Intraday, F&O & Long-Term Charts | 3/3 | Complete | 2026-11-12 |
| 3. AI Prediction Engine & Forecast Charts | 2/2 | Complete | 2026-11-12 |
| 4. Moneycontrol & Multi-Source News Engine | 2/2 | Complete | 2026-11-12 |
