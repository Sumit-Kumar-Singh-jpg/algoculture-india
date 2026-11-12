"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchStocks } from "@/lib/api";
import type { StockSearchItem } from "@/lib/types";

interface StockSearchBarProps {
  onSelect: (item: StockSearchItem) => void;
}

export function StockSearchBar({ onSelect }: StockSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockSearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchStocks(query, controller.signal);
        setResults(res.results);
        setActiveIndex(0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function commitSelection(item: StockSearchItem) {
    onSelect(item);
    setQuery("");
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true);
      return;
    }
    if (!results.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = results[activeIndex];
      if (chosen) commitSelection(chosen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search NSE/BSE stocks & indices (e.g. RELIANCE, NIFTY, TCS)…"
          aria-label="Search NSE or BSE stock"
          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/90 py-2 pl-9 pr-9 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-sky-400" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-80 w-full overflow-y-auto rounded-lg border border-slate-700/90 bg-[#0e1525] p-1 shadow-2xl"
        >
          {results.map((item, idx) => {
            const isHighlighted = idx === activeIndex;
            return (
              <li key={item.yahoo_symbol}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => commitSelection(item)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                    isHighlighted
                      ? "bg-sky-500/15 text-white"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">
                        {item.symbol}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                        {item.exchange}
                      </span>
                      {item.is_fno && (
                        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                          F&O
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-400">
                      {item.name}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-500">
                    {item.sector}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
