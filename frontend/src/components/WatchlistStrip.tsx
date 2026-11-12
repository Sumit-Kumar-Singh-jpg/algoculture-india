"use client";

import React from "react";
import { Bookmark, X } from "lucide-react";
import type { WatchlistEntry } from "@/lib/types";

interface WatchlistStripProps {
  items: WatchlistEntry[];
  activeSymbol: string;
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
}

export function WatchlistStrip({
  items,
  activeSymbol,
  onSelect,
  onRemove,
}: WatchlistStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 bg-[#0c1220] px-4 py-2">
      <div className="flex items-center gap-1.5 pr-1 text-xs font-medium text-slate-400">
        <Bookmark className="h-3.5 w-3.5 text-amber-400" />
        <span>Watchlist:</span>
      </div>

      {items.map((item) => {
        const isActive = item.symbol === activeSymbol;
        return (
          <div
            key={item.symbol}
            className={`group flex items-center rounded-full border text-xs transition ${
              isActive
                ? "border-sky-500/60 bg-sky-500/15 text-sky-200"
                : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:bg-slate-800"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(item.symbol)}
              className="px-2.5 py-1 font-medium"
              title={item.name}
            >
              {item.symbol}
            </button>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(item.symbol)}
                aria-label={`Remove ${item.symbol} from watchlist`}
                className="mr-1 rounded-full p-0.5 text-slate-500 opacity-70 transition hover:bg-slate-700 hover:text-slate-200 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
