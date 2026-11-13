"use client";

import React, { useEffect, useRef, useState } from "react";
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

interface StockChartCanvasProps {
  symbol?: string;
  interval?: string;
  candles: CandleItem[];
  mode: TradingMode;
  showVwap: boolean;
  showEma: boolean;
  showDma: boolean;
  showVolume: boolean;
  showRsi: boolean;
  aiPredictionData?: Array<{ time: number; price: number; lower1?: number; upper1?: number }> | null;
  newsEvents?: Array<{ time: number; title: string; sentiment: string }> | null;
}

export function StockChartCanvas({
  symbol,
  interval,
  candles,
  mode,
  showVwap,
  showEma,
  showDma,
  showVolume,
  showRsi,
  aiPredictionData,
  newsEvents,
}: StockChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Persistent series refs
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const dma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const dma200SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const forecastSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const upperBandRef = useRef<ISeriesApi<"Line"> | null>(null);
  const lowerBandRef = useRef<ISeriesApi<"Line"> | null>(null);

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

    const chart = createChart(containerRef.current, {
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
      width: containerRef.current.clientWidth,
      height: 400,
    });

    chartRef.current = chart;

    // Crosshair move listener
    chart.subscribeCrosshairMove((param) => {
      const candleSeries = candleSeriesRef.current;
      if (!param.time || !candleSeries || !param.seriesData.get(candleSeries)) {
        return;
      }
      const data = param.seriesData.get(candleSeries) as CandlestickData<Time>;
      setLegend({
        time: String(param.time),
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
      });
    });

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      vwapSeriesRef.current = null;
      ema9SeriesRef.current = null;
      ema21SeriesRef.current = null;
      dma50SeriesRef.current = null;
      dma200SeriesRef.current = null;
      forecastSeriesRef.current = null;
      upperBandRef.current = null;
      lowerBandRef.current = null;
    };
  }, []);

  // 2. Update Series and Data incrementally WITHOUT destroying zoom level
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;

    const modeChanged = prevModeRef.current !== mode;
    const symbolChanged = prevSymbolRef.current !== symbol;
    const intervalChanged = prevIntervalRef.current !== interval;

    prevModeRef.current = mode;
    prevSymbolRef.current = symbol;
    prevIntervalRef.current = interval;

    // Adjust timescale options if mode changed
    chart.timeScale().applyOptions({
      timeVisible: mode === "intraday",
    });

    // --- Candlestick Series ---
    if (!candleSeriesRef.current) {
      candleSeriesRef.current = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#f43f5e",
        borderVisible: false,
        wickUpColor: "#10b981",
        wickDownColor: "#f43f5e",
      });
    }

    const candleData: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(candleData);

    // --- Volume Series ---
    if (showVolume) {
      if (!volumeSeriesRef.current) {
        volumeSeriesRef.current = chart.addHistogramSeries({
          color: "#38bdf844",
          priceFormat: { type: "volume" },
          priceScaleId: "",
        });
        volumeSeriesRef.current.priceScale().applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
      }
      const volData: HistogramData<Time>[] = candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? "#10b98133" : "#f43f5e33",
      }));
      volumeSeriesRef.current.setData(volData);
    } else if (volumeSeriesRef.current) {
      chart.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    // --- VWAP Series (Intraday only) ---
    if (showVwap && mode === "intraday") {
      if (!vwapSeriesRef.current) {
        vwapSeriesRef.current = chart.addLineSeries({
          color: "#f59e0b",
          lineWidth: 1,
          title: "VWAP",
        });
      }
      const vwapData: LineData<Time>[] = candles
        .filter((c) => c.vwap !== null && c.vwap !== undefined)
        .map((c) => ({ time: c.time as Time, value: c.vwap! }));
      vwapSeriesRef.current.setData(vwapData);
    } else if (vwapSeriesRef.current) {
      chart.removeSeries(vwapSeriesRef.current);
      vwapSeriesRef.current = null;
    }

    // --- EMA 9 & 21 ---
    if (showEma) {
      if (!ema9SeriesRef.current) {
        ema9SeriesRef.current = chart.addLineSeries({
          color: "#38bdf8",
          lineWidth: 1,
          title: "EMA 9",
        });
      }
      if (!ema21SeriesRef.current) {
        ema21SeriesRef.current = chart.addLineSeries({
          color: "#ec4899",
          lineWidth: 1,
          title: "EMA 21",
        });
      }
      ema9SeriesRef.current.setData(
        candles
          .filter((c) => c.ema9 !== null && c.ema9 !== undefined)
          .map((c) => ({ time: c.time as Time, value: c.ema9! }))
      );
      ema21SeriesRef.current.setData(
        candles
          .filter((c) => c.ema21 !== null && c.ema21 !== undefined)
          .map((c) => ({ time: c.time as Time, value: c.ema21! }))
      );
    } else {
      if (ema9SeriesRef.current) {
        chart.removeSeries(ema9SeriesRef.current);
        ema9SeriesRef.current = null;
      }
      if (ema21SeriesRef.current) {
        chart.removeSeries(ema21SeriesRef.current);
        ema21SeriesRef.current = null;
      }
    }

    // --- 50 & 200 DMA (Long-Term only) ---
    if (showDma && mode === "longterm") {
      if (!dma50SeriesRef.current) {
        dma50SeriesRef.current = chart.addLineSeries({
          color: "#a855f7",
          lineWidth: 1,
          title: "50 DMA",
        });
      }
      if (!dma200SeriesRef.current) {
        dma200SeriesRef.current = chart.addLineSeries({
          color: "#f97316",
          lineWidth: 2,
          title: "200 DMA",
        });
      }
      dma50SeriesRef.current.setData(
        candles
          .filter((c) => c.sma50 !== null && c.sma50 !== undefined)
          .map((c) => ({ time: c.time as Time, value: c.sma50! }))
      );
      dma200SeriesRef.current.setData(
        candles
          .filter((c) => c.sma200 !== null && c.sma200 !== undefined)
          .map((c) => ({ time: c.time as Time, value: c.sma200! }))
      );
    } else {
      if (dma50SeriesRef.current) {
        chart.removeSeries(dma50SeriesRef.current);
        dma50SeriesRef.current = null;
      }
      if (dma200SeriesRef.current) {
        chart.removeSeries(dma200SeriesRef.current);
        dma200SeriesRef.current = null;
      }
    }

    // --- AI Forecast Overlay ---
    if (aiPredictionData && aiPredictionData.length > 0) {
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
        aiPredictionData.map((p) => ({ time: p.time as Time, value: p.price }))
      );
      upperBandRef.current.setData(
        aiPredictionData
          .filter((p) => p.upper1 !== undefined)
          .map((p) => ({ time: p.time as Time, value: p.upper1! }))
      );
      lowerBandRef.current.setData(
        aiPredictionData
          .filter((p) => p.lower1 !== undefined)
          .map((p) => ({ time: p.time as Time, value: p.lower1! }))
      );
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
    }

    // --- News Event Pins (Long-Term mode only) ---
    if (newsEvents && newsEvents.length > 0 && mode === "longterm") {
      const eventByTime = new Map<number, { sentiment: string; count: number }>();
      for (const ev of newsEvents) {
        const matchingCandle = candles.find(
          (c) => Math.abs(c.time - ev.time) <= 86400 * 2
        );
        if (matchingCandle) {
          const closest = candles.reduce((prev, curr) =>
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
            eventByTime.set(closest.time, { sentiment: ev.sentiment, count: 1 });
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
          // Ignore
        }
      }
    } else {
      if (candleSeriesRef.current) {
        try {
          candleSeriesRef.current.setMarkers([]);
        } catch {
          // Ignore
        }
      }
    }

    // Set initial legend
    const last = candles[candles.length - 1];
    setLegend({
      time: last.time_iso,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      volume: last.volume,
    });

    // ONLY fitContent on initial load, symbol switch, mode switch, or interval switch — NOT on periodic polling updates!
    if (prevCandlesLenRef.current === 0 || modeChanged || symbolChanged || intervalChanged) {
      chart.timeScale().fitContent();
    }
    prevCandlesLenRef.current = candles.length;
  }, [candles, mode, symbol, interval, showVwap, showEma, showDma, showVolume, aiPredictionData, newsEvents]);

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
      </div>

      <div ref={containerRef} className="w-full" />
    </div>
  );
}
