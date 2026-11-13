"use client";

import React, { useCallback, useEffect, useState } from "react";
import { TrendingUp, ShieldAlert, Sparkles, Newspaper } from "lucide-react";
import {
  fetchFnoAnalytics,
  fetchMarketPulse,
  fetchStockHistory,
  fetchStockNews,
  fetchStockPrediction,
  fetchStockQuote,
} from "@/lib/api";
import type {
  FnoAnalyticsResponse,
  MarketPulseResponse,
  StockHistoryResponse,
  StockNewsResponse,
  StockPredictionResponse,
  StockQuote,
  StockSearchItem,
  TradingMode,
  WatchlistEntry,
} from "@/lib/types";
import { MarketPulseBar } from "@/components/MarketPulseBar";
import { StockSearchBar } from "@/components/StockSearchBar";
import { WatchlistStrip } from "@/components/WatchlistStrip";
import { LiveQuoteHeader } from "@/components/LiveQuoteHeader";
import { TechnicalBiasStrip } from "@/components/TechnicalBiasStrip";
import { StockChartCanvas } from "@/components/StockChartCanvas";
import { FnoDerivativesPanel } from "@/components/FnoDerivativesPanel";
import { AiPredictionCard } from "@/components/AiPredictionCard";
import { StockNewsPanel } from "@/components/StockNewsPanel";

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

  // Phase 2 state
  const [history, setHistory] = useState<StockHistoryResponse | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [intradayInterval, setIntradayInterval] = useState("5m");
  const [longtermRange, setLongtermRange] = useState("1y");
  const [showVwap, setShowVwap] = useState(true);
  const [showEma, setShowEma] = useState(true);
  const [showDma, setShowDma] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showRsi, setShowRsi] = useState(true);

  // F&O state
  const [fno, setFno] = useState<FnoAnalyticsResponse | null>(null);
  const [isFnoLoading, setIsFnoLoading] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<string>("");

  // Phase 3 AI Prediction state
  const [prediction, setPrediction] = useState<StockPredictionResponse | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isPredictionOverlayActive, setIsPredictionOverlayActive] = useState(true);

  // Phase 4 News state
  const [news, setNews] = useState<StockNewsResponse | null>(null);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [newsTimeframe, setNewsTimeframe] = useState("all");
  const [newsSourceFilter, setNewsSourceFilter] = useState("all");

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

  const loadHistory = useCallback(
    async (
      symbol: string,
      mode: TradingMode,
      interval: string,
      range: string,
      showSpinner = false
    ) => {
      if (showSpinner) {
        setIsHistoryLoading(true);
      }
      try {
        const histMode = mode === "longterm" ? "longterm" : "intraday";
        const data = await fetchStockHistory(
          symbol,
          histMode,
          histMode === "intraday" ? interval : undefined,
          histMode === "longterm" ? range : undefined
        );
        setHistory(data);
      } catch {
        // Retain previous or empty on failure
      } finally {
        if (showSpinner) {
          setIsHistoryLoading(false);
        }
      }
    },
    []
  );

  const loadFno = useCallback(async (symbol: string, expiry?: string) => {
    setIsFnoLoading(true);
    try {
      const data = await fetchFnoAnalytics(symbol, expiry);
      setFno(data);
      if (data.current_expiry && !expiry) {
        setSelectedExpiry(data.current_expiry);
      }
    } catch {
      setFno(null);
    } finally {
      setIsFnoLoading(false);
    }
  }, []);

  const loadPrediction = useCallback(async (symbol: string, mode: TradingMode) => {
    setIsPredictionLoading(true);
    try {
      const data = await fetchStockPrediction(symbol, mode);
      setPrediction(data);
    } catch {
      // Retain or null
    } finally {
      setIsPredictionLoading(false);
    }
  }, []);

  const loadNews = useCallback(
    async (symbol: string, timeframe: string, source: string) => {
      setIsNewsLoading(true);
      try {
        const data = await fetchStockNews(symbol, timeframe, source);
        setNews(data);
      } catch {
        // Retain previous or null
      } finally {
        setIsNewsLoading(false);
      }
    },
    []
  );

  // Sync Prediction on symbol or mode change
  useEffect(() => {
    loadPrediction(activeSymbol, activeMode);
  }, [activeSymbol, activeMode, loadPrediction]);

  // Sync News on symbol, timeframe, or source change
  useEffect(() => {
    loadNews(activeSymbol, newsTimeframe, newsSourceFilter);
  }, [activeSymbol, newsTimeframe, newsSourceFilter, loadNews]);

  // Sync History on symbol / mode / timeframe change + Auto-poll live candles
  useEffect(() => {
    // Initial fetch with loader
    loadHistory(activeSymbol, activeMode, intradayInterval, longtermRange, true);

    // Auto-poll history in background (every 8s for intraday, 60s for longterm)
    const pollIntervalMs = activeMode === "intraday" ? 8_000 : 60_000;
    const timer = setInterval(() => {
      loadHistory(activeSymbol, activeMode, intradayInterval, longtermRange, false);
    }, pollIntervalMs);

    return () => clearInterval(timer);
  }, [activeSymbol, activeMode, intradayInterval, longtermRange, loadHistory]);

  // Sync F&O on symbol or expiry change
  useEffect(() => {
    if (activeMode === "fno") {
      loadFno(activeSymbol, selectedExpiry || undefined);
    }
  }, [activeSymbol, activeMode, selectedExpiry, loadFno]);

  // Live Quote Ticker (every 5 seconds)
  useEffect(() => {
    loadQuote(activeSymbol);
    const interval = setInterval(() => {
      loadQuote(activeSymbol);
    }, 5_000);
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

        {/* Quick Technical & F&O Bias Strip (OPT-02) */}
        <TechnicalBiasStrip
          bias={history?.bias ?? null}
          fnoBias={fno?.fno_bias}
          isFno={Boolean(quote?.is_fno)}
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

          {/* Timeframe Selectors & Indicator Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {activeMode === "intraday" && (
              <div className="flex items-center rounded-md border border-slate-800 bg-slate-900/80 p-0.5 text-xs">
                {["1m", "5m", "15m", "1h"].map((intvl) => (
                  <button
                    key={intvl}
                    type="button"
                    onClick={() => setIntradayInterval(intvl)}
                    className={`rounded px-2 py-1 font-mono text-[11px] font-medium transition ${
                      intradayInterval === intvl
                        ? "bg-sky-500 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {intvl}
                  </button>
                ))}
              </div>
            )}

            {activeMode === "longterm" && (
              <div className="flex items-center rounded-md border border-slate-800 bg-slate-900/80 p-0.5 text-xs">
                {["3mo", "6mo", "1y", "3y", "5y", "max"].map((rng) => (
                  <button
                    key={rng}
                    type="button"
                    onClick={() => setLongtermRange(rng)}
                    className={`rounded px-2 py-1 font-mono text-[11px] font-medium uppercase transition ${
                      longtermRange === rng
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {rng}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Indicator Toggles */}
            <div className="flex items-center gap-1.5 pl-2 text-[11px]">
              {activeMode === "intraday" && (
                <button
                  type="button"
                  onClick={() => setShowVwap(!showVwap)}
                  className={`rounded border px-2 py-1 transition ${
                    showVwap
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                      : "border-slate-800 bg-slate-900 text-slate-500"
                  }`}
                >
                  VWAP
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowEma(!showEma)}
                className={`rounded border px-2 py-1 transition ${
                  showEma
                    ? "border-sky-500/50 bg-sky-500/15 text-sky-300"
                    : "border-slate-800 bg-slate-900 text-slate-500"
                }`}
              >
                EMA 9/21
              </button>
              {activeMode === "longterm" && (
                <button
                  type="button"
                  onClick={() => setShowDma(!showDma)}
                  className={`rounded border px-2 py-1 transition ${
                    showDma
                      ? "border-purple-500/50 bg-purple-500/15 text-purple-300"
                      : "border-slate-800 bg-slate-900 text-slate-500"
                  }`}
                >
                  50/200 DMA
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowVolume(!showVolume)}
                className={`rounded border px-2 py-1 transition ${
                  showVolume
                    ? "border-slate-700 bg-slate-800 text-slate-300"
                    : "border-slate-800 bg-slate-900 text-slate-500"
                }`}
              >
                Vol
              </button>
            </div>
          </div>
        </section>

        {/* Phase 2 Multi-Horizon Chart & Derivatives Workspace */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Main Chart / F&O Stage */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0e1525] p-4 lg:col-span-2">
            <div className="flex items-center justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-200">
                    {activeMode === "intraday" && `Intraday Chart (${intradayInterval})`}
                    {activeMode === "fno" && "F&O Derivatives & Option Chain Analytics"}
                    {activeMode === "longterm" && `Long-Term Historical Chart (${longtermRange.toUpperCase()})`}
                  </h2>
                  {activeMode === "intraday" && (
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  TradingView Lightweight Charts • {activeSymbol}
                </p>
              </div>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-sky-400">
                {activeSymbol}
              </span>
            </div>

            {activeMode === "fno" ? (
              <FnoDerivativesPanel
                fno={fno}
                selectedExpiry={selectedExpiry}
                onSelectExpiry={(exp) => setSelectedExpiry(exp)}
                isLoading={isFnoLoading}
              />
            ) : (
              <StockChartCanvas
                symbol={activeSymbol}
                interval={activeMode === "intraday" ? intradayInterval : longtermRange}
                candles={history?.candles ?? []}
                mode={activeMode}
                livePrice={quote?.ltp}
                showVwap={showVwap}
                showEma={showEma}
                showDma={showDma}
                showVolume={showVolume}
                showRsi={showRsi}
                aiPredictionData={
                  isPredictionOverlayActive && prediction?.forecast
                    ? prediction.forecast.map((f) => ({
                        time: f.time,
                        price: f.predicted,
                        lower1: f.lower_1sigma,
                        upper1: f.upper_1sigma,
                      }))
                    : null
                }
                newsEvents={
                  news?.articles
                    ? news.articles.map((a) => ({
                        time: a.time_sec,
                        title: a.title,
                        sentiment: a.sentiment,
                      }))
                    : null
                }
              />
            )}
          </div>

          {/* Right Rail: AI Forecast & Stock News */}
          <div className="flex flex-col gap-4">
            <AiPredictionCard
              prediction={prediction}
              isLoading={isPredictionLoading}
              isActive={isPredictionOverlayActive}
              onToggleActive={() =>
                setIsPredictionOverlayActive(!isPredictionOverlayActive)
              }
            />

            <StockNewsPanel
              news={news}
              timeframe={newsTimeframe}
              sourceFilter={newsSourceFilter}
              onSelectTimeframe={setNewsTimeframe}
              onSelectSource={setNewsSourceFilter}
              isLoading={isNewsLoading}
            />
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
