# AlgoCulture India — Real-Time Indian Trading & Analytics Terminal

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TradingView](https://img.shields.io/badge/Charts-TradingView%20Lightweight%20Charts-blue)](https://tradingview.github.io/lightweight-charts/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)

**AlgoCulture India** is a real-time web application tailored for the Indian stock market (NSE/BSE). It features interactive financial charting, machine-learning-driven multi-horizon price predictions (`1m`, `5m`, `30m`, `1h`, `1d`, `5d`) with walk-forward accuracy diagnostics, F&O derivatives analytics (PCR, Max Pain, ATM IV, strike distributions), and financial news aggregated from Moneycontrol, Economic Times, LiveMint, and Google News.

---

## ✨ Features

- **⚡ Real-Time Intraday & Long-Term Interactive Charts**: Powered by TradingView Lightweight Charts with live bar ticking, EMA (9/21), VWAP, 50/200 DMA, and Volume.
- **🤖 Multi-Horizon AI Price Predictions**: Autoregressive Ridge Regression + Volatility Cone targeting `1m`, `5m`, `30m`, `1h`, `1d`, and `5d` with walk-forward win-rate and accuracy diagnostics.
- **📊 F&O Derivatives Analytics**: Strike-wise Call/Put open interest (OI) breakdown, Put-Call Ratio (PCR), Option Pain (Max Pain), and ATM Implied Volatility (IV).
- **📰 Stock-Specific Financial News**: Automated RSS sentiment aggregation from Moneycontrol, The Economic Times, and LiveMint with Bullish/Bearish sentiment classification.
- **🔍 2,390+ NSE Equities Catalog**: Instant sub-millisecond search across active listed stocks and major indices (`NIFTY 50`, `BANKNIFTY`, `SENSEX`).
- **📌 Long-Term News Pins**: News events overlaid directly onto historical price bars.

---

## 🚀 Quickstart

### Prerequisites
- Python 3.12+
- Node.js 18+

### 1. Start the Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt # or pip install -e .
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at [http://localhost:8000](http://localhost:8000) (Swagger Docs at [http://localhost:8000/docs](http://localhost:8000/docs)).

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend UI will be running at [http://localhost:3000](http://localhost:3000).

---

## ⚖️ Disclaimer

*AlgoCulture India is an analytical and educational research platform. AI forecasts and technical signals are statistical models and do not constitute SEBI-registered investment or financial advice.*
