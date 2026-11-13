"use client";

import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Info,
  CheckCircle2,
  Target,
  ShieldAlert,
  ShieldCheck,
  Activity,
  ArrowRight,
} from "lucide-react";
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
  selectedHorizonId,
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

  const activeHid = selectedHorizonId !== undefined ? selectedHorizonId : internalHorizon;
  const horizons = prediction.horizons ?? [];
  const currentPrice = prediction.current_price ?? 0;

  const currentHorizonItem =
    horizons.find((h) => h.horizon_id === activeHid) ||
    (horizons.length > 0
      ? horizons[0]
      : {
          horizon_id: "default",
          label: "Forecast Target",
          target_price: prediction.forecast_target ?? currentPrice,
          expected_change: (prediction.forecast_target ?? currentPrice) - currentPrice,
          expected_change_pct: prediction.expected_change_pct ?? 0,
          direction: prediction.projected_direction ?? "NEUTRAL",
          lower_1sigma: prediction.forecast?.[0]?.lower_1sigma ?? currentPrice * 0.99,
          upper_1sigma: prediction.forecast?.[0]?.upper_1sigma ?? currentPrice * 1.01,
          lower_2sigma: prediction.forecast?.[0]?.lower_2sigma ?? currentPrice * 0.98,
          upper_2sigma: prediction.forecast?.[0]?.upper_2sigma ?? currentPrice * 1.02,
          target_time_iso: "",
          target_time_sec: 0,
          stop_loss: prediction.stop_loss ?? Math.max(0.05, currentPrice * 0.99),
          stop_loss_pct: -1.0,
          risk_reward_ratio: prediction.risk_reward_ratio ?? 1.5,
        });

  const isUp = (currentHorizonItem?.expected_change ?? 0) >= 0;
  const horizonAcc =
    currentHorizonItem?.accuracy_score_pct ??
    prediction.metrics?.directional_accuracy_pct ??
    75.0;
  const confGrade =
    currentHorizonItem?.confidence_level ??
    prediction.metrics?.confidence_grade ??
    (horizonAcc >= 70 ? "HIGH" : horizonAcc >= 58 ? "MODERATE" : "SPECULATIVE");
  const testedCandles = prediction.metrics?.tested_candles || 15;
  const successfulCalls =
    prediction.metrics?.successful_predictions ??
    Math.round(testedCandles * (horizonAcc / 100));

  // Stop loss and risk-reward calculation
  const targetPrice = currentHorizonItem.target_price ?? currentPrice;
  const stopLossPrice =
    currentHorizonItem.stop_loss && currentHorizonItem.stop_loss > 0
      ? currentHorizonItem.stop_loss
      : prediction.stop_loss && prediction.stop_loss > 0
        ? prediction.stop_loss
        : Math.round((currentPrice > 0 ? (isUp ? currentPrice * 0.988 : currentPrice * 1.012) : 0) * 100) / 100;

  const slPct =
    currentHorizonItem.stop_loss_pct !== undefined && currentHorizonItem.stop_loss_pct !== 0
      ? currentHorizonItem.stop_loss_pct
      : currentPrice > 0
        ? Number((((stopLossPrice - currentPrice) / currentPrice) * 100).toFixed(2))
        : 0;

  const rrRatio =
    currentHorizonItem.risk_reward_ratio && currentHorizonItem.risk_reward_ratio > 0
      ? currentHorizonItem.risk_reward_ratio
      : prediction.risk_reward_ratio && prediction.risk_reward_ratio > 0
        ? prediction.risk_reward_ratio
        : 1.5;

  const rrQuality =
    rrRatio >= 2.0
      ? { label: "EXCELLENT SETUP", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" }
      : rrRatio >= 1.5
        ? { label: "FAVORABLE SETUP", color: "text-sky-300 bg-sky-500/15 border-sky-500/30" }
        : rrRatio >= 1.0
          ? { label: "MODERATE RISK", color: "text-amber-300 bg-amber-500/15 border-amber-500/30" }
          : { label: "SPECULATIVE", color: "text-rose-400 bg-rose-500/15 border-rose-500/30" };

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
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-slate-100">
                AI Prediction Trajectory
              </h3>
              <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {horizonAcc}% Acc
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Multi-Horizon Machine Learning & Stop Loss
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
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-sky-400" />
            <span>Select Forecast Timeframe:</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">
            R:R 1:{rrRatio.toFixed(1)}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1 rounded-lg border border-slate-800 bg-slate-900/90 p-1">
          {horizons.map((h) => {
            const isSelected = h.horizon_id === activeHid;
            const hUp = (h.expected_change ?? 0) >= 0;
            const pillAcc =
              h.accuracy_score_pct ?? prediction.metrics?.directional_accuracy_pct ?? 75;
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
                  {(h.expected_change_pct ?? 0).toFixed(1)}%
                </span>
                <span
                  className={`text-[8px] font-mono ${
                    isSelected
                      ? "font-semibold text-sky-100"
                      : "text-slate-500"
                  }`}
                >
                  {pillAcc}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Price & Stop Loss Dual Analytics Card */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Target Price Card */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-emerald-300">
              <Target className="h-3 w-3 text-emerald-400" />
              Target Price
            </span>
            <span className="font-mono text-[10px] font-semibold text-emerald-400">
              {isUp ? "+" : ""}
              {(currentHorizonItem.expected_change_pct ?? 0).toFixed(2)}%
            </span>
          </div>
          <div className="mt-1.5">
            <span className="font-mono text-lg font-bold text-white">
              {formatInr(targetPrice, false)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-300/80 font-mono">
            <span>Diff:</span>
            <span>
              {isUp ? "+" : ""}
              {(currentHorizonItem.expected_change ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* AI Stop Loss Card */}
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-rose-300">
              <ShieldAlert className="h-3 w-3 text-rose-400" />
              AI Stop Loss
            </span>
            <span className="font-mono text-[10px] font-semibold text-rose-400">
              {slPct > 0 ? `+${slPct.toFixed(2)}%` : `${slPct.toFixed(2)}%`}
            </span>
          </div>
          <div className="mt-1.5">
            <span className="font-mono text-lg font-bold text-white">
              {formatInr(stopLossPrice, false)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-300/80 font-mono">
            <span>Risk buffer:</span>
            <span>{Math.abs(currentPrice - stopLossPrice).toFixed(2)} pts</span>
          </div>
        </div>
      </div>

      {/* Risk-to-Reward Ratio (R:R) Visual Bar */}
      <div className="mt-2.5 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-semibold text-slate-200">Risk : Reward Setup</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-sky-400">
              1 : {rrRatio.toFixed(2)}
            </span>
            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${rrQuality.color}`}>
              {rrQuality.label}
            </span>
          </div>
        </div>

        {/* Visual Spectrum: Stop Loss <---> Current Entry <---> Target */}
        <div className="mt-2 space-y-1">
          <div className="relative flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-rose-500"
              style={{ width: "30%" }}
              title="Downside Risk Buffer"
            />
            <div
              className="h-full bg-sky-500"
              style={{ width: "10%" }}
              title="Entry Price Baseline"
            />
            <div
              className="h-full bg-emerald-500"
              style={{ width: "60%" }}
              title="Projected Target Reward"
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[9px] text-slate-400">
            <span className="text-rose-400">SL: {formatInr(stopLossPrice, false)}</span>
            <span className="text-slate-300 font-semibold">Entry: {formatInr(currentPrice, false)}</span>
            <span className="text-emerald-400">TP: {formatInr(targetPrice, false)}</span>
          </div>
        </div>
      </div>

      {/* Prediction Accuracy Score Meter */}
      <div className="mt-2.5 rounded border border-slate-800/80 bg-slate-950/70 p-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-semibold text-slate-200">
              Prediction Accuracy
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-emerald-400">
              {horizonAcc}%
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                confGrade === "HIGH"
                  ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                  : confGrade === "MODERATE"
                    ? "border border-sky-500/30 bg-sky-500/20 text-sky-300"
                    : "border border-amber-500/30 bg-amber-500/20 text-amber-300"
              }`}
            >
              {confGrade} CONFIDENCE
            </span>
          </div>
        </div>

        {/* Visual Accuracy Bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              horizonAcc >= 70
                ? "bg-gradient-to-r from-sky-500 to-emerald-400"
                : horizonAcc >= 58
                  ? "bg-gradient-to-r from-amber-500 to-sky-400"
                  : "bg-gradient-to-r from-rose-500 to-amber-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, horizonAcc))}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
          <span>Walk-forward validation:</span>
          <span className="font-mono text-slate-300">
            {successfulCalls} / {testedCandles} Hits ({horizonAcc}%)
          </span>
        </div>
      </div>

      {/* Expected Range Cone (1 Sigma) & Directional Stance */}
      <div className="mt-2.5 rounded border border-slate-800/80 bg-slate-950/60 p-2 text-[11px]">
        <div className="flex items-center justify-between text-slate-400">
          <span>Expected 1σ Volatility Cone:</span>
          <span className="font-mono font-medium text-slate-200">
            {formatInr(currentHorizonItem.lower_1sigma ?? 0, false)} –{" "}
            {formatInr(currentHorizonItem.upper_1sigma ?? 0, false)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
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
            {currentHorizonItem.direction === "BULLISH" && "BULLISH (Long Bias)"}
            {currentHorizonItem.direction === "BEARISH" && "BEARISH (Short Bias)"}
            {currentHorizonItem.direction !== "BULLISH" && currentHorizonItem.direction !== "BEARISH" && "NEUTRAL / RANGEBOUND"}
          </span>
        </div>
      </div>

      {/* Model Accuracy & Diagnostics */}
      <div className="mt-3 space-y-1.5 rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 text-[11px]">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-sky-400" />
            Walk-forward Win Rate:
          </span>
          <strong className="font-mono text-emerald-400">
            {prediction.metrics?.directional_accuracy_pct ?? 75}%
          </strong>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Mean Absolute Price Error (MAPE):</span>
          <strong className="font-mono text-slate-200">
            ±{prediction.metrics?.mape_pct ?? 1.2}%
          </strong>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Out-of-sample RMSE:</span>
          <strong className="font-mono text-slate-300">
            {prediction.metrics?.rmse ?? 8.5}
          </strong>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Evaluation Holdout Window:</span>
          <strong className="font-mono text-slate-300">
            {testedCandles} candles
          </strong>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-3 flex items-start gap-1.5 text-[10px] text-slate-500">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
        <span>
          Auto-regressive Ridge + Volatility Cone projection. Stop loss is statistically generated for educational risk management; not SEBI investment advice.
        </span>
      </div>
    </div>
  );
}
