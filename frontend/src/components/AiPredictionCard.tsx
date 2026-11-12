"use client";

import React from "react";
import { Sparkles, TrendingUp, TrendingDown, Info, ShieldCheck } from "lucide-react";
import type { StockPredictionResponse } from "@/lib/types";
import { formatInr } from "@/lib/format";

interface AiPredictionCardProps {
  prediction: StockPredictionResponse | null;
  isLoading: boolean;
  isActive: boolean;
  onToggleActive: () => void;
}

export function AiPredictionCard({
  prediction,
  isLoading,
  isActive,
  onToggleActive,
}: AiPredictionCardProps) {
  if (isLoading && !prediction) {
    return (
      <div className="h-64 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50 p-4" />
    );
  }

  if (!prediction) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0e1525] p-4 text-xs text-slate-400">
        AI Prediction waiting for stock data...
      </div>
    );
  }

  const isUp = prediction.expected_change_pct >= 0;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0e1525] p-4 shadow-lg">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-100">
              AI Forecast Engine
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              Horizon: {prediction.mode}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleActive}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
            isActive
              ? "border-sky-500/50 bg-sky-500/20 text-sky-200"
              : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
          }`}
        >
          {isActive ? "Overlay: ON" : "Overlay: OFF"}
        </button>
      </div>

      {/* Target and Direction summary */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-400">Projected Target</span>
          <span
            className={`flex items-center gap-1 font-mono text-xs font-semibold ${
              isUp ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isUp ? "+" : ""}
            {prediction.expected_change_pct.toFixed(2)}%
          </span>
        </div>

        <div className="pt-1">
          <span className="font-mono text-2xl font-bold text-white">
            {formatInr(prediction.forecast_target, false)}
          </span>
          <span className="ml-2 text-xs text-slate-400">
            from {formatInr(prediction.current_price, false)}
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
          <span className="text-slate-400">Directional Bias:</span>
          <span
            className={`font-semibold ${
              prediction.projected_direction === "BULLISH"
                ? "text-emerald-400"
                : prediction.projected_direction === "BEARISH"
                  ? "text-rose-400"
                  : "text-slate-300"
            }`}
          >
            {prediction.projected_direction}
          </span>
        </div>
      </div>

      {/* Transparent Model Backtest Card */}
      <div className="mt-3 space-y-1.5 rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 text-[11px]">
        <div className="flex items-center justify-between text-slate-400">
          <span>Backtest Directional Accuracy:</span>
          <strong className="font-mono text-sky-300">
            {prediction.metrics.directional_accuracy_pct}%
          </strong>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Out-of-sample MAPE:</span>
          <strong className="font-mono text-slate-200">
            {prediction.metrics.mape_pct}%
          </strong>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Tested Horizon Candles:</span>
          <strong className="font-mono text-slate-200">
            {prediction.metrics.tested_candles}
          </strong>
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="mt-3 flex items-start gap-1.5 text-[10px] text-slate-500">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
        <span>
          Statistical ML trajectory with 1σ/2σ bands. For research only; not financial advice.
        </span>
      </div>
    </div>
  );
}
