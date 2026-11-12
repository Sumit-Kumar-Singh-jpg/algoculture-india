"use client";

import React from "react";
import { Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TechnicalBias } from "@/lib/types";

interface TechnicalBiasStripProps {
  bias: TechnicalBias | null;
  fnoBias?: string;
  isFno: boolean;
}

export function TechnicalBiasStrip({
  bias,
  fnoBias,
  isFno,
}: TechnicalBiasStripProps) {
  if (!bias) return null;

  const isBullish = bias.bias === "BULLISH";
  const isBearish = bias.bias === "BEARISH";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-[#0c1322] px-3.5 py-2 text-xs">
      {/* Overall Score Badge */}
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-sky-400" />
        <span className="font-medium text-slate-400">Technical Bias:</span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${
            isBullish
              ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : isBearish
                ? "border border-rose-500/40 bg-rose-500/15 text-rose-300"
                : "border border-slate-700 bg-slate-800 text-slate-300"
          }`}
        >
          {isBullish && <TrendingUp className="h-3 w-3" />}
          {isBearish && <TrendingDown className="h-3 w-3" />}
          {!isBullish && !isBearish && <Minus className="h-3 w-3" />}
          {bias.bias} ({bias.score > 0 ? "+" : ""}
          {bias.score.toFixed(2)})
        </span>
      </div>

      {/* Indicator Pill Tags */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        {bias.rsi !== null && bias.rsi !== undefined && (
          <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-slate-300">
            RSI(14): <strong className="text-white">{bias.rsi}</strong>
          </span>
        )}
        <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-slate-300">
          VWAP: <strong className="text-white">{bias.vwap_signal}</strong>
        </span>
        <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-slate-300">
          EMA: <strong className="text-white">{bias.ema_signal}</strong>
        </span>
        {bias.dma_signal !== "Neutral" && (
          <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-slate-300">
            DMA: <strong className="text-white">{bias.dma_signal}</strong>
          </span>
        )}
        {isFno && fnoBias && (
          <span className="rounded border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 font-medium text-indigo-300">
            F&O: {fnoBias}
          </span>
        )}
      </div>
    </div>
  );
}
