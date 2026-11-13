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
  const [legend, setLegend] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }>({});

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
        timeVisible: mode === "intraday",
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 400,
    });

    chartRef.current = chart;

    // 1. Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#f43f5e",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
    });

    const candleData: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.setData(candleData);

    // 2. Volume series
    let volumeSeries: ISeriesApi<"Histogram"> | null = null;
    if (showVolume) {
      volumeSeries = chart.addHistogramSeries({
        color: "#38bdf844",
        priceFormat: { type: "volume" },
        priceScaleId: "", // overlay
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      const volData: HistogramData<Time>[] = candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? "#10b98133" : "#f43f5e33",
      }));
      volumeSeries.setData(volData);
    }

    // 3. VWAP overlay
    if (showVwap && mode === "intraday") {
      const vwapSeries = chart.addLineSeries({
        color: "#f59e0b",
        lineWidth: 1,
        title: "VWAP",
      });
      const vwapData: LineData<Time>[] = candles
        .filter((c) => c.vwap !== null && c.vwap !== undefined)
        .map((c) => ({ time: c.time as Time, value: c.vwap! }));
      vwapSeries.setData(vwapData);
    }

    // 4. EMA 9 & 21
    if (showEma) {
      const ema9Series = chart.addLineSeries({
        color: "#38bdf8",
        lineWidth: 1,
        title: "EMA 9",
      });
      const ema21Series = chart.addLineSeries({
        color: "#ec4899",
        lineWidth: 1,
        title: "EMA 21",
      });

      ema9Series.setData(
        candles
          .filter((c) => c.ema9 !== null && c.ema9 !== undefined)
          .map((c) => ({ time: c.time as Time, value: c.ema9! }))
      );
      ema21Series.setData(
        candles
          .filter((c) => c.ema21 !== null && c.ema21 !== undefined)
          .map((c) => ({ time: c.time as Time, value: c.ema21! }))
      );
    }

    // 5. 50 & 200 DMA (Long-Term mode)
    if (showDma && mode === "longterm") {
      const dma50Series = chart.addLineSeries({
        color: "#a855f7",
        lineWidth: 1,
        title: "50 DMA",
      });
      const dma200Series = chart.addLineSeries({
        color: "#f97316",
        lineWidth: 2,
        title: "200 DMA",
      });

      dma50Series.setData(
        candles
          .filter((c) => c.sma50 !== null && c.sma50 !== undefined)
          .map((c) => ({ time: c.time as Time, value: c.sma50! }))
      );
      dma200Series.setData(
        candles
          .filter((c) => c.sma200 !== null && c.sma200 !== undefined)
          .map((c) => ({ time: c.time as Time, value: c.sma200! }))
      );
    }

    // 6. AI Forecast Projection Overlay (dashed trajectory + bands)
    if (aiPredictionData && aiPredictionData.length > 0) {
      const forecastSeries = chart.addLineSeries({
        color: "#38bdf8",
        lineWidth: 2,
        lineStyle: 2, // Dashed
        title: "AI Forecast",
      });
      forecastSeries.setData(
        aiPredictionData.map((p) => ({ time: p.time as Time, value: p.price }))
      );

      const upperBand = chart.addLineSeries({
        color: "#38bdf844",
        lineWidth: 1,
        lineStyle: 3, // Dotted
        title: "+1σ Band",
      });
      upperBand.setData(
        aiPredictionData
          .filter((p) => p.upper1 !== undefined)
          .map((p) => ({ time: p.time as Time, value: p.upper1! }))
      );

      const lowerBand = chart.addLineSeries({
        color: "#38bdf844",
        lineWidth: 1,
        lineStyle: 3,
        title: "-1σ Band",
      });
      lowerBand.setData(
        aiPredictionData
          .filter((p) => p.lower1 !== undefined)
          .map((p) => ({ time: p.time as Time, value: p.lower1! }))
      );
    }

    // 7. News Event Pins on Long-Term Chart (OPT-01)
    if (newsEvents && newsEvents.length > 0 && mode === "longterm") {
      // TradingView requirement: Markers MUST have unique times and be sorted in strictly ascending order
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
            // Elevate sentiment if bullish/bearish
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

      // Convert map to sorted markers
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

      if (markers.length > 0) {
        try {
          candleSeries.setMarkers(markers);
        } catch (err) {
          console.warn("Failed to set chart markers:", err);
        }
      }
    }

    // Crosshair move listener for legend
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.get(candleSeries)) {
        if (candles.length > 0) {
          const last = candles[candles.length - 1];
          setLegend({
            time: last.time_iso,
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
            volume: last.volume,
          });
        }
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

    chart.timeScale().fitContent();

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
    };
  }, [candles, mode, showVwap, showEma, showDma, showVolume, aiPredictionData, newsEvents]);

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
