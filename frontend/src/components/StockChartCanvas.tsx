"use client";

import React, { useEffect, useRef, useState } from "react";
import { Pencil, Maximize2 } from "lucide-react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  Time,
} from "lightweight-charts";
import type { CandleItem, TradingMode } from "@/lib/types";
import { IndicatorsDialog } from "./IndicatorsDialog";
import { INDICATOR_REGISTRY } from "@/lib/technicalIndicators";
import { syncChartIndicators, cleanupAllIndicatorSeries } from "@/lib/chartIndicatorRenderer";

interface StockChartCanvasProps {
  symbol?: string;
  interval?: string;
  candles: CandleItem[];
  mode: TradingMode;
  livePrice?: number;
  activeIndicators?: string[];
  onToggleIndicator?: (id: string) => void;
  onClearAllIndicators?: () => void;
  onResetDefaultIndicators?: () => void;
  showVwap?: boolean;
  showEma?: boolean;
  showDma?: boolean;
  showVolume?: boolean;
  showRsi?: boolean;
  aiPredictionData?: Array<{ time: number; price: number; lower1?: number; upper1?: number }> | null;
  stopLossPrice?: number;
  newsEvents?: Array<{ time: number; title: string; sentiment: string }> | null;
  onOpenStudio?: () => void;
}

export function StockChartCanvas({
  symbol,
  interval,
  candles,
  mode,
  livePrice,
  activeIndicators: activeIndicatorsProp,
  onToggleIndicator,
  onClearAllIndicators,
  onResetDefaultIndicators,
  showVwap,
  showEma,
  showDma,
  showVolume,
  showRsi,
  aiPredictionData,
  stopLossPrice,
  newsEvents,
  onOpenStudio,
}: StockChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Indicators State & Dialog
  const [internalIndicators, setInternalIndicators] = useState<string[]>([
    "vwap",
    "ema9",
    "ema21",
    "volume",
  ]);
  const [isIndicatorsDialogOpen, setIsIndicatorsDialogOpen] = useState(false);
  const activeIndicatorIds = activeIndicatorsProp ?? internalIndicators;

  const handleToggleIndicator = (id: string) => {
    if (onToggleIndicator) {
      onToggleIndicator(id);
    } else {
      setInternalIndicators((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    }
  };

  const handleClearAllIndicators = () => {
    if (onClearAllIndicators) {
      onClearAllIndicators();
    } else {
      setInternalIndicators([]);
    }
  };

  const handleResetDefaultIndicators = () => {
    if (onResetDefaultIndicators) {
      onResetDefaultIndicators();
    } else {
      setInternalIndicators(["vwap", "ema9", "ema21", "volume"]);
    }
  };

  // Persistent series refs
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const indicatorSeriesMapRef = useRef<Map<string, ISeriesApi<any>[]>>(new Map());
  const forecastSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const upperBandRef = useRef<ISeriesApi<"Line"> | null>(null);
  const lowerBandRef = useRef<ISeriesApi<"Line"> | null>(null);
  const stopLossSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const prevCandlesLenRef = useRef<number>(0);
  const prevModeRef = useRef<TradingMode>(mode);
  const prevSymbolRef = useRef<string | undefined>(symbol);
  const prevIntervalRef = useRef<string | undefined>(interval);

  const [legend, setLegend] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }>({});

  // 1. Initialize Chart ONCE
  useEffect(() => {
    if (!containerRef.current) return;

    let chart: IChartApi | null = null;
    try {
      chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#0d1424" },
          textColor: "#94a3b8",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "#1e293b55" },
          horzLines: { color: "#1e293b55" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: "#334155",
        },
        timeScale: {
          borderColor: "#334155",
          timeVisible: true,
          secondsVisible: false,
        },
        width: containerRef.current.clientWidth || 800,
        height: 400,
      });

      chartRef.current = chart;

      // Crosshair move listener
      chart.subscribeCrosshairMove((param) => {
        try {
          const candleSeries = candleSeriesRef.current;
          if (!param.time || !candleSeries || !param.seriesData) {
            return;
          }
          const rawData = param.seriesData.get(candleSeries);
          if (!rawData) return;
          const data = rawData as CandlestickData<Time>;
          setLegend({
            time: String(param.time),
            open: typeof data.open === "number" ? data.open : undefined,
            high: typeof data.high === "number" ? data.high : undefined,
            low: typeof data.low === "number" ? data.low : undefined,
            close: typeof data.close === "number" ? data.close : undefined,
          });
        } catch {
          // Ignore crosshair errors
        }
      });
    } catch (err) {
      console.error("Failed to initialize TradingView chart:", err);
      return;
    }

    const handleResize = () => {
      try {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: containerRef.current.clientWidth,
          });
        }
      } catch {
        // Ignore resize errors
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        if (chart) {
          cleanupAllIndicatorSeries(chart, indicatorSeriesMapRef.current);
          chart.remove();
        }
      } catch {
        // Ignore removal error
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      forecastSeriesRef.current = null;
      upperBandRef.current = null;
      lowerBandRef.current = null;
      stopLossSeriesRef.current = null;
    };
  }, []);

  // 2. Update Series and Data incrementally WITHOUT destroying zoom level
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !Array.isArray(candles) || candles.length === 0) return;

    // Filter, sanitize, strictly sort and deduplicate candles
    const seenTimes = new Set<number>();
    const sanitizedCandles = candles
      .filter((c) => {
        return (
          c &&
          typeof c.time === "number" &&
          isFinite(c.time) &&
          typeof c.open === "number" &&
          isFinite(c.open) &&
          typeof c.high === "number" &&
          isFinite(c.high) &&
          typeof c.low === "number" &&
          isFinite(c.low) &&
          typeof c.close === "number" &&
          isFinite(c.close)
        );
      })
      .sort((a, b) => a.time - b.time)
      .filter((c) => {
        if (seenTimes.has(c.time)) return false;
        seenTimes.add(c.time);
        return true;
      });

    if (sanitizedCandles.length === 0) return;

    const modeChanged = prevModeRef.current !== mode;
    const symbolChanged = prevSymbolRef.current !== symbol;
    const intervalChanged = prevIntervalRef.current !== interval;

    prevModeRef.current = mode;
    prevSymbolRef.current = symbol;
    prevIntervalRef.current = interval;

    try {
      // Adjust timescale options if mode changed
      chart.timeScale().applyOptions({
        timeVisible: mode === "intraday",
      });
    } catch {
      // Ignore
    }

    // --- Candlestick Series ---
    try {
      if (!candleSeriesRef.current) {
        candleSeriesRef.current = chart.addCandlestickSeries({
          upColor: "#10b981",
          downColor: "#f43f5e",
          borderVisible: false,
          wickUpColor: "#10b981",
          wickDownColor: "#f43f5e",
          priceLineVisible: true,
          lastValueVisible: true,
        });
      }

      const candleData: CandlestickData<Time>[] = sanitizedCandles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      const stepSec =
        interval === "1m"
          ? 60
          : interval === "15m"
            ? 900
            : interval === "1h"
              ? 3600
              : 300;

      if (
        livePrice !== undefined &&
        typeof livePrice === "number" &&
        isFinite(livePrice) &&
        mode === "intraday" &&
        candleData.length > 0
      ) {
        const lastCandle = candleData[candleData.length - 1];
        const lastTime = Number(lastCandle.time);
        const nowSec = Math.floor(Date.now() / 1000);
        const currentSlot = Math.floor(nowSec / stepSec) * stepSec;

        if (currentSlot > lastTime && currentSlot - lastTime <= stepSec * 3) {
          candleData.push({
            time: currentSlot as Time,
            open: lastCandle.close,
            high: Math.max(lastCandle.close, livePrice),
            low: Math.min(lastCandle.close, livePrice),
            close: livePrice,
          });
        } else {
          lastCandle.close = livePrice;
          lastCandle.high = Math.max(lastCandle.high, livePrice);
          lastCandle.low = Math.min(lastCandle.low, livePrice);
        }
      }

      const isResetting =
        prevCandlesLenRef.current === 0 || modeChanged || symbolChanged || intervalChanged;
      const savedLogicalRange = !isResetting ? chart.timeScale().getVisibleLogicalRange() : null;

      candleSeriesRef.current.setData(candleData);

      // --- Sync all 22+ active technical indicators via chartIndicatorRenderer ---
      syncChartIndicators(
        chart,
        sanitizedCandles,
        activeIndicatorIds,
        indicatorSeriesMapRef.current
      );

      // --- AI Forecast & Stop Loss Overlay ---
      if (aiPredictionData && Array.isArray(aiPredictionData) && aiPredictionData.length > 0) {
        try {
          const lastCandleTime = sanitizedCandles[sanitizedCandles.length - 1]?.time ?? 0;
          const validForecast = aiPredictionData
            .filter(
              (p) =>
                p &&
                typeof p.time === "number" &&
                isFinite(p.time) &&
                p.time > lastCandleTime &&
                typeof p.price === "number" &&
                isFinite(p.price)
            )
            .sort((a, b) => a.time - b.time);

          // Deduplicate forecast timestamps
          const uniqueForecast: typeof validForecast = [];
          const seenPredTimes = new Set<number>();
          for (const pt of validForecast) {
            if (!seenPredTimes.has(pt.time)) {
              seenPredTimes.add(pt.time);
              uniqueForecast.push(pt);
            }
          }

          if (uniqueForecast.length > 0) {
            if (!forecastSeriesRef.current) {
              forecastSeriesRef.current = chart.addLineSeries({
                color: "#38bdf8",
                lineWidth: 2,
                lineStyle: 2,
                title: "AI Forecast",
              });
            }
            if (!upperBandRef.current) {
              upperBandRef.current = chart.addLineSeries({
                color: "#38bdf844",
                lineWidth: 1,
                lineStyle: 3,
                title: "+1σ Band",
              });
            }
            if (!lowerBandRef.current) {
              lowerBandRef.current = chart.addLineSeries({
                color: "#38bdf844",
                lineWidth: 1,
                lineStyle: 3,
                title: "-1σ Band",
              });
            }

            forecastSeriesRef.current.setData(
              uniqueForecast.map((p) => ({ time: p.time as Time, value: p.price }))
            );
            upperBandRef.current.setData(
              uniqueForecast
                .filter((p) => typeof p.upper1 === "number" && isFinite(p.upper1))
                .map((p) => ({ time: p.time as Time, value: p.upper1! }))
            );
            lowerBandRef.current.setData(
              uniqueForecast
                .filter((p) => typeof p.lower1 === "number" && isFinite(p.lower1))
                .map((p) => ({ time: p.time as Time, value: p.lower1! }))
            );

            // Render AI Stop Loss line across forecast span if stopLossPrice is available
            if (
              stopLossPrice !== undefined &&
              typeof stopLossPrice === "number" &&
              isFinite(stopLossPrice) &&
              stopLossPrice > 0
            ) {
              if (!stopLossSeriesRef.current) {
                stopLossSeriesRef.current = chart.addLineSeries({
                  color: "#f43f5e",
                  lineWidth: 1,
                  lineStyle: 2, // Dashed
                  title: "AI Stop Loss",
                });
              }
              stopLossSeriesRef.current.setData(
                uniqueForecast.map((p) => ({ time: p.time as Time, value: stopLossPrice }))
              );
            } else if (stopLossSeriesRef.current) {
              chart.removeSeries(stopLossSeriesRef.current);
              stopLossSeriesRef.current = null;
            }
          } else {
            if (forecastSeriesRef.current) {
              chart.removeSeries(forecastSeriesRef.current);
              forecastSeriesRef.current = null;
            }
            if (upperBandRef.current) {
              chart.removeSeries(upperBandRef.current);
              upperBandRef.current = null;
            }
            if (lowerBandRef.current) {
              chart.removeSeries(lowerBandRef.current);
              lowerBandRef.current = null;
            }
            if (stopLossSeriesRef.current) {
              chart.removeSeries(stopLossSeriesRef.current);
              stopLossSeriesRef.current = null;
            }
          }
        } catch (err) {
          console.warn("Forecast overlay render notice:", err);
        }
      } else {
        if (forecastSeriesRef.current) {
          chart.removeSeries(forecastSeriesRef.current);
          forecastSeriesRef.current = null;
        }
        if (upperBandRef.current) {
          chart.removeSeries(upperBandRef.current);
          upperBandRef.current = null;
        }
        if (lowerBandRef.current) {
          chart.removeSeries(lowerBandRef.current);
          lowerBandRef.current = null;
        }
        if (stopLossSeriesRef.current) {
          chart.removeSeries(stopLossSeriesRef.current);
          stopLossSeriesRef.current = null;
        }
      }

      // --- News Event Pins (Long-Term mode only) ---
      if (newsEvents && Array.isArray(newsEvents) && newsEvents.length > 0 && mode === "longterm") {
        const eventByTime = new Map<number, { sentiment: string; count: number }>();
        for (const ev of newsEvents) {
          if (!ev || typeof ev.time !== "number" || !isFinite(ev.time)) continue;
          const matchingCandle = sanitizedCandles.find(
            (c) => Math.abs(c.time - ev.time) <= 86400 * 2
          );
          if (matchingCandle) {
            const closest = sanitizedCandles.reduce((prev, curr) =>
              Math.abs(curr.time - ev.time) < Math.abs(prev.time - ev.time)
                ? curr
                : prev
            );
            const existing = eventByTime.get(closest.time);
            if (existing) {
              existing.count += 1;
              if (ev.sentiment === "BULLISH" && existing.sentiment !== "BULLISH") {
                existing.sentiment = "BULLISH";
              } else if (ev.sentiment === "BEARISH" && existing.sentiment === "NEUTRAL") {
                existing.sentiment = "BEARISH";
              }
            } else {
              eventByTime.set(closest.time, { sentiment: ev.sentiment || "NEUTRAL", count: 1 });
            }
          }
        }

        const sortedTimes = Array.from(eventByTime.keys()).sort((a, b) => a - b);
        const markers = sortedTimes.map((t) => {
          const item = eventByTime.get(t)!;
          return {
            time: t as Time,
            position: "aboveBar" as const,
            color:
              item.sentiment === "BULLISH"
                ? "#10b981"
                : item.sentiment === "BEARISH"
                  ? "#f43f5e"
                  : "#38bdf8",
            shape: "circle" as const,
            text: item.count > 1 ? `News (${item.count})` : "News",
          };
        });

        if (markers.length > 0 && candleSeriesRef.current) {
          try {
            candleSeriesRef.current.setMarkers(markers);
          } catch {
            // Ignore marker errors
          }
        }
      } else if (candleSeriesRef.current) {
        try {
          candleSeriesRef.current.setMarkers([]);
        } catch {
          // Ignore
        }
      }

      // Set initial legend from last candle
      const last = sanitizedCandles[sanitizedCandles.length - 1];
      if (last) {
        const liveValid = typeof livePrice === "number" && isFinite(livePrice);
        setLegend({
          time: last.time_iso,
          open: last.open,
          high: liveValid && mode === "intraday" ? Math.max(last.high, livePrice) : last.high,
          low: liveValid && mode === "intraday" ? Math.min(last.low, livePrice) : last.low,
          close: liveValid && mode === "intraday" ? livePrice : last.close,
          volume: last.volume,
        });
      }

      // ONLY fitContent on initial load, symbol switch, mode switch, or interval switch
      if (isResetting) {
        chart.timeScale().fitContent();
      } else if (
        savedLogicalRange &&
        typeof savedLogicalRange.from === "number" &&
        typeof savedLogicalRange.to === "number" &&
        isFinite(savedLogicalRange.from) &&
        isFinite(savedLogicalRange.to)
      ) {
        const delta = candleData.length - prevCandlesLenRef.current;
        if (delta > 0 && savedLogicalRange.to >= prevCandlesLenRef.current - 1) {
          chart.timeScale().setVisibleLogicalRange({
            from: savedLogicalRange.from + delta,
            to: savedLogicalRange.to + delta,
          });
        } else {
          chart.timeScale().setVisibleLogicalRange(savedLogicalRange);
        }
      }
      prevCandlesLenRef.current = sanitizedCandles.length;
    } catch (err) {
      console.error("StockChartCanvas series update error:", err);
    }
  }, [
    candles,
    mode,
    symbol,
    interval,
    activeIndicatorIds,
    aiPredictionData,
    stopLossPrice,
    newsEvents,
  ]);

  // 3. Live Price Tick Effect: updates the active candle bar and legend in real-time between full candle polls
  useEffect(() => {
    try {
      const candleSeries = candleSeriesRef.current;
      if (
        !candleSeries ||
        livePrice === undefined ||
        typeof livePrice !== "number" ||
        !isFinite(livePrice) ||
        !Array.isArray(candles) ||
        candles.length === 0 ||
        mode !== "intraday"
      ) {
        return;
      }
      const last = candles[candles.length - 1];
      if (!last || typeof last.time !== "number" || !isFinite(last.time)) return;

      const stepSec =
        interval === "1m"
          ? 60
          : interval === "15m"
            ? 900
            : interval === "1h"
              ? 3600
              : 300;
      const lastTime = Number(last.time);
      const nowSec = Math.floor(Date.now() / 1000);
      const currentSlot = Math.floor(nowSec / stepSec) * stepSec;

      if (currentSlot > lastTime && currentSlot - lastTime <= stepSec * 3) {
        candleSeries.update({
          time: currentSlot as Time,
          open: last.close,
          high: Math.max(last.close, livePrice),
          low: Math.min(last.close, livePrice),
          close: livePrice,
        });
      } else {
        const updatedHigh = Math.max(last.high, livePrice);
        const updatedLow = Math.min(last.low, livePrice);
        candleSeries.update({
          time: last.time as Time,
          open: last.open,
          high: updatedHigh,
          low: updatedLow,
          close: livePrice,
        });
      }

      setLegend((prev) => ({
        ...prev,
        close: livePrice,
        high: Math.max(prev.high ?? last.high, livePrice),
        low: Math.min(prev.low ?? last.low, livePrice),
      }));
    } catch (err) {
      console.warn("Live tick update notice:", err);
    }
  }, [livePrice, candles, mode, interval]);

  return (
    <div className="relative w-full">
      {/* Dynamic OHLC Bar Legend */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800/80 bg-slate-900/60 px-3 py-1.5 font-mono text-[11px] text-slate-300">
        <span>
          O: <strong className="text-white">{legend.open ?? "—"}</strong>
        </span>
        <span>
          H: <strong className="text-emerald-400">{legend.high ?? "—"}</strong>
        </span>
        <span>
          L: <strong className="text-rose-400">{legend.low ?? "—"}</strong>
        </span>
        <span>
          C: <strong className="text-white">{legend.close ?? "—"}</strong>
        </span>
        {legend.volume !== undefined && (
          <span>
            Vol: <strong className="text-sky-300">{legend.volume.toLocaleString("en-IN")}</strong>
          </span>
        )}

        {/* Active Indicators Chips */}
        {activeIndicatorIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pl-2">
            {activeIndicatorIds.map((id) => {
              const def = INDICATOR_REGISTRY.find((i) => i.id === id);
              if (!def) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded bg-slate-800/90 border border-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-200 shadow-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: def.color }} />
                  <span className="font-semibold">{def.shortName}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleIndicator(id)}
                    className="text-slate-400 hover:text-rose-400 ml-0.5 font-bold"
                    title={`Remove ${def.name}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* fx Indicators button */}
          <button
            type="button"
            onClick={() => setIsIndicatorsDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-700/70 bg-slate-800/80 px-2 py-0.5 text-[11px] font-semibold text-slate-200 hover:border-sky-500/50 hover:text-white transition shadow-sm"
            title="Open 22+ Technical Indicators & Studies"
          >
            <span className="font-mono text-sky-400 font-bold">fx</span>
            <span>Indicators</span>
            <span className="rounded-full bg-sky-500/20 px-1.5 py-0.2 font-mono text-[9px] text-sky-300">
              {activeIndicatorIds.length}
            </span>
          </button>

          {onOpenStudio && (
            <button
              type="button"
              onClick={onOpenStudio}
              className="flex items-center gap-1.5 rounded-md border border-sky-500/40 bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/25 transition shadow-sm"
              title="Open Interactive Chart & Drawing Studio"
            >
              <Pencil className="h-3 w-3 text-sky-400" />
              <span>Drawing Studio</span>
              <Maximize2 className="h-2.5 w-2.5 text-sky-400 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      <div ref={containerRef} className="w-full" />

      {/* Studies & Indicators Dialog */}
      <IndicatorsDialog
        isOpen={isIndicatorsDialogOpen}
        onClose={() => setIsIndicatorsDialogOpen(false)}
        activeIndicatorIds={activeIndicatorIds}
        onToggleIndicator={handleToggleIndicator}
        onClearAll={handleClearAllIndicators}
        onResetDefaults={handleResetDefaultIndicators}
      />
    </div>
  );
}
