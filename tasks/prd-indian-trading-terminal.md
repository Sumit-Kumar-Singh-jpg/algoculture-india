# PRD: PulseTrade India — Intraday, F&O & Long-Term Trading Analytics Webapp

## 1. Introduction / Overview

PulseTrade India is a focused, zero-API-key Indian stock market web application for NSE/BSE equities and indices. Traders and investors can select any Indian stock or index (`RELIANCE`, `TCS`, `HDFCBANK`, `NIFTY 50`, `BANKNIFTY`, etc.) and immediately inspect:
1. **Live Market Quote & Multi-Horizon Charts** tailored for **Intraday**, **F&O (Futures & Options)**, and **Long-Term** analysis.
2. **AI Prediction Charts** overlaid on each horizon with upper/lower confidence bands and transparent historical backtest accuracy.
3. **Stock-Specific News Section** pulling current and historical coverage from Moneycontrol, Economic Times, LiveMint, and Google News RSS.

The interface intentionally avoids broker login, order blotters, and account clutter—keeping 100% of screen real estate on charts, AI forecasts, and news.

---

## 2. Goals

- Support instant search across NSE/BSE stocks and major indices (`NIFTY 50`, `BANKNIFTY`, `FINNIFTY`) with <300ms autocomplete response.
- Deliver live-polled quote updates (10s interval during market hours) using free public feeds with resilient TTL caching.
- Provide dedicated, responsive TradingView `lightweight-charts` views for Intraday (`1m`–`1h`), F&O (underlying + Option Chain OI/PCR/Max Pain/IV), and Long-Term (`3M`–`MAX` + DMAs).
- Generate reproducible local ML/statistical price forecasts with 1σ/2σ confidence bands and walk-forward backtest metrics (Directional Accuracy %, MAPE/RMSE).
- Aggregate current and historical stock news from Moneycontrol and peer Indian business outlets with source, date, and sentiment filters.

---

## 3. User Stories

### US-001: Project Monorepo & Health Scaffold
**Description:** As a developer, I want a clean Next.js (TypeScript/Tailwind) frontend and Python FastAPI backend scaffolded in the repository so both services run reliably together.
**Acceptance Criteria:**
- [ ] `backend/` FastAPI app starts via `uvicorn` and exposes `GET /api/health` returning `{"status": "ok"}`.
- [ ] `frontend/` Next.js App Router (TypeScript + Tailwind CSS) builds cleanly with `npm run build` and `tsc --noEmit`.
- [ ] CORS is configured between frontend (`localhost:3000`) and backend (`localhost:8000`).
- [ ] Typecheck and Python lint/syntax checks pass.

### US-002: NSE/BSE Stock Search & Live Quote API
**Description:** As a user, I want to search any NSE/BSE stock or index and fetch its live price quote so I can switch stocks effortlessly.
**Acceptance Criteria:**
- [ ] `GET /api/stocks/search?q=<query>` returns matching NSE/BSE symbols, company names, exchange (`NSE`/`BSE`/`INDEX`), and `is_fno` eligibility flag.
- [ ] `GET /api/stocks/{symbol}/quote` returns LTP, change, percent change, open, high, low, prev close, volume, 52W high/low, market status, and cache timestamp.
- [ ] Backend implements TTL caching (10s for quotes, 24h for symbol list) and falls back to last cached quote on upstream errors.
- [ ] Backend unit tests for search and quote caching pass.

### US-003: Terminal Shell, Stock Search Bar & Live Quote Header UI
**Description:** As a trader, I want a dark-mode terminal header with instant stock search and an auto-refreshing live quote bar so I always see real-time context for my selected stock.
**Acceptance Criteria:**
- [ ] Search input supports keyboard navigation, debounced queries, and quick-pick chips for `NIFTY 50`, `BANKNIFTY`, `RELIANCE`, `TCS`, `HDFCBANK`.
- [ ] Live Quote Bar displays LTP (₹), green/red delta, day range, volume, and NSE market status badge (`LIVE` / `CLOSED`) polling every 10s.
- [ ] Typecheck passes.
- [ ] Verify in browser: searching and selecting a stock updates the quote header without page reload.

### US-004: Multi-Horizon OHLCV & Technical Indicators API
**Description:** As a trader, I want historical and intraday OHLCV candle data with pre-computed indicators so Intraday and Long-Term charts render fast and accurately.
**Acceptance Criteria:**
- [ ] `GET /api/stocks/{symbol}/history?mode=intraday|longterm&interval=...&range=...` returns OHLCV candles plus computed `VWAP`, `EMA9`, `EMA21`, `SMA50`, `SMA200`, and `RSI14`.
- [ ] Supports Intraday intervals (`1m`, `5m`, `15m`, `1h`) and Long-Term ranges (`3mo`, `6mo`, `1y`, `3y`, `5y`, `max`).
- [ ] Handles market holidays/weekends cleanly by returning the most recent trading session's intraday data with a clear session date label.
- [ ] Unit tests for indicator calculations and response schema pass.

### US-005: Intraday & Long-Term Interactive Charts UI
**Description:** As a trader, I want separate Intraday and Long-Term chart tabs using TradingView Lightweight Charts so I can analyze short-term momentum and multi-year trends.
**Acceptance Criteria:**
- [ ] Mode tabs switch cleanly between `Intraday`, `F&O`, and `Long-Term`.
- [ ] Intraday tab provides `1m`, `5m`, `15m`, `1h` interval pills and toggleable `VWAP`, `EMA 9/21`, Volume, and `RSI(14)` sub-pane.
- [ ] Long-Term tab provides `3M`, `6M`, `1Y`, `3Y`, `5Y`, `MAX` range pills and toggleable `50 DMA`, `200 DMA`, and `52W High/Low` price lines.
- [ ] Typecheck passes.
- [ ] Verify in browser: switching timeframes and toggling indicators updates the chart smoothly with crosshair OHLC tooltip.

### US-006: NSE F&O Option Chain & Derivatives Analytics API
**Description:** As an F&O trader, I want live/cached NSE option chain data with PCR, Max Pain, and ATM IV for F&O-eligible stocks and indices.
**Acceptance Criteria:**
- [ ] `GET /api/stocks/{symbol}/fno?expiry=...` fetches NSE public option chain (with cookie/session priming + 45s TTL cache) and returns available expiries, strike-level Call/Put OI, Change in OI, LTP, and IV.
- [ ] Computes Put-Call Ratio (PCR), Max Pain strike, highest Call OI resistance, highest Put OI support, and ATM IV.
- [ ] Non-F&O symbols return structured `{"fno_eligible": false, "message": "..."}` cleanly with HTTP 200.
- [ ] Unit tests covering Max Pain, PCR math, and non-F&O handling pass.

### US-007: F&O Chart & Option Chain Analytics UI
**Description:** As an F&O trader, I want an F&O tab displaying the underlying price chart alongside strike-wise Call/Put OI bars, PCR, Max Pain, and expiry selector.
**Acceptance Criteria:**
- [ ] F&O tab displays key metrics cards: Spot Price, PCR, Max Pain Strike, Call Resistance, Put Support, and ATM IV.
- [ ] Renders a strike-wise Call OI vs. Put OI bar chart centered around ATM strikes plus an expandable Option Chain table.
- [ ] Expiry dropdown reloads option chain data for the selected expiry; non-F&O stocks show a clear notice and quick links to F&O stocks.
- [ ] Typecheck passes.
- [ ] Verify in browser: F&O data renders properly for `NIFTY` and `RELIANCE`, and gracefully handles a non-F&O stock.

### US-008: AI Price Prediction Engine & Backtest API
**Description:** As a trader, I want a backend forecasting API that generates horizon-specific AI price predictions and walk-forward backtest accuracy scores for any stock.
**Acceptance Criteria:**
- [ ] `GET /api/stocks/{symbol}/predict?mode=intraday|fno|longterm` runs a local ML/statistical pipeline (lagged returns, RSI, EMA slope, volatility regime via Ridge / GradientBoosting + volatility cone) to produce future timestamps, predicted price, `upper_1sigma`, `lower_1sigma`, `upper_2sigma`, `lower_2sigma`.
- [ ] Returns walk-forward validation metrics (`directional_accuracy_pct`, `mape_pct`, `rmse`, `model_summary`) evaluated on recent out-of-sample candles.
- [ ] Response executes in <1.5s and caches per `(symbol, mode)` for 5–15 minutes.
- [ ] Unit tests verify output shapes, confidence band ordering (`lower_2sigma <= lower_1sigma <= predicted <= upper_1sigma <= upper_2sigma`), and backtest bounds.

### US-009: AI Prediction Chart Overlay & Metrics UI
**Description:** As a trader, I want to see the AI Prediction Chart overlaid onto (or compared alongside) my Intraday, F&O, and Long-Term charts so I can visualize expected direction and risk bands.
**Acceptance Criteria:**
- [ ] Toggleable "AI Prediction" overlay extends the active chart with a distinct dashed forecast line and shaded 1σ/2σ confidence bands.
- [ ] Dedicated AI Forecast summary bar displays predicted target, expected % move, Directional Accuracy %, MAPE, and an explicit `"Statistical/ML Projection — Not Financial Advice"` disclaimer.
- [ ] Typecheck passes.
- [ ] Verify in browser: toggling AI Prediction renders forecast bands across Intraday, F&O, and Long-Term tabs.

### US-010: Moneycontrol & Multi-Source Stock News Aggregator API
**Description:** As an investor/trader, I want a backend news API that fetches both current and historical news for the selected stock from Moneycontrol, Economic Times, LiveMint, and Google News RSS.
**Acceptance Criteria:**
- [ ] `GET /api/stocks/{symbol}/news?timeframe=today|7d|30d|all&source=all|moneycontrol|et|livemint` fetches, normalizes, and deduplicates articles matching the stock's company name/symbol.
- [ ] Moneycontrol RSS/search feed + Economic Times + LiveMint + Google News RSS (`site:moneycontrol.com` / stock query for historical depth) are combined with 5-minute TTL caching.
- [ ] Each article includes `title`, `url`, `source`, `published_at`, `summary`, and rule/lexicon-based financial `sentiment` (`Bullish` | `Bearish` | `Neutral`).
- [ ] Unit tests cover deduplication, timeframe filtering, and sentiment classification.

### US-011: Stock News Feed Panel UI
**Description:** As a trader, I want a clean News Section right below or beside the charts showing current and historical news for the selected stock with source, timeframe, and sentiment filters.
**Acceptance Criteria:**
- [ ] News panel displays article headline, source badge (Moneycontrol, ET, LiveMint, etc.), relative/formatted date, sentiment pill, and clickable external link.
- [ ] Filter controls allow switching timeframe (`Today`, `7D`, `30D`, `Historical`) and source (`All`, `Moneycontrol`, `ET`, `LiveMint`).
- [ ] Switching the active stock automatically refreshes the News panel with a skeleton loading state.
- [ ] Typecheck passes.
- [ ] Verify in browser: news loads for selected stocks and filters update the visible list cleanly.

---

## 4. Functional Requirements

- **FR-1**: System must operate without requiring user-supplied API keys or broker logins.
- **FR-2**: All prices must display in Indian Rupees (`₹`) using Indian numbering formatting where appropriate, with IST (`Asia/Kolkata`) timestamps.
- **FR-3**: Switching stocks must update the Quote Header, Active Chart (`Intraday`/`F&O`/`Long-Term`), AI Prediction, and Stock News synchronously.
- **FR-4**: Upstream network failures (e.g., NSE throttling) must never crash the UI; cached data or clear retryable status banners must be shown.
- **FR-5**: CodeRabbit CLI review (`coderabbit review --agent`) must be executed after each phase to catch bugs, security risks, and code quality issues.

---

## 5. Non-Goals (Out of Scope)

- Real-money trading, broker OAuth, or order execution.
- Paper trading portfolio, virtual cash ledger, or buy/sell order tickets.
- User accounts, authentication, or paid subscription gating.

---

## 6. Suggested Optional Additions (For User Review)

To enhance usability without violating the "charts + AI prediction + news only" focus, the following lightweight additions are proposed for user sign-off:
1. **News Event Pins on Long-Term Chart** — Overlay small clickable `N` markers on historical candles corresponding to major Moneycontrol news dates so users can see *why* a stock rallied or crashed.
2. **Quick Technical & F&O Bias Meter** — A single compact summary pill (`Strong Bullish` / `Neutral` / `Bearish`) computed from RSI, EMA crossover, VWAP, and PCR.
3. **Local Watchlist Strip (`localStorage`)** — Pin 5–10 favorite stocks/indices for 1-click switching without re-searching.
4. **Market Pulse Top Bar** — Compact live ticker showing `NIFTY 50`, `SENSEX`, `BANKNIFTY`, and `INDIA VIX`.

---

## 7. Technical Considerations

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, `lightweight-charts` (TradingView), `lucide-react`.
- **Backend**: Python 3.11+, FastAPI, `uvicorn`, `yfinance`, `pandas`, `numpy`, `scikit-learn`, `httpx`, `feedparser`, `beautifulsoup4`, `cachetools`.
- **NSE Scraping Resilience**: NSE option-chain endpoints require browser-like headers and cookie priming from `https://www.nseindia.com` before querying `/api/option-chain-indices` or `/api/option-chain-equities`.

---

## 8. Success Metrics

- Stock switch end-to-end load time (Quote + Chart + AI Prediction + News) < 2.5s on warm cache.
- Zero critical/major CodeRabbit findings remaining at v1 completion.
- All 11 user stories verified in a live browser session.
