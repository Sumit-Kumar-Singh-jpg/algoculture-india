"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Crosshair,
  Pencil,
  Minus,
  TrendingUp,
  Square,
  Type,
  Ruler,
  Trash2,
  Undo2,
  Redo2,
  Camera,
  Maximize2,
  Minimize2,
  Sliders,
  Check,
  ChevronDown,
} from "lucide-react";
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
import { formatInr } from "@/lib/format";
import {
  DrawingCanvasOverlay,
  DrawingToolType,
  DrawingItem,
} from "./DrawingCanvasOverlay";

interface ChartStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  exchange?: string;
  name?: string;
  interval: string;
  onSelectInterval: (interval: string) => void;
  candles: CandleItem[];
  mode: TradingMode;
  livePrice?: number;
  prevClose?: number;
  showVwap: boolean;
  onToggleVwap: () => void;
  showEma: boolean;
  onToggleEma: () => void;
  showDma: boolean;
  onToggleDma: () => void;
  showVolume: boolean;
  onToggleVolume: () => void;
  aiPredictionData?: Array<{ time: number; price: number; lower1?: number; upper1?: number }> | null;
  stopLossPrice?: number;
}

const COLOR_PALETTE = [
  { name: "Cyan", value: "#38bdf8" },
  { name: "Emerald", value: "#10b981" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Purple", value: "#a855f7" },
  { name: "White", value: "#ffffff" },
];

export function ChartStudioModal({
  isOpen,
  onClose,
  symbol,
  exchange = "NSE",
  name,
  interval,
  onSelectInterval,
  candles,
  mode,
  livePrice,
  prevClose,
  showVwap,
  onToggleVwap,
  showEma,
  onToggleEma,
  showDma,
  onToggleDma,
  showVolume,
  onToggleVolume,
  aiPredictionData,
  stopLossPrice,
}: ChartStudioModalProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Series refs
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const dma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const dma200SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const forecastSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const stopLossSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawingToolType>("cursor");
  const [activeColor, setActiveColor] = useState<string>("#38bdf8");
  const [activeLineWidth, setActiveLineWidth] = useState<number>(2);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false);
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingItem[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingItem[][]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 700,
  });

  const [legend, setLegend] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }>({});

  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  // Sync canvas size on mount / resize
  const updateDimensions = useCallback(() => {
    if (chartContainerRef.current) {
      const w = chartContainerRef.current.clientWidth;
      const h = chartContainerRef.current.clientHeight;
      setCanvasDimensions({ width: w, height: h });
      if (chartRef.current) {
        chartRef.current.applyOptions({ width: w, height: h });
      }
    }
  }, []);

  // 1. Initialize Chart inside Modal
  useEffect(() => {
    if (!isOpen || !chartContainerRef.current) return;

    let chart: IChartApi | null = null;
    try {
      const w = chartContainerRef.current.clientWidth || 1000;
      const h = chartContainerRef.current.clientHeight || 650;
      setCanvasDimensions({ width: w, height: h });

      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#090d16" },
          textColor: "#94a3b8",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "#1e293b44" },
          horzLines: { color: "#1e293b44" },
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
        width: w,
        height: h,
      });

      chartRef.current = chart;

      chart.subscribeCrosshairMove((param) => {
        try {
          const candleSeries = candleSeriesRef.current;
          if (!param.time || !candleSeries || !param.seriesData) return;
          const raw = param.seriesData.get(candleSeries);
          if (!raw) return;
          const data = raw as CandlestickData<Time>;
          setLegend({
            time: String(param.time),
            open: typeof data.open === "number" ? data.open : undefined,
            high: typeof data.high === "number" ? data.high : undefined,
            low: typeof data.low === "number" ? data.low : undefined,
            close: typeof data.close === "number" ? data.close : undefined,
          });
        } catch {
          // ignore
        }
      });
    } catch (err) {
      console.error("Studio chart init error:", err);
      return;
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      try {
        if (chart) chart.remove();
      } catch {
        // ignore
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      vwapSeriesRef.current = null;
      ema9SeriesRef.current = null;
      ema21SeriesRef.current = null;
      dma50SeriesRef.current = null;
      dma200SeriesRef.current = null;
      forecastSeriesRef.current = null;
      stopLossSeriesRef.current = null;
    };
  }, [isOpen, mode, updateDimensions]);

  // 2. Populate Chart Data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !Array.isArray(candles) || candles.length === 0) return;

    const seenTimes = new Set<number>();
    const sanitized = candles
      .filter((c) => c && typeof c.time === "number" && isFinite(c.time))
      .sort((a, b) => a.time - b.time)
      .filter((c) => {
        if (seenTimes.has(c.time)) return false;
        seenTimes.add(c.time);
        return true;
      });

    if (sanitized.length === 0) return;

    try {
      if (!candleSeriesRef.current) {
        candleSeriesRef.current = chart.addCandlestickSeries({
          upColor: "#10b981",
          downColor: "#f43f5e",
          borderVisible: false,
          wickUpColor: "#10b981",
          wickDownColor: "#f43f5e",
        });
      }

      const candleData: CandlestickData<Time>[] = sanitized.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      if (livePrice && mode === "intraday" && candleData.length > 0) {
        const last = candleData[candleData.length - 1];
        last.close = livePrice;
        last.high = Math.max(last.high, livePrice);
        last.low = Math.min(last.low, livePrice);
      }

      candleSeriesRef.current.setData(candleData);

      // Volume
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
        volumeSeriesRef.current.setData(
          sanitized.map((c) => ({
            time: c.time as Time,
            value: c.volume || 0,
            color: c.close >= c.open ? "#10b98133" : "#f43f5e33",
          }))
        );
      } else if (volumeSeriesRef.current) {
        chart.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      }

      // VWAP
      if (showVwap && mode === "intraday") {
        if (!vwapSeriesRef.current) {
          vwapSeriesRef.current = chart.addLineSeries({
            color: "#f59e0b",
            lineWidth: 1,
            title: "VWAP",
          });
        }
        vwapSeriesRef.current.setData(
          sanitized
            .filter((c) => typeof c.vwap === "number")
            .map((c) => ({ time: c.time as Time, value: c.vwap! }))
        );
      } else if (vwapSeriesRef.current) {
        chart.removeSeries(vwapSeriesRef.current);
        vwapSeriesRef.current = null;
      }

      // EMA
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
          sanitized
            .filter((c) => typeof c.ema9 === "number")
            .map((c) => ({ time: c.time as Time, value: c.ema9! }))
        );
        ema21SeriesRef.current.setData(
          sanitized
            .filter((c) => typeof c.ema21 === "number")
            .map((c) => ({ time: c.time as Time, value: c.ema21! }))
        );
      }

      // DMA
      if (showDma && mode === "longterm") {
        if (!dma50SeriesRef.current) {
          dma50SeriesRef.current = chart.addLineSeries({
            color: "#a855f7",
            lineWidth: 1,
            title: "50 DMA",
          });
        }
        dma50SeriesRef.current.setData(
          sanitized
            .filter((c) => typeof c.sma50 === "number")
            .map((c) => ({ time: c.time as Time, value: c.sma50! }))
        );
      }

      // Initial legend
      const last = sanitized[sanitized.length - 1];
      if (last) {
        setLegend({
          time: last.time_iso,
          open: last.open,
          high: livePrice && mode === "intraday" ? Math.max(last.high, livePrice) : last.high,
          low: livePrice && mode === "intraday" ? Math.min(last.low, livePrice) : last.low,
          close: livePrice && mode === "intraday" ? livePrice : last.close,
          volume: last.volume,
        });
      }

      chart.timeScale().fitContent();
    } catch (err) {
      console.warn("Studio chart render notice:", err);
    }
  }, [candles, mode, livePrice, showVwap, showEma, showDma, showVolume, isOpen]);

  function handleUndo() {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, drawings]);
    setDrawings(previous);
    setUndoStack((prev) => prev.slice(0, -1));
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, drawings]);
    setDrawings(next);
    setRedoStack((prev) => prev.slice(0, -1));
  }

  function handleClearAll() {
    if (drawings.length === 0) return;
    setUndoStack((prev) => [...prev, drawings]);
    setRedoStack([]);
    setDrawings([]);
  }

  function handlePaperOrder(type: "BUY" | "SELL") {
    const currentP = legend.close || livePrice || 0;
    setOrderNotice(
      `Paper Trade Submitted: ${type} 100 shares of ${symbol} @ ₹${currentP.toFixed(2)}`
    );
    setTimeout(() => setOrderNotice(null), 3500);
  }

  if (!isOpen) return null;

  const currentClose = legend.close || livePrice || 0;
  const changeVal = prevClose ? currentClose - prevClose : 0;
  const changePct = prevClose ? (changeVal / prevClose) * 100 : 0;
  const isUp = changeVal >= 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#090d16] text-slate-100 select-none animate-in fade-in duration-150">
      {/* 1. TOP TOOLBAR (TradingView Header) */}
      <header className="flex h-12 items-center justify-between border-b border-slate-800 bg-[#0d1424] px-3 font-sans text-xs">
        {/* Left cluster: Symbol, Interval, Indicators */}
        <div className="flex items-center gap-2">
          {/* Symbol Tag */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 font-bold text-white shadow-sm">
            <span>{symbol}</span>
            <span className="text-[10px] font-mono text-sky-400">· {exchange}</span>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {/* Timeframe Selectors */}
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-900/80 p-0.5">
            {["1m", "5m", "15m", "1h", "1d"].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onSelectInterval(tf)}
                className={`rounded px-2 py-1 font-mono text-[11px] font-semibold transition ${
                  interval === tf
                    ? "bg-sky-500 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {/* Indicators Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIndicatorMenuOpen(!indicatorMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-slate-700 hover:text-white transition"
            >
              <span className="font-mono text-sky-400 font-bold">fx</span>
              <span>Indicators</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {indicatorMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-44 rounded-xl border border-slate-800 bg-[#0d1424] p-1.5 shadow-2xl z-40">
                <button
                  type="button"
                  onClick={onToggleVwap}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    showVwap ? "text-amber-400 font-semibold" : "text-slate-400"
                  }`}
                >
                  <span>VWAP</span>
                  {showVwap && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={onToggleEma}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    showEma ? "text-sky-400 font-semibold" : "text-slate-400"
                  }`}
                >
                  <span>EMA 9 / 21</span>
                  {showEma && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={onToggleDma}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    showDma ? "text-purple-400 font-semibold" : "text-slate-400"
                  }`}
                >
                  <span>50 / 200 DMA</span>
                  {showDma && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={onToggleVolume}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    showVolume ? "text-slate-200 font-semibold" : "text-slate-400"
                  }`}
                >
                  <span>Volume Bars</span>
                  {showVolume && <Check className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
              title="Undo Drawing (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
              title="Redo Drawing"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right cluster: Buy/Sell Quick Buttons & Window Close */}
        <div className="flex items-center gap-2">
          {/* Quick Buy & Sell Buttons */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
            <button
              type="button"
              onClick={() => handlePaperOrder("SELL")}
              className="rounded-md border border-rose-500/40 bg-rose-600/90 px-2.5 py-1 text-white shadow-sm hover:bg-rose-500 transition"
            >
              SELL {currentClose.toFixed(2)}
            </button>
            <button
              type="button"
              onClick={() => handlePaperOrder("BUY")}
              className="rounded-md border border-emerald-500/40 bg-emerald-600/90 px-2.5 py-1 text-white shadow-sm hover:bg-emerald-500 transition"
            >
              BUY {currentClose.toFixed(2)}
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {/* Reset / Fit Content */}
          <button
            type="button"
            onClick={() => chartRef.current?.timeScale().fitContent()}
            className="rounded border border-slate-800 bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800"
            title="Reset Chart Zoom"
          >
            Auto
          </button>

          {/* Close Studio Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-rose-500/20 hover:text-rose-400 transition"
          >
            <X className="h-3.5 w-3.5" />
            <span>Close Studio</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE (Left Drawing Tools + Chart Canvas Stage) */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* LEFT VERTICAL DRAWING TOOLBAR (TradingView Rail) */}
        <aside className="flex w-12 flex-col items-center gap-1.5 border-r border-slate-800 bg-[#0d1424] py-2 z-30">
          {/* 1. Cursor */}
          <button
            type="button"
            onClick={() => setActiveTool("cursor")}
            className={`rounded-lg p-2 transition ${
              activeTool === "cursor"
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title="Crosshair Cursor (Interact with chart)"
          >
            <Crosshair className="h-4 w-4" />
          </button>

          {/* 2. Freehand Pencil */}
          <button
            type="button"
            onClick={() => setActiveTool("pencil")}
            className={`rounded-lg p-2 transition ${
              activeTool === "pencil"
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title="Freehand Pencil / Brush"
          >
            <Pencil className="h-4 w-4" />
          </button>

          {/* 3. Trendline */}
          <button
            type="button"
            onClick={() => setActiveTool("trendline")}
            className={`rounded-lg p-2 transition ${
              activeTool === "trendline"
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title="Trendline (Click & drag straight line)"
          >
            <TrendingUp className="h-4 w-4" />
          </button>

          {/* 4. Horizontal Support/Resistance Level */}
          <button
            type="button"
            onClick={() => setActiveTool("horizontal")}
            className={`rounded-lg p-2 transition ${
              activeTool === "horizontal"
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title="Horizontal Price Line / S&R Level (Click anywhere)"
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* 5. Rectangle Zone */}
          <button
            type="button"
            onClick={() => setActiveTool("rectangle")}
            className={`rounded-lg p-2 transition ${
              activeTool === "rectangle"
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title="Rectangle Supply / Demand Box"
          >
            <Square className="h-4 w-4" />
          </button>

          {/* 6. Text Note */}
          <button
            type="button"
            onClick={() => setActiveTool("text")}
            className={`rounded-lg p-2 transition ${
              activeTool === "text"
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title="Text Note / Annotation"
          >
            <Type className="h-4 w-4" />
          </button>

          {/* 7. Ruler / Measure */}
          <button
            type="button"
            onClick={() => setActiveTool("ruler")}
            className={`rounded-lg p-2 transition ${
              activeTool === "ruler"
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title="Measure Price & Points Ruler"
          >
            <Ruler className="h-4 w-4" />
          </button>

          <div className="my-1.5 h-px w-6 bg-slate-800" />

          {/* Color Palette Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setColorMenuOpen(!colorMenuOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 shadow"
              style={{ backgroundColor: activeColor }}
              title="Change Drawing Color"
            />
            {colorMenuOpen && (
              <div className="absolute left-10 top-0 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-[#0d1424] p-2 shadow-2xl z-40">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setActiveColor(c.value);
                      setColorMenuOpen(false);
                    }}
                    className="h-6 w-6 rounded-md border border-slate-700"
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Line Width */}
          <button
            type="button"
            onClick={() => setActiveLineWidth((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1))}
            className="mt-1 flex h-6 w-6 items-center justify-center rounded font-mono text-[10px] font-bold text-slate-300 hover:bg-slate-800"
            title="Toggle Line Stroke Width (1px, 2px, 3px)"
          >
            {activeLineWidth}px
          </button>

          {/* Clear Drawings */}
          <button
            type="button"
            onClick={handleClearAll}
            className="mt-auto rounded-lg p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
            title="Clear All Canvas Drawings"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </aside>

        {/* CHART & DRAWING CANVAS STAGE */}
        <div className="relative flex-1 bg-[#090d16]">
          {/* Top-Left OHLC Overlay Indicator */}
          <div className="pointer-events-none absolute left-4 top-3 z-30 flex flex-col gap-1 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                {name || symbol} · {interval} · {exchange}
              </span>
              <span
                className={`font-semibold ${
                  isUp ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatInr(currentClose, false)} ({isUp ? "+" : ""}
                {changePct.toFixed(2)}%)
              </span>
            </div>

            {/* OHLC Bar Stats */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
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
                  Vol:{" "}
                  <strong className="text-sky-300">
                    {legend.volume.toLocaleString("en-IN")}
                  </strong>
                </span>
              )}
            </div>
          </div>

          {/* Order Notice Toast */}
          {orderNotice && (
            <div className="absolute top-4 right-4 z-40 rounded-lg border border-emerald-500/40 bg-emerald-950/80 px-3 py-2 text-xs font-semibold text-emerald-300 shadow-xl animate-in fade-in">
              {orderNotice}
            </div>
          )}

          {/* Lightweight Charts DOM Container */}
          <div ref={chartContainerRef} className="h-full w-full" />

          {/* HTML5 Interactive Drawing Layer Overlay */}
          <DrawingCanvasOverlay
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            currentPrice={currentClose}
            activeTool={activeTool}
            onChangeTool={setActiveTool}
            activeColor={activeColor}
            onChangeColor={setActiveColor}
            activeLineWidth={activeLineWidth}
            onChangeLineWidth={setActiveLineWidth}
            drawings={drawings}
            setDrawings={setDrawings}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
            redoStack={redoStack}
            setRedoStack={setRedoStack}
          />
        </div>
      </div>

      {/* 3. BOTTOM TIMEFRAME & TIMEZONE BAR */}
      <footer className="flex h-8 items-center justify-between border-t border-slate-800 bg-[#0d1424] px-4 font-mono text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {["1d", "5d", "1m", "3m", "6m", "1y", "5y"].map((r) => (
            <button
              key={r}
              type="button"
              className="rounded px-1.5 py-0.5 text-slate-400 hover:text-white"
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span>UTC+5:30 (IST)</span>
          <span className="text-emerald-400 font-semibold">AlgoCulture Studio</span>
        </div>
      </footer>
    </div>
  );
}
