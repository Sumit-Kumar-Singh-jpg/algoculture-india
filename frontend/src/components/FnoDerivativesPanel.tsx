"use client";

import React from "react";
import { ShieldCheck, BarChart2 } from "lucide-react";
import type { FnoAnalyticsResponse } from "@/lib/types";
import { formatIndianVolume, formatInr } from "@/lib/format";

interface FnoDerivativesPanelProps {
  fno: FnoAnalyticsResponse | null;
  selectedExpiry: string;
  onSelectExpiry: (exp: string) => void;
  isLoading: boolean;
}

export function FnoDerivativesPanel({
  fno,
  selectedExpiry,
  onSelectExpiry,
  isLoading,
}: FnoDerivativesPanelProps) {
  if (isLoading && !fno) {
    return (
      <div className="h-72 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50 p-6" />
    );
  }

  if (!fno || !fno.fno_eligible) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0e1525] p-6 text-center">
        <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-200">
          Not in NSE F&O Segment
        </h3>
        <p className="mx-auto max-w-md pt-1 text-xs text-slate-400">
          {fno?.message || "This stock does not trade in the Futures & Options market. Switch to NIFTY, BANKNIFTY, RELIANCE, TCS, or INFY to view derivative option chains."}
        </p>
      </div>
    );
  }

  const maxCallOi = Math.max(...fno.strikes.map((s) => s.call_oi), 1);
  const maxPutOi = Math.max(...fno.strikes.map((s) => s.put_oi), 1);
  const maxOi = Math.max(maxCallOi, maxPutOi);

  return (
    <div className="space-y-4">
      {/* F&O Key Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <span className="block text-[11px] text-slate-400">Put-Call Ratio (PCR)</span>
          <span className="font-mono text-base font-bold text-white">
            {fno.pcr ?? "—"}
          </span>
          <span className="block text-[10px] text-slate-500">{fno.fno_bias}</span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <span className="block text-[11px] text-slate-400">Max Pain Strike</span>
          <span className="font-mono text-base font-bold text-amber-400">
            {formatInr(fno.max_pain, false)}
          </span>
          <span className="block text-[10px] text-slate-500">Settlement Target</span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <span className="block text-[11px] text-slate-400">ATM Implied Volatility</span>
          <span className="font-mono text-base font-bold text-sky-400">
            {fno.atm_iv ? `${fno.atm_iv.toFixed(1)}%` : "—"}
          </span>
          <span className="block text-[10px] text-slate-500">ATM IV</span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <span className="block text-[11px] text-slate-400">Call OI Resistance</span>
          <span className="font-mono text-base font-bold text-rose-400">
            {formatInr(fno.call_resistance_strike, false)}
          </span>
          <span className="block text-[10px] text-slate-500">Highest Call OI</span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <span className="block text-[11px] text-slate-400">Put OI Support</span>
          <span className="font-mono text-base font-bold text-emerald-400">
            {formatInr(fno.put_support_strike, false)}
          </span>
          <span className="block text-[10px] text-slate-500">Highest Put OI</span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <span className="block text-[11px] text-slate-400">Expiry Selection</span>
          <select
            value={selectedExpiry}
            onChange={(e) => onSelectExpiry(e.target.value)}
            className="mt-0.5 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-white outline-none focus:border-sky-500"
          >
            {fno.expiries.map((exp) => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Strike-wise Call vs Put OI Visual Bar Distribution */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0e1525] p-4">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-sky-400" />
            <h4 className="text-xs font-semibold text-slate-200">
              Open Interest (OI) Distribution by Strike
            </h4>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
              Call OI (Resistance)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              Put OI (Support)
            </span>
          </div>
        </div>

        {/* Horizontal Strike Comparison Bars */}
        <div className="space-y-1.5 pt-2">
          {fno.strikes.map((s) => {
            const isAtm = Math.abs(s.strike - fno.spot_price) <= (s.strike * 0.005);
            const callPct = (s.call_oi / maxOi) * 100;
            const putPct = (s.put_oi / maxOi) * 100;

            return (
              <div
                key={s.strike}
                className={`grid grid-cols-12 items-center gap-2 rounded px-2 py-1 text-xs ${
                  isAtm ? "border border-amber-500/40 bg-amber-500/10" : "hover:bg-slate-800/50"
                }`}
              >
                {/* Call OI bar (fills right to left) */}
                <div className="col-span-5 flex items-center justify-end gap-2">
                  <span className="font-mono text-[11px] text-slate-400">
                    {formatIndianVolume(s.call_oi)}
                  </span>
                  <div className="h-3 w-32 rounded-l bg-slate-800">
                    <div
                      className="ml-auto h-full rounded-l bg-rose-500"
                      style={{ width: `${callPct}%` }}
                    />
                  </div>
                </div>

                {/* Strike Price */}
                <div className="col-span-2 text-center">
                  <span
                    className={`font-mono font-bold ${
                      isAtm ? "text-amber-400" : "text-white"
                    }`}
                  >
                    {s.strike}
                    {isAtm && (
                      <span className="ml-1 text-[10px] text-amber-300">ATM</span>
                    )}
                  </span>
                </div>

                {/* Put OI bar (fills left to right) */}
                <div className="col-span-5 flex items-center justify-start gap-2">
                  <div className="h-3 w-32 rounded-r bg-slate-800">
                    <div
                      className="h-full rounded-r bg-emerald-500"
                      style={{ width: `${putPct}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {formatIndianVolume(s.put_oi)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
