"use client";

import React from "react";
import { RefreshCw, Star, AlertTriangle } from "lucide-react";
import type { StockQuote } from "@/lib/types";
import {
  formatIndianVolume,
  formatInr,
  formatIstTime,
  formatSignedChange,
} from "@/lib/format";

interface LiveQuoteHeaderProps {
  quote: StockQuote | null;
  isLoading: boolean;
  error: string | null;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
  onRefresh: () => void;
}

export function LiveQuoteHeader({
  quote,
  isLoading,
  error,
  isWatchlisted,
  onToggleWatchlist,
  onRefresh,
}: LiveQuoteHeaderProps) {
  if (error && !quote) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-200">
        <div className="flex items-center justify-between gap-3">
          <span>Unable to load live quote: {error}</span>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-md border border-rose-400/40 px-3 py-1 text-xs font-medium hover:bg-rose-500/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60" />
    );
  }

  const changeVal = typeof quote.change === "number" ? quote.change : 0;
  const isUp = changeVal >= 0;
  const dayHigh = typeof quote.high === "number" ? quote.high : quote.ltp;
  const dayLow = typeof quote.low === "number" ? quote.low : quote.ltp;
  const daySpan = dayHigh - dayLow;
  const dayPct =
    daySpan > 0
      ? Math.min(100, Math.max(0, ((quote.ltp - dayLow) / daySpan) * 100))
      : 50;

  return (
    <section className="rounded-xl border border-slate-800/90 bg-[#0e1525] p-4 shadow-lg">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        {/* Left: Symbol, Name & Price */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {quote.symbol}
            </h1>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
              {quote.exchange}
            </span>
            {quote.is_fno && (
              <span className="rounded border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                F&O Eligible
              </span>
            )}
            <button
              type="button"
              onClick={onToggleWatchlist}
              title={
                isWatchlisted ? "Remove from watchlist" : "Pin to watchlist"
              }
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition ${
                isWatchlisted
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  isWatchlisted ? "fill-amber-400 text-amber-400" : ""
                }`}
              />
              {isWatchlisted ? "Saved" : "Watch"}
            </button>
          </div>

          <p className="text-xs text-slate-400">{quote.name}</p>

          <div className="flex flex-wrap items-baseline gap-3 pt-1">
            <span className="font-mono text-3xl font-bold text-white">
              {formatInr(quote.ltp, !quote.is_index)}
            </span>
            <span
              className={`font-mono text-sm font-semibold ${
                isUp ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatSignedChange(quote.change, quote.change_pct)}
            </span>
            {quote.stale && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                Cached fallback
              </span>
            )}
          </div>
        </div>

        {/* Right: Key OHLC, Day Range & Refresh */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4 lg:text-right">
          <div>
            <span className="block text-slate-500">Open</span>
            <span className="font-mono font-medium text-slate-200">
              {formatInr(quote.open, !quote.is_index)}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">Prev Close</span>
            <span className="font-mono font-medium text-slate-200">
              {formatInr(quote.prev_close, !quote.is_index)}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">Volume</span>
            <span className="font-mono font-medium text-slate-200">
              {formatIndianVolume(quote.volume)}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">52W Range</span>
            <span className="font-mono font-medium text-slate-200">
              {quote.week52_low && quote.week52_high
                ? `${formatInr(quote.week52_low, false)} – ${formatInr(quote.week52_high, false)}`
                : "—"}
            </span>
          </div>

          {/* Day Range Slider Bar */}
          <div className="col-span-2 pt-1 sm:col-span-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Day Low: {formatInr(quote.low, false)}</span>
              <span>Day High: {formatInr(quote.high, false)}</span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
                style={{ width: `${dayPct}%` }}
              />
            </div>
          </div>

          <div className="col-span-2 flex items-center justify-end gap-2 pt-1 sm:col-span-1">
            <span className="text-[11px] text-slate-500">
              IST {formatIstTime(quote.as_of)}
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh quote"
              className="rounded-md border border-slate-700 bg-slate-800/70 p-1.5 text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
