"use client";

import React, { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Minus, Clock, Info } from "lucide-react";
import type { HorizonForecastItem, StockPredictionResponse } from "@/lib/types";
import { formatInr } from "@/lib/format";

interface AiPredictionCardProps {
  prediction: StockPredictionResponse | null;
  isLoading: boolean;
  isActive: boolean;
  onToggleActive: () => void;
  selectedHorizonId?: string;
  onSelectHorizon?: (horizon: HorizonForecastItem) => void;
}

export function AiPredictionCard({
  prediction,
  isLoading,
  isActive,
  onToggleActive,
  selectedHorizonId = "5m",
  onSelectHorizon,
}: AiPredictionCardProps) {
  const [internalHorizon, setInternalHorizon] = useState<string>("5m");

  if (isLoading && !prediction) {
    return (
      <div className="h-96 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50 p-4" />
    );
  }

  if (!prediction) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0e1525] p-4 text-xs text-slate-400">
        AI Prediction waiting for stock data...
      </div>
    );
  }

  const activeHid = selectedHorizonId || internalHorizon;
  const horizons = prediction.horizons ?? [];
  const currentHorizonItem =
    horizons.find((h) => h.horizon_id === activeHid) ||
    (horizons.length > 0
      ? horizons[0]
      : {
          horizon_id: "default",
          label: "Forecast Target",
          target_price: prediction.forecast_target,
          expected_change: prediction.forecast_target - prediction.current_price,
          expected_change_pct: prediction.expected_change_pct,
          direction: prediction.projected_direction,
          lower_1sigma: prediction.forecast[0]?.lower_1sigma ?? prediction.current_price,
          upper_1sigma: prediction.forecast[0]?.upper_1sigma ?? prediction.current_price,
          lower_2sigma: prediction.forecast[0]?.lower_2sigma ?? prediction.current_price,
          upper_2sigma: prediction.forecast[0]?.upper_2sigma ?? prediction.current_price,
          target_time_iso: "",
          target_time_sec: 0,
        });

  const isUp = currentHorizonItem.expected_change >= 0;

  function handlePickHorizon(h: HorizonForecastItem) {
    setInternalHorizon(h.horizon_id);
    if (onSelectHorizon) onSelectHorizon(h);
  }

  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0e1525] p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-100">
              AI Prediction Trajectory
            </h3>
            <span className="text-[10px] text-slate-400">
              Multi-Horizon Machine Learning
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

      {/* Multi-Horizon Selector Pills: 1m, 5m, 30m, 1h, 1d, 5d */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <Clock className="h-3 w-3 text-sky-400" />
          <span>Select Forecast Timeframe:</span>
        </div>
        <div className="grid grid-cols-6 gap-1 rounded-lg border border-slate-800 bg-slate-900/90 p-1">
          {horizons.map((h) => {
            const isSelected = h.horizon_id === activeHid;
            const hUp = h.expected_change >= 0;
            return (
              <button
                key={h.horizon_id}
                type="button"
                onClick={() => handlePickHorizon(h)}
                className={`flex flex-col items-center justify-center rounded py-1.5 text-center transition ${
                  isSelected
                    ? "bg-sky-500 font-bold text-white shadow"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                }`}
              >
                <span className="text-[11px] font-mono">{h.horizon_id.toUpperCase()}</span>
                <span
                  className={`text-[9px] font-mono ${
                    isSelected
                      ? "text-white"
                      : hUp
                        ? "text-emerald-400"
                        : "text-rose-400"
                  }`}
                >
                  {hUp ? "+" : ""}
                  {h.expected_change_pct.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Horizon Detailed Target Card */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-slate-300">
            {currentHorizonItem.label} Target
          </span>
          <span
            className={`flex items-center gap-1 font-mono text-xs font-semibold ${
              isUp ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isUp ? "+" : ""}
            {currentHorizonItem.expected_change.toFixed(2)} (
            {isUp ? "+" : ""}
            {currentHorizonItem.expected_change_pct.toFixed(2)}%)
          </span>
        </div>

        <div className="pt-1.5">
          <span className="font-mono text-2xl font-bold text-white">
            {formatInr(currentHorizonItem.target_price, false)}
          </span>
          <span className="ml-2 text-xs text-slate-400">
            Current: {formatInr(prediction.current_price, false)}
          </span>
        </div>

        {/* Expected Range Cone (1 Sigma) */}
        <div className="mt-2.5 rounded border border-slate-800/80 bg-slate-950/60 p-2 text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Expected 1σ Volatility Cone:</span>
            <span className="font-mono font-medium text-slate-200">
              {formatInr(currentHorizonItem.lower_1sigma, false)} –{" "}
              {formatInr(currentHorizonItem.upper_1sigma, false)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-slate-500 text-[10px]">
            <span>Directional Stance:</span>
            <span
              className={`font-semibold ${
                currentHorizonItem.direction === "BULLISH"
                  ? "text-emerald-400"
                  : currentHorizonItem.direction === "BEARISH"
                    ? "text-rose-400"
                    : "text-slate-300"
              }`}
            >
              {currentHorizonItem.direction}
            </span>
          </div>
        </div>
      </div>

      {/* Model Accuracy & Diagnostics */}
      <div className="mt-3 space-y-1.5 rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 text-[11px]">
        <div className="flex items-center justify-between text-slate-400">
          <span>Walk-forward Directional Accuracy:</span>
          <strong className="font-mono text-sky-300">
            {prediction.metrics.directional_accuracy_pct}%
          </strong>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Out-of-sample MAPE Error:</span>
          <strong className="font-mono text-slate-200">
            {prediction.metrics.mape_pct}%
          </strong>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-3 flex items-start gap-1.5 text-[10px] text-slate-500">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
        <span>
          Auto-regressive Ridge + Volatility Cone projection. Educational research only; not financial advice.
        </span>
      </div>
    </div>
  );
}
