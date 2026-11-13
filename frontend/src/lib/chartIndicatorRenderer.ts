import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";
import type { CandleItem } from "@/lib/types";
import {
  INDICATOR_REGISTRY,
  calculateVWAP,
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateSupertrend,
  calculateParabolicSAR,
  calculateKeltnerChannels,
  calculateDonchianChannels,
  calculatePivotPoints,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateWilliamsR,
  calculateCCI,
  calculateATR,
  calculateADX,
  calculateROC,
  calculateOBV,
  calculateMFI,
  calculateCMF,
} from "./technicalIndicators";

export function syncChartIndicators(
  chart: IChartApi,
  candles: CandleItem[],
  activeIndicatorIds: string[],
  seriesMap: Map<string, ISeriesApi<any>[]>
): void {
  if (!chart) return;

  const sanitized = candles.filter(
    (c) =>
      typeof c.time === "number" &&
      isFinite(c.time) &&
      typeof c.close === "number" &&
      isFinite(c.close)
  );

  // 1. Remove series for indicators no longer active
  for (const [id, seriesList] of Array.from(seriesMap.entries())) {
    if (!activeIndicatorIds.includes(id)) {
      for (const s of seriesList) {
        try {
          chart.removeSeries(s);
        } catch {
          // ignore already removed
        }
      }
      seriesMap.delete(id);
    }
  }

  // 2. Adjust main price scale margin based on active oscillators
  const hasOscillator = activeIndicatorIds.some((id) => {
    const def = INDICATOR_REGISTRY.find((i) => i.id === id);
    return def && !def.isOverlay && id !== "volume";
  });

  try {
    chart.priceScale("right").applyOptions({
      scaleMargins: {
        top: 0.05,
        bottom: hasOscillator ? 0.30 : 0.08,
      },
    });
  } catch {
    // ignore
  }

  // 3. Create or update series for each active indicator
  for (const id of activeIndicatorIds) {
    try {
      updateSingleIndicator(chart, sanitized, id, seriesMap);
    } catch (err) {
      console.warn(`Error syncing indicator ${id}:`, err);
    }
  }
}

function updateSingleIndicator(
  chart: IChartApi,
  sanitized: CandleItem[],
  id: string,
  seriesMap: Map<string, ISeriesApi<any>[]>
): void {
  const existing = seriesMap.get(id);

  switch (id) {
    case "vwap": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          color: "#f59e0b",
          lineWidth: 1,
          title: "VWAP",
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateVWAP(sanitized));
      break;
    }

    case "ema9": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          color: "#38bdf8",
          lineWidth: 1,
          title: "EMA 9",
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateEMA(sanitized, 9));
      break;
    }

    case "ema21": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          color: "#ec4899",
          lineWidth: 1,
          title: "EMA 21",
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateEMA(sanitized, 21));
      break;
    }

    case "ema50": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          color: "#a855f7",
          lineWidth: 1,
          title: "EMA 50",
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateEMA(sanitized, 50));
      break;
    }

    case "ema200": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          color: "#f97316",
          lineWidth: 2,
          title: "EMA 200",
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateEMA(sanitized, 200));
      break;
    }

    case "sma20": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          color: "#14b8a6",
          lineWidth: 1,
          title: "SMA 20",
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateSMA(sanitized, 20));
      break;
    }

    case "sma50": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          color: "#8b5cf6",
          lineWidth: 1,
          title: "50 DMA",
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateSMA(sanitized, 50));
      break;
    }

    case "sma200": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          color: "#e11d48",
          lineWidth: 2,
          title: "200 DMA",
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateSMA(sanitized, 200));
      break;
    }

    case "bollinger": {
      let upper = existing?.[0] as ISeriesApi<"Line"> | undefined;
      let mid = existing?.[1] as ISeriesApi<"Line"> | undefined;
      let lower = existing?.[2] as ISeriesApi<"Line"> | undefined;
      if (!upper || !mid || !lower) {
        upper = chart.addLineSeries({
          color: "#60a5fa",
          lineWidth: 1,
          lineStyle: 2,
          title: "BB Upper",
        });
        mid = chart.addLineSeries({
          color: "#3b82f6",
          lineWidth: 1,
          title: "BB Mid",
        });
        lower = chart.addLineSeries({
          color: "#60a5fa",
          lineWidth: 1,
          lineStyle: 2,
          title: "BB Lower",
        });
        seriesMap.set(id, [upper, mid, lower]);
      }
      const bb = calculateBollingerBands(sanitized, 20, 2);
      upper.setData(bb.upper);
      mid.setData(bb.middle);
      lower.setData(bb.lower);
      break;
    }

    case "supertrend": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          color: "#10b981",
          lineWidth: 2,
          title: "Supertrend",
        });
        seriesMap.set(id, [series]);
      }
      const st = calculateSupertrend(sanitized, 10, 3);
      series.setData(st.supertrend);
      break;
    }

    case "parabolic_sar": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          color: "#fbbf24",
          lineWidth: 1,
          lineStyle: 3,
          title: "SAR",
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateParabolicSAR(sanitized, 0.02, 0.2));
      break;
    }

    case "keltner": {
      let upper = existing?.[0] as ISeriesApi<"Line"> | undefined;
      let mid = existing?.[1] as ISeriesApi<"Line"> | undefined;
      let lower = existing?.[2] as ISeriesApi<"Line"> | undefined;
      if (!upper || !mid || !lower) {
        upper = chart.addLineSeries({
          color: "#34d399",
          lineWidth: 1,
          lineStyle: 2,
          title: "KC Upper",
        });
        mid = chart.addLineSeries({
          color: "#10b981",
          lineWidth: 1,
          title: "KC Mid",
        });
        lower = chart.addLineSeries({
          color: "#34d399",
          lineWidth: 1,
          lineStyle: 2,
          title: "KC Lower",
        });
        seriesMap.set(id, [upper, mid, lower]);
      }
      const kc = calculateKeltnerChannels(sanitized, 20, 1.5, 10);
      upper.setData(kc.upper);
      mid.setData(kc.middle);
      lower.setData(kc.lower);
      break;
    }

    case "donchian": {
      let upper = existing?.[0] as ISeriesApi<"Line"> | undefined;
      let mid = existing?.[1] as ISeriesApi<"Line"> | undefined;
      let lower = existing?.[2] as ISeriesApi<"Line"> | undefined;
      if (!upper || !mid || !lower) {
        upper = chart.addLineSeries({
          color: "#c084fc",
          lineWidth: 1,
          lineStyle: 2,
          title: "DC Upper",
        });
        mid = chart.addLineSeries({
          color: "#a855f7",
          lineWidth: 1,
          lineStyle: 1,
          title: "DC Mid",
        });
        lower = chart.addLineSeries({
          color: "#c084fc",
          lineWidth: 1,
          lineStyle: 2,
          title: "DC Lower",
        });
        seriesMap.set(id, [upper, mid, lower]);
      }
      const dc = calculateDonchianChannels(sanitized, 20);
      upper.setData(dc.upper);
      mid.setData(dc.middle);
      lower.setData(dc.lower);
      break;
    }

    case "pivot_points": {
      let p = existing?.[0] as ISeriesApi<"Line"> | undefined;
      let r1 = existing?.[1] as ISeriesApi<"Line"> | undefined;
      let s1 = existing?.[2] as ISeriesApi<"Line"> | undefined;
      let r2 = existing?.[3] as ISeriesApi<"Line"> | undefined;
      let s2 = existing?.[4] as ISeriesApi<"Line"> | undefined;
      if (!p || !r1 || !s1 || !r2 || !s2) {
        p = chart.addLineSeries({ color: "#f59e0b", lineWidth: 1, lineStyle: 1, title: "Pivot" });
        r1 = chart.addLineSeries({ color: "#f43f5e", lineWidth: 1, lineStyle: 2, title: "R1" });
        s1 = chart.addLineSeries({ color: "#10b981", lineWidth: 1, lineStyle: 2, title: "S1" });
        r2 = chart.addLineSeries({ color: "#e11d48", lineWidth: 1, lineStyle: 2, title: "R2" });
        s2 = chart.addLineSeries({ color: "#059669", lineWidth: 1, lineStyle: 2, title: "S2" });
        seriesMap.set(id, [p, r1, s1, r2, s2]);
      }
      const pivots = calculatePivotPoints(sanitized);
      p.setData(pivots.p);
      r1.setData(pivots.r1);
      s1.setData(pivots.s1);
      r2.setData(pivots.r2);
      s2.setData(pivots.s2);
      break;
    }

    case "volume": {
      let hist = existing?.[0] as ISeriesApi<"Histogram"> | undefined;
      let ma = existing?.[1] as ISeriesApi<"Line"> | undefined;
      if (!hist || !ma) {
        hist = chart.addHistogramSeries({
          priceScaleId: "volume_scale",
          priceFormat: { type: "volume" },
          title: "Vol",
        });
        chart.priceScale("volume_scale").applyOptions({
          scaleMargins: { top: 0.82, bottom: 0 },
        });
        ma = chart.addLineSeries({
          priceScaleId: "volume_scale",
          color: "#38bdf888",
          lineWidth: 1,
          title: "Vol MA",
        });
        seriesMap.set(id, [hist, ma]);
      }
      hist.setData(
        sanitized.map((c) => ({
          time: c.time as Time,
          value: c.volume || 0,
          color: c.close >= c.open ? "#10b98144" : "#f43f5e44",
        }))
      );
      const volCandles = sanitized.map((c) => ({ ...c, close: c.volume }));
      ma.setData(calculateSMA(volCandles, 20));
      break;
    }

    case "rsi": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          priceScaleId: "rsi_scale",
          color: "#a855f7",
          lineWidth: 2,
          title: "RSI(14)",
        });
        chart.priceScale("rsi_scale").applyOptions({
          scaleMargins: { top: 0.72, bottom: 0.02 },
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateRSI(sanitized, 14));
      break;
    }

    case "macd": {
      let hist = existing?.[0] as ISeriesApi<"Histogram"> | undefined;
      let line = existing?.[1] as ISeriesApi<"Line"> | undefined;
      let sig = existing?.[2] as ISeriesApi<"Line"> | undefined;
      if (!hist || !line || !sig) {
        hist = chart.addHistogramSeries({
          priceScaleId: "macd_scale",
          title: "MACD Hist",
        });
        line = chart.addLineSeries({
          priceScaleId: "macd_scale",
          color: "#38bdf8",
          lineWidth: 1,
          title: "MACD",
        });
        sig = chart.addLineSeries({
          priceScaleId: "macd_scale",
          color: "#f43f5e",
          lineWidth: 1,
          title: "Signal",
        });
        chart.priceScale("macd_scale").applyOptions({
          scaleMargins: { top: 0.74, bottom: 0.02 },
        });
        seriesMap.set(id, [hist, line, sig]);
      }
      const macdData = calculateMACD(sanitized, 12, 26, 9);
      hist.setData(macdData.histogram);
      line.setData(macdData.macd);
      sig.setData(macdData.signal);
      break;
    }

    case "stochastic": {
      let k = existing?.[0] as ISeriesApi<"Line"> | undefined;
      let d = existing?.[1] as ISeriesApi<"Line"> | undefined;
      if (!k || !d) {
        k = chart.addLineSeries({
          priceScaleId: "stoch_scale",
          color: "#06b6d4",
          lineWidth: 1,
          title: "%K",
        });
        d = chart.addLineSeries({
          priceScaleId: "stoch_scale",
          color: "#f59e0b",
          lineWidth: 1,
          title: "%D",
        });
        chart.priceScale("stoch_scale").applyOptions({
          scaleMargins: { top: 0.74, bottom: 0.02 },
        });
        seriesMap.set(id, [k, d]);
      }
      const stoch = calculateStochastic(sanitized, 14, 3, 3);
      k.setData(stoch.k);
      d.setData(stoch.d);
      break;
    }

    case "williams_r": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          priceScaleId: "wr_scale",
          color: "#e879f9",
          lineWidth: 1,
          title: "%R(14)",
        });
        chart.priceScale("wr_scale").applyOptions({
          scaleMargins: { top: 0.75, bottom: 0.02 },
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateWilliamsR(sanitized, 14));
      break;
    }

    case "cci": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          priceScaleId: "cci_scale",
          color: "#fb923c",
          lineWidth: 1,
          title: "CCI(20)",
        });
        chart.priceScale("cci_scale").applyOptions({
          scaleMargins: { top: 0.75, bottom: 0.02 },
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateCCI(sanitized, 20));
      break;
    }

    case "adx": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          priceScaleId: "adx_scale",
          color: "#eab308",
          lineWidth: 1,
          title: "ADX(14)",
        });
        chart.priceScale("adx_scale").applyOptions({
          scaleMargins: { top: 0.75, bottom: 0.02 },
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateADX(sanitized, 14));
      break;
    }

    case "atr": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          priceScaleId: "atr_scale",
          color: "#3b82f6",
          lineWidth: 1,
          title: "ATR(14)",
        });
        chart.priceScale("atr_scale").applyOptions({
          scaleMargins: { top: 0.75, bottom: 0.02 },
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateATR(sanitized, 14));
      break;
    }

    case "roc": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          priceScaleId: "roc_scale",
          color: "#2dd4bf",
          lineWidth: 1,
          title: "ROC(12)",
        });
        chart.priceScale("roc_scale").applyOptions({
          scaleMargins: { top: 0.75, bottom: 0.02 },
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateROC(sanitized, 12));
      break;
    }

    case "obv": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          priceScaleId: "obv_scale",
          color: "#0284c7",
          lineWidth: 1,
          title: "OBV",
        });
        chart.priceScale("obv_scale").applyOptions({
          scaleMargins: { top: 0.75, bottom: 0.02 },
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateOBV(sanitized));
      break;
    }

    case "mfi": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          priceScaleId: "mfi_scale",
          color: "#10b981",
          lineWidth: 1,
          title: "MFI(14)",
        });
        chart.priceScale("mfi_scale").applyOptions({
          scaleMargins: { top: 0.75, bottom: 0.02 },
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateMFI(sanitized, 14));
      break;
    }

    case "cmf": {
      let series = existing?.[0] as ISeriesApi<"Line"> | undefined;
      if (!series) {
        series = chart.addLineSeries({
          priceScaleId: "cmf_scale",
          color: "#14b8a6",
          lineWidth: 1,
          title: "CMF(20)",
        });
        chart.priceScale("cmf_scale").applyOptions({
          scaleMargins: { top: 0.75, bottom: 0.02 },
        });
        seriesMap.set(id, [series]);
      }
      series.setData(calculateCMF(sanitized, 20));
      break;
    }

    default:
      break;
  }
}

export function cleanupAllIndicatorSeries(
  chart: IChartApi,
  seriesMap: Map<string, ISeriesApi<any>[]>
): void {
  if (!chart) return;
  for (const seriesList of Array.from(seriesMap.values())) {
    for (const s of seriesList) {
      try {
        chart.removeSeries(s);
      } catch {
        // ignore
      }
    }
  }
  seriesMap.clear();
}
