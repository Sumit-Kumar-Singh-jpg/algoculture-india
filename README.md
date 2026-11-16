# AlgoCulture India — Real-Time Indian Trading & Analytics Terminal

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TradingView](https://img.shields.io/badge/Charts-TradingView%20Lightweight%20Charts-blue)](https://tradingview.github.io/lightweight-charts/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Auth%20%26%20Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**AlgoCulture India** is an institutional-grade, real-time trading and quantitative analytics terminal specifically designed for the Indian stock market (NSE / BSE). It integrates interactive financial charting, a complete TradingView-style interactive drawing canvas studio, an ultra-low latency pooled data engine, a suite of 22+ technical indicators, machine-learning-driven multi-horizon price predictions, F&O option chain analytics, and live financial news sentiment analysis.

---

## ✨ Core Features

### ⚡ Ultra-Low Latency Market Data & Real-Time Bar Fusion
- **Persistent HTTP Connection Pooling**: Direct HTTP fast-path to Yahoo Finance JSON endpoints via persistent `httpx.Client` with keep-alive connection pooling, bypassing slow cookie/crumb negotiation:
  - **Quote Latency**: Reduced from ~7.87s to **0.28s** (28x faster).
  - **Candle History Latency (369 bars)**: Reduced from ~9.85s to **0.83s** (12x faster).
- **Exchange Lag Compensation**: Real-time forming bar synthesis (`Math.floor(now / intervalSec) * intervalSec`) fused with live market quote prices (`regularMarketPrice`), overcoming the 15-minute delayed data barrier on free Indian equity feeds.
- **Microsecond Frontend Incremental Updates**: Decoupled live polling from heavy chart `setData()`. Uses TradingView Lightweight Charts' native `candleSeries.update()` for `< 1ms` price tick refreshes with zero layout thrashing or indicator recalculation overhead.

---

### 🎨 TradingView-Style Interactive Drawing Studio
- **Dual Launch Points**: Access via the chart header button or the inline OHLC legend bar.
- **Left Drawing Tools Rail**:
  - **Crosshair / Cursor**: Inspect candles, volume, and price coordinates.
  - **Freehand Pencil / Brush**: Draw custom price waves, projections, and annotations.
  - **Trendline Tool**: Plot angled support and resistance trendlines.
  - **Horizontal Price Line**: 1-click support/resistance key level plotting with price tags.
  - **Rectangle Supply / Demand Box**: Mark order blocks and consolidation zones.
  - **Text Annotations**: Add notes directly onto the canvas.
  - **Measurement Ruler**: Measure point spreads, candle counts, and percentage price changes.
  - **Styling Controls**: 6-color palette (Cyan, Emerald, Rose, Amber, Purple, White) and stroke width selector (1px, 2px, 3px).
  - **History & Actions**: Full Undo (`Ctrl+Z`), Redo (`Ctrl+Y`), Clear All drawings, and simulated Buy/Sell paper trading tags.

---

### 📈 Comprehensive 22+ Technical Indicators & Studies Suite
Includes a searchable **`fx Indicators`** study dialog with real-time calculations and zero network latency:
- **Trend & Overlays (Rendered on Candlestick Price Scale)**:
  - **VWAP**: Cumulative volume-weighted average price for intraday benchmarking.
  - **EMA (9, 21, 50, 200)**: Exponential moving averages across micro-swing and macro trend baselines.
  - **SMA (20, 50 DMA, 200 DMA)**: Simple moving averages.
  - **Bollinger Bands (20, 2)**: 20-period basis SMA with $\pm 2\sigma$ volatility envelopes.
  - **Supertrend (10, 3)**: ATR-based trend filter (Bullish green / Bearish red).
  - **Parabolic SAR (0.02, 0.2)**: Price acceleration stop-and-reversal trailing dots.
  - **Keltner Channels (20, 1.5)**: ATR volatility channel around EMA 20.
  - **Donchian Channels (20)**: 20-period highest high and lowest low breakout envelope.
  - **Standard Pivot Points**: Floor pivots ($P$, $R_1$, $R_2$, $S_1$, $S_2$).
- **Momentum & Oscillators (Synchronized Multi-Scale Sub-Panes)**:
  - **RSI 14**: Relative Strength Index with 70 overbought and 30 oversold bands.
  - **MACD (12, 26, 9)**: MACD line, Signal line, and colored histogram bars.
  - **Stochastic Oscillator (14, 3, 3)**: %K and %D lines with 80/20 zones.
  - **Williams %R (14)**: Momentum oscillator (-20 / -80 levels).
  - **CCI (20)**: Commodity Channel Index with cyclical extreme bands ($\pm 100$).
  - **ADX (14)**: Average Directional Index with +DI and -DI trend strength lines.
  - **ROC (12)**: Rate of Change percentage momentum oscillator.
- **Volatility & Range**:
  - **ATR (14)**: Average True Range for volatility measurement and trailing stop loss placement.
  - **Historical Volatility (20)**: Annualized standard deviation of log returns.
- **Volume & Flow**:
  - **Volume Histogram & 20 MA**: Bullish/Bearish volume bars with 20-period volume moving average.
  - **OBV**: On-Balance Volume cumulative flow.
  - **MFI (14)**: Money Flow Index combining volume and price momentum.
  - **CMF (20)**: Chaikin Money Flow measuring institutional accumulation vs. distribution.
- **Interactive Legend Chips**: Active indicators display chips above the chart with 1-click removal (`×`).

---

### 🤖 Multi-Horizon AI Price Predictions
- Multi-factor Autoregressive Ridge Regression combining short-term momentum, EMA trend spread, and volatility scaling targeting `1m`, `5m`, `30m`, `1h`, `1d`, and `5d` horizons.
- Dynamic Stop Loss and Target calculations with risk-reward ratio ($R:R$).
- Volatility Cones ($\pm 1\sigma$ envelopes) and walk-forward historical backtesting diagnostics showing directional win rate and mean absolute percentage error (MAPE).

---

### 📊 F&O Derivatives & Option Chain Analytics
- Strike-wise Call/Put open interest (OI) and OI change breakdown.
- Put-Call Ratio (PCR) sentiment meter.
- Max Pain (Option Pain) strike calculation.
- At-the-Money Implied Volatility (ATM IV).

---

### 📰 Financial News & Sentiment Tracking
- Automated RSS feed aggregation from Moneycontrol, The Economic Times, and LiveMint.
- Keyword-based financial sentiment classifier tagging articles as Bullish, Bearish, or Neutral.
- News event pins overlaid directly onto historical price bars.

---

### 🔐 Phone-First Authentication & Abuse-Resistant 1-Day Trial
- Primary phone number login and signup with Indian mobile format validation (`+91`).
- Anti-abuse trial management: Each unique mobile number can activate at most one 24-hour VIP pass.
- Profile onboarding capturing trader name, city/state, trading experience, and preferred segment.

---

## 🏗️ Project Architecture

```
pulse-trade-india/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── api/routes/       # REST endpoints (market, history, fno, predict, news)
│   │   ├── services/         # Core business logic & high-performance data engine
│   │   │   ├── market_data.py      # Pooled HTTP quotes, indices, and fallback generators
│   │   │   ├── history_service.py  # Fast-path OHLCV candles, bar fusion & indicator cache
│   │   │   ├── fno_service.py      # NSE option chains, PCR, and Max Pain
│   │   │   ├── predict_service.py  # ML multi-horizon regression models & quant drift
│   │   │   └── news_service.py     # Financial news feeds & sentiment analysis
│   │   └── models.py         # Pydantic schemas
│   └── tests/                # Pytest test suite (17 passed)
│
└── frontend/                 # Next.js 15 React application
    ├── src/
    │   ├── app/              # App router & main trading dashboard (page.tsx)
    │   ├── components/       # UI Components
    │   │   ├── ChartStudioModal.tsx        # Fullscreen TradingView-style studio
    │   │   ├── DrawingCanvasOverlay.tsx    # HTML5 interactive drawing canvas
    │   │   ├── IndicatorsDialog.tsx        # 22+ Technical indicators catalog dialog
    │   │   ├── StockChartCanvas.tsx        # TradingView Lightweight Charts canvas (decoupled)
    │   │   ├── LiveQuoteHeader.tsx         # Real-time ticker & OHLC metrics
    │   │   ├── FnoDerivativesPanel.tsx     # Option chain & derivatives analytics
    │   │   ├── AiPredictionCard.tsx        # Multi-horizon AI forecasts
    │   │   ├── StockNewsPanel.tsx          # Financial news & sentiment filters
    │   │   ├── MarketPulseBar.tsx          # Real-time NSE indices strip
    │   │   └── TrialOnboardingModal.tsx    # 1-day trial registration modal
    │   └── lib/
    │       ├── technicalIndicators.ts      # Mathematical indicator calculation library
    │       ├── chartIndicatorRenderer.ts   # Multi-scale series synchronization engine
    │       ├── api.ts                      # Backend API client
    │       ├── format.ts                   # Indian currency & percentage formatters
    │       └── supabase.ts                 # Supabase client configuration
    └── next.config.ts        # Rewrites proxying /api/* requests to backend
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.12+
- **Node.js**: 18+ (Node 20+ recommended)
- **Supabase Account** (for authentication & user profiles)

---

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- API server runs at: [http://localhost:8000](http://localhost:8000)
- Interactive Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)

Run tests:
```bash
pytest
```
*(All 17 tests passing).*

---

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web terminal runs at: [http://localhost:3000](http://localhost:3000)

Run TypeScript type check:
```bash
npm run typecheck
```
*(Zero TypeScript errors).*

---

### 3. Environment Variables

Create `.env.local` inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

---

## ⚖️ Disclaimer

*AlgoCulture India is an analytical, quantitative, and educational research platform. AI forecasts, probability cones, and technical indicator signals are generated via mathematical and statistical models and do not constitute SEBI-registered investment, trading, or financial advice. Trading in equities, derivatives, and financial instruments involves substantial risk of loss.*
