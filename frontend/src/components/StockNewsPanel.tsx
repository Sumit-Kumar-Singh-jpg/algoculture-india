"use client";

import React from "react";
import { Newspaper, ExternalLink, Filter, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StockNewsResponse } from "@/lib/types";

interface StockNewsPanelProps {
  news: StockNewsResponse | null;
  timeframe: string;
  sourceFilter: string;
  onSelectTimeframe: (tf: string) => void;
  onSelectSource: (src: string) => void;
  isLoading: boolean;
}

export function StockNewsPanel({
  news,
  timeframe,
  sourceFilter,
  onSelectTimeframe,
  onSelectSource,
  isLoading,
}: StockNewsPanelProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-[#0e1525] p-4 shadow-lg">
      {/* Header & Sentiment Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-sky-400" />
          <h3 className="text-xs font-semibold text-slate-100">
            Stock News & Sentiment
          </h3>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            {news?.total_articles ?? 0}
          </span>
        </div>

        {/* Mini Sentiment Gauge */}
        {news && news.total_articles > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-medium">
            <span className="flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">
              <TrendingUp className="h-2.5 w-2.5" />
              {news.sentiment_breakdown.BULLISH ?? 0} Bull
            </span>
            <span className="flex items-center gap-1 rounded bg-rose-500/15 px-1.5 py-0.5 text-rose-300">
              <TrendingDown className="h-2.5 w-2.5" />
              {news.sentiment_breakdown.BEARISH ?? 0} Bear
            </span>
            <span className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
              <Minus className="h-2.5 w-2.5" />
              {news.sentiment_breakdown.NEUTRAL ?? 0}
            </span>
          </div>
        )}
      </div>

      {/* Filter Toolbar (Timeframe & Sources) */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[11px]">
        {/* Timeframe pills */}
        <div className="flex items-center rounded-md border border-slate-800 bg-slate-900 p-0.5">
          {[
            { id: "today", label: "Today" },
            { id: "7d", label: "7D" },
            { id: "30d", label: "30D" },
            { id: "all", label: "Historical" },
          ].map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => onSelectTimeframe(tf.id)}
              className={`rounded px-2 py-0.5 transition ${
                timeframe === tf.id
                  ? "bg-sky-500 font-semibold text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Source Dropdown */}
        <div className="flex items-center gap-1 text-slate-400">
          <Filter className="h-3 w-3" />
          <select
            value={sourceFilter}
            onChange={(e) => onSelectSource(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-white outline-none focus:border-sky-500"
          >
            <option value="all">All Sources</option>
            <option value="moneycontrol">Moneycontrol</option>
            <option value="economic times">Economic Times</option>
            <option value="livemint">LiveMint</option>
          </select>
        </div>
      </div>

      {/* Articles Feed */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: "420px" }}>
        {isLoading && !news && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg border border-slate-800 bg-slate-900/40"
              />
            ))}
          </div>
        )}

        {!isLoading && news?.articles.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            No news articles found for this filter criteria.
          </div>
        )}

        {news?.articles.map((art) => {
          const isBull = art.sentiment === "BULLISH";
          const isBear = art.sentiment === "BEARISH";
          return (
            <article
              key={art.id}
              className="group rounded-lg border border-slate-800/90 bg-slate-900/60 p-3 transition hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-2 pb-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sky-400">
                    {art.source}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{art.published_at}</span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    isBull
                      ? "bg-emerald-500/15 text-emerald-300"
                      : isBear
                        ? "bg-rose-500/15 text-rose-300"
                        : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {art.sentiment}
                </span>
              </div>

              <h4 className="text-xs font-medium text-slate-100 group-hover:text-sky-300">
                <a
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <span>{art.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                </a>
              </h4>

              {art.summary && (
                <p className="pt-1 text-[11px] leading-relaxed text-slate-400 line-clamp-2">
                  {art.summary}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
