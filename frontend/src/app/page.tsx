"use client";

import React, { useCallback, useEffect, useState } from "react";
import { TrendingUp, ShieldAlert, Sparkles, Newspaper } from "lucide-react";
import { fetchMarketPulse, fetchStockQuote } from "@/lib/api";
import type {
  MarketPulseResponse,
  StockQuote,
  StockSearchItem,
  TradingMode,
  WatchlistEntry,
} from "@/lib/types";
import { MarketPulseBar } from "@/components/MarketPulseBar";
import { StockSearchBar } from "@/components/StockSearchBar";
import { WatchlistStrip } from "@/components/WatchlistStrip";
import { LiveQuoteHeader } from "@/components/LiveQuoteHeader";

const DEFAULT_WATCHLIST: WatchlistEntry[] = [
  { symbol: "NIFTY", name: "NIFTY 50 Index", exchange: "NSE" },
  { symbol: "BANKNIFTY", name: "NIFTY Bank Index", exchange: "NSE" },
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE" },
];

export default function HomePage() {
  const [activeSymbol, setActiveSymbol] = useState("RELIANCE");
  const [activeMode, setActiveMode] = useState<TradingMode>("intraday");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [pulse, setPulse] = useState<MarketPulseResponse | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>(DEFAULT_WATCHLIST);

  // Load watchlist from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pulsetrade_watchlist");
      if (stored) {
        const parsed = JSON.parse(stored) as WatchlistEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWatchlist(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  function saveWatchlist(next: WatchlistEntry[]) {
    setWatchlist(next);
    try {
      localStorage.setItem("pulsetrade_watchlist", JSON.stringify(next));
    } catch {
      // Ignore
    }
  }

  const loadQuote = useCallback(async (symbol: string) => {
    setIsQuoteLoading(true);
    setQuoteError(null);
    try {
      const data = await fetchStockQuote(symbol);
      setQuote(data);
    } catch (err) {
      setQuoteError((err as Error).message || "Failed to load quote");
    } finally {
      setIsQuoteLoading(false);
    }
  }, []);

  const loadPulse = useCallback(async () => {
    try {
      const data = await fetchMarketPulse();
      setPulse(data);
    } catch {
      // Soft failure; retains existing pulse
    }
  }, []);

  // Poll quote every 10s and pulse every 15s
  useEffect(() => {
    loadQuote(activeSymbol);
    const interval = setInterval(() => {
      loadQuote(activeSymbol);
    }, 10_000);
    return () => clearInterval(interval);
  }, [activeSymbol, loadQuote]);

  useEffect(() => {
    loadPulse();
    const interval = setInterval(loadPulse, 15_000);
    return () => clearInterval(interval);
  }, [loadPulse]);

  function handleSelectStock(item: StockSearchItem) {
    setActiveSymbol(item.symbol);
  }

  function handleToggleWatchlist() {
    if (!quote) return;
    const exists = watchlist.some((w) => w.symbol === quote.symbol);
    if (exists) {
      saveWatchlist(watchlist.filter((w) => w.symbol !== quote.symbol));
    } else {
      saveWatchlist([
        ...watchlist,
        {
          symbol: quote.symbol,
          name: quote.name,
          exchange: quote.exchange,
        },
      ]);
    }
  }

  function handleRemoveWatchlist(symbol: string) {
    saveWatchlist(watchlist.filter((w) => w.symbol !== symbol));
  }

  const isWatchlisted = watchlist.some((w) => w.symbol === activeSymbol);

  return (
    <div className="flex min-h-screen flex-col bg-[#090d16]">
      {/* Top Layer 1: Market Pulse Ticker */}
      <MarketPulseBar
        pulse={pulse}
        activeSymbol={activeSymbol}
        onSelectSymbol={setActiveSymbol}
      />

      {/* Top Layer 2: Main App Header & Search */}
      <header className="border-b border-slate-800 bg-[#0d1322] px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">
                PulseTrade <span className="text-sky-400">India</span>
              </span>
              <span className="ml-2 hidden rounded bg-sky-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300 sm:inline-block">
                NSE/BSE Terminal
              </span>
            </div>
          </div>

          <StockSearchBar onSelect={handleSelectStock} />
        </div>
      </header>

      {/* Top Layer 3: Watchlist Strip */}
      <WatchlistStrip
        items={watchlist}
        activeSymbol={activeSymbol}
        onSelect={setActiveSymbol}
        onRemove={handleRemoveWatchlist}
      />

      {/* Main Terminal Workspace */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
        {/* Live Quote Header */}
        <LiveQuoteHeader
          quote={quote}
          isLoading={isQuoteLoading}
          error={quoteError}
          isWatchlisted={isWatchlisted}
          onToggleWatchlist={handleToggleWatchlist}
          onRefresh={() => loadQuote(activeSymbol)}
        />

        {/* Trading Mode Switcher Tabs */}
        <section className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1">
            <button
              type="button"
              onClick={() => setActiveMode("intraday")}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                activeMode === "intraday"
                  ? "bg-sky-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Intraday Trading
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("fno")}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                activeMode === "fno"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>F&O Derivatives</span>
              {quote && !quote.is_fno && (
                <span className="rounded bg-rose-500/30 px-1 text-[10px] text-rose-300">
                  Off
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("longterm")}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                activeMode === "longterm"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Long-Term Investing
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              AI Prediction: Active
            </span>
          </div>
        </section>

        {/* Phase 1 Workspace Placeholder Banner (Phases 2-4 wire into this) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Main Chart Stage */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0e1525] p-6 lg:col-span-2">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  {activeMode === "intraday" && "Intraday Candlestick Chart (1m – 1h + VWAP & RSI)"}
                  {activeMode === "fno" && "F&O Derivatives & NSE Option Chain (OI / PCR / Max Pain)"}
                  {activeMode === "longterm" && "Long-Term Historical Chart (3M – MAX + 50/200 DMA)"}
                </h2>
                <p className="text-xs text-slate-500">
                  TradingView Lightweight Charts + AI Prediction Overlay
                </p>
              </div>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-sky-400">
                {activeSymbol}
              </span>
            </div>

            <div className="flex h-80 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center">
              <TrendingUp className="mb-2 h-8 w-8 text-sky-400" />
              <p className="text-sm font-medium text-slate-200">
                Phase 1 Live Market Data Connected
              </p>
              <p className="max-w-md pt-1 text-xs text-slate-400">
                Live LTP: <span className="font-mono text-white font-semibold">₹{quote?.ltp.toFixed(2) ?? "—"}</span> ({quote?.change_pct.toFixed(2) ?? "—"}%).
                FastAPI OHLCV endpoints and TradingView multi-horizon chart canvas connect in Phase 2.
              </p>
            </div>
          </div>

          {/* News & AI Overview Stage */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-slate-800/80 bg-[#0e1525] p-5">
              <div className="flex items-center gap-2 pb-3 text-sm font-semibold text-slate-200">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>AI Prediction Engine</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
                <p className="font-medium text-slate-300">
                  Horizon Forecast: {activeMode.toUpperCase()}
                </p>
                <p className="pt-1 text-[11px] text-slate-400">
                  Statistical ridge/gradient-boosted trajectory with 1σ/2σ confidence bands and backtest metrics.
                </p>
              </div>
            </div>

            <div className="flex-1 rounded-xl border border-slate-800/80 bg-[#0e1525] p-5">
              <div className="flex items-center gap-2 pb-3 text-sm font-semibold text-slate-200">
                <Newspaper className="h-4 w-4 text-sky-400" />
                <span>Moneycontrol Stock News</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
                <p className="text-[11px] text-slate-400">
                  Aggregating current & historical articles for {activeSymbol} with Bullish/Bearish sentiment tagging in Phase 4.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <footer className="mt-auto flex items-center justify-between border-t border-slate-800/70 pt-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400/80" />
            <span>
              Analytical & educational platform. AI forecasts are statistical projections and not SEBI-registered financial advice.
            </span>
          </div>
          <span>PulseTrade India v0.1.0</span>
        </footer>
      </main>
    </div>
  );
}
