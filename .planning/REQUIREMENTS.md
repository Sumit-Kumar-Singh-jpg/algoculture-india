# Requirements: PulseTrade India

**Defined:** 2026-11-12
**Core Value:** Select any Indian stock and immediately inspect its Intraday, F&O, and Long-Term charts alongside an AI prediction forecast and Moneycontrol-sourced stock news in one clean terminal.

## v1 Requirements

### Stock Discovery & Live Market Data (MKT)

- [ ] **MKT-01**: User can search and select any NSE/BSE stock or index by symbol or company name (with debounced autocomplete and NSE/BSE exchange badge).
- [ ] **MKT-02**: Live quote bar displays LTP, absolute/percentage change, Day Open/High/Low/Prev Close, Volume, and NSE market status (Pre-Open / Open / Closed) with auto-refresh polling every 10 seconds during market hours.
- [ ] **MKT-03**: Backend caches upstream Yahoo Finance / NSE responses with TTLs and gracefully degrades with cached timestamps if an upstream source throttles.

### Multi-Horizon Trading Charts (CHT)

- [ ] **CHT-01**: **Intraday Mode** renders interactive candlesticks (`1m`, `5m`, `15m`, `1h`) via TradingView `lightweight-charts` with volume histogram, VWAP, EMA 9/21, and RSI(14) toggleable indicators.
- [ ] **CHT-02**: **F&O Mode** renders the underlying F&O chart alongside an Option Chain analytics panel showing Call vs. Put Open Interest (OI) & Change in OI by strike, Expiry selector, Put-Call Ratio (PCR), Max Pain strike, and ATM Implied Volatility (IV), plus clear messaging when a selected stock is not F&O-eligible.
- [ ] **CHT-03**: **Long-Term Mode** renders daily/weekly/monthly historical candlesticks (`3M`, `6M`, `1Y`, `3Y`, `5Y`, `MAX`) with 50 DMA, 200 DMA, and 52-Week High/Low markers.

### AI Prediction Charts (AIP)

- [ ] **AIP-01**: For each selected horizon (Intraday next-candles, F&O expected expiry/session range cone, Long-Term 30/90-day trajectory), backend computes a forecasted price series with upper/lower confidence bands (1σ / 2σ) using historical OHLCV + technical features.
- [ ] **AIP-02**: AI Prediction chart displays the forecast dashed line and shaded confidence zone directly extending the price chart (or side-by-side comparison toggle) with a clear "Statistical/ML Forecast — Not Financial Advice" badge.
- [ ] **AIP-03**: Backend computes a walk-forward backtest accuracy score (Directional Accuracy % and MAPE/RMSE on recent held-out candles) and displays a confidence rating on the chart header.

### Stock News & History (NWS)

- [ ] **NWS-01**: News feed fetches current and historical news specifically for the selected stock/company from Moneycontrol, Economic Times, LiveMint, and Google News RSS.
- [ ] **NWS-02**: Users can filter news by timeframe (Today, 7 Days, 30 Days, Historical) and source (All, Moneycontrol, ET, LiveMint, Others), and open original articles in a new tab.
- [ ] **NWS-03**: Each news item includes a lightweight sentiment badge (Bullish / Bearish / Neutral) computed via headline/summary polarity scoring.

### Active Scope Additions (Approved)

- [ ] **OPT-01**: **News Event Pins on Long-Term Chart** — Plot major news headlines directly on Long-Term candlesticks so users can correlate price spikes/drops with news dates.
- [ ] **OPT-02**: **Quick Technical & F&O Bias Strip** — Compact Bullish/Neutral/Bearish gauge summarizing RSI, MACD/EMA, VWAP, 50/200 DMA, and PCR at a glance.
- [ ] **OPT-03**: **Local Watchlist Sidebar/Strip** — Save favorite NSE stocks and indices (`NIFTY 50`, `BANKNIFTY`, `RELIANCE`, `TCS`, etc.) in browser `localStorage` for 1-click switching.
- [ ] **OPT-04**: **Market Pulse Top Ticker** — Live strip showing `NIFTY 50`, `SENSEX`, `BANKNIFTY`, and `INDIA VIX`.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-money order placement / Broker login | Excluded by user; pure analytics, charts, AI prediction, and news |
| Paper trading / Portfolio tracker | Excluded to avoid UI clutter beyond charts & news |
| Paid data vendor subscriptions | Must work out-of-the-box with zero API keys |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MKT-01, MKT-02, MKT-03, OPT-03, OPT-04 | Phase 1: Foundation & Live Market Data | Complete |
| CHT-01, CHT-02, CHT-03, OPT-02 | Phase 2: Intraday, F&O & Long-Term Charts | Complete |
| AIP-01, AIP-02, AIP-03 | Phase 3: AI Prediction Engine & Forecast Charts | Complete |
| NWS-01, NWS-02, NWS-03, OPT-01 | Phase 4: Moneycontrol & Multi-Source News Engine | In Progress |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-11-12*
*Last updated: 2026-11-12 after initial project creation*
