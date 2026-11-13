"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Check,
  TrendingUp,
  Activity,
  BarChart3,
  Sliders,
  Sparkles,
  Layers,
  RotateCcw,
} from "lucide-react";
import {
  INDICATOR_REGISTRY,
  IndicatorDefinition,
  IndicatorCategory,
} from "@/lib/technicalIndicators";

interface IndicatorsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeIndicatorIds: string[];
  onToggleIndicator: (id: string) => void;
  onClearAll: () => void;
  onResetDefaults: () => void;
}

const CATEGORIES: { id: IndicatorCategory | "all"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All Indicators", icon: Layers },
  { id: "trend", label: "Trend & Overlays", icon: TrendingUp },
  { id: "momentum", label: "Momentum & Oscillators", icon: Activity },
  { id: "volatility", label: "Volatility", icon: Sliders },
  { id: "volume", label: "Volume & Flow", icon: BarChart3 },
  { id: "levels", label: "Key Levels & Pivots", icon: Sparkles },
];

export function IndicatorsDialog({
  isOpen,
  onClose,
  activeIndicatorIds,
  onToggleIndicator,
  onClearAll,
  onResetDefaults,
}: IndicatorsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IndicatorCategory | "all">("all");

  const filteredIndicators = useMemo(() => {
    return INDICATOR_REGISTRY.filter((ind) => {
      const matchesCategory =
        selectedCategory === "all" || ind.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ind.name.toLowerCase().includes(q) ||
        ind.shortName.toLowerCase().includes(q) ||
        ind.description.toLowerCase().includes(q) ||
        ind.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] max-h-[720px] w-full max-w-3xl flex-col rounded-2xl border border-slate-800 bg-[#0c1322] shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#0e1626]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 font-mono font-bold text-white shadow-md shadow-sky-500/20">
              fx
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Technical Indicators & Studies
              </h2>
              <p className="text-xs text-slate-400">
                Institutional-grade overlays, momentum oscillators, and volume analytics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar & Active Summary */}
        <div className="border-b border-slate-800/80 px-6 py-3 bg-[#0a101d] flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indicators by name or ticker (e.g. RSI, Supertrend, Bollinger, MACD)..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Active Indicators Strip */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
              <span className="text-slate-400 font-medium whitespace-nowrap">
                Active ({activeIndicatorIds.length}):
              </span>
              {activeIndicatorIds.length === 0 ? (
                <span className="text-slate-500 italic">None selected</span>
              ) : (
                activeIndicatorIds.map((id) => {
                  const def = INDICATOR_REGISTRY.find((i) => i.id === id);
                  if (!def) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-white whitespace-nowrap shadow-sm"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: def.color }}
                      />
                      <span>{def.shortName}</span>
                      <button
                        type="button"
                        onClick={() => onToggleIndicator(id)}
                        className="text-slate-400 hover:text-rose-400 ml-0.5"
                        title="Remove indicator"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeIndicatorIds.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="rounded px-2 py-1 text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 transition"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={onResetDefaults}
                className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Defaults</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 px-6 py-2 bg-[#0d1424] overflow-x-auto no-scrollbar text-xs">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count =
              cat.id === "all"
                ? INDICATOR_REGISTRY.length
                : INDICATOR_REGISTRY.filter((i) => i.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition whitespace-nowrap ${
                  isSelected
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isSelected ? "bg-sky-700 text-sky-100" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Indicators List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {filteredIndicators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Search className="h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No matching indicators found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching with a different keyword or select &ldquo;All Indicators&rdquo;.
              </p>
            </div>
          ) : (
            filteredIndicators.map((ind) => {
              const isActive = activeIndicatorIds.includes(ind.id);

              return (
                <div
                  key={ind.id}
                  onClick={() => onToggleIndicator(ind.id)}
                  className={`group flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                    isActive
                      ? "border-sky-500/60 bg-sky-950/20 shadow-md shadow-sky-950/30"
                      : "border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-start gap-3.5 pr-4">
                    <div
                      className="mt-1 h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: ind.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white group-hover:text-sky-300 transition">
                          {ind.name}
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700/60">
                          {ind.shortName}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-medium uppercase tracking-wider ${
                            ind.isOverlay
                              ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          }`}
                        >
                          {ind.isOverlay ? "Overlay" : "Sub-Scale"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {ind.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <button
                      type="button"
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                        isActive
                          ? "border-sky-500 bg-sky-500 text-white shadow-sm"
                          : "border-slate-700 bg-slate-800/60 text-transparent hover:border-slate-600 hover:text-slate-400"
                      }`}
                      aria-label={`Toggle ${ind.name}`}
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-3 bg-[#0a101d] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Overlays render on main candlestick scale; Oscillators plot in synchronized sub-scale.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-sky-500 px-4 py-1.5 font-semibold text-white hover:bg-sky-400 transition shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
