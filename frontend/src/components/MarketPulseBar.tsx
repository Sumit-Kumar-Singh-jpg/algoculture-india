"use client";

import React from "react";
import { Activity } from "lucide-react";
import type { MarketPulseResponse } from "@/lib/types";
import { formatInr } from "@/lib/format";

interface MarketPulseBarProps {
  pulse: MarketPulseResponse | null;
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

function getStatusBadgeStyle(status: string): string {
  if (status === "OPEN") {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
  }
  if (status === "PRE_OPEN") {
    return "border-amber-500/40 bg-amber-500/15 text-amber-300";
  }
  return "border-slate-700 bg-slate-800/80 text-slate-300";
}

export function MarketPulseBar({
  pulse,
  activeSymbol,
  onSelectSymbol,
}: MarketPulseBarProps) {
  const status = pulse?.market_status ?? "CLOSED";

  return (
    <div className="border-b border-slate-800/90 bg-[#0b111e] px-4 py-2">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Activity className="h-3.5 w-3.5 text-sky-400" />
          <span className="uppercase tracking-wider text-slate-400">
            Market Pulse
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusBadgeStyle(status)}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === "OPEN"
                  ? "animate-pulse bg-emerald-400"
                  : status === "PRE_OPEN"
                    ? "bg-amber-400"
                    : "bg-slate-400"
              }`}
            />
            NSE {status.replace("_", " ")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {pulse?.items.length ? (
            pulse.items.map((item) => {
              const changeVal = typeof item.change === "number" ? item.change : 0;
              const changePct = typeof item.change_pct === "number" ? item.change_pct : 0;
              const isUp = changeVal >= 0;
              const isSelected = activeSymbol === item.symbol;
              return (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => onSelectSymbol(item.symbol)}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition ${
                    isSelected
                      ? "border-sky-500/50 bg-sky-500/10 text-white"
                      : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80"
                  }`}
                >
                  <span className="font-semibold text-slate-200">
                    {item.label}
                  </span>
                  <span className="font-mono text-slate-100">
                    {formatInr(item.ltp, false)}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-medium ${
                      isUp ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isUp ? "+" : ""}
                    {changePct.toFixed(2)}%
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-500">
              Loading NIFTY 50, SENSEX, BANKNIFTY, INDIA VIX…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
