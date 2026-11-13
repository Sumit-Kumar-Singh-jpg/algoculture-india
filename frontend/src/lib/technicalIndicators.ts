import type { CandleItem } from "@/lib/types";
import type { LineData, HistogramData, Time } from "lightweight-charts";

export type IndicatorCategory = "trend" | "momentum" | "volatility" | "volume" | "levels";

export interface IndicatorDefinition {
  id: string;
  name: string;
  shortName: string;
  category: IndicatorCategory;
  isOverlay: boolean; // true if plotted directly on price candles, false if plotted in sub-scale pane
  color: string;
  secondaryColor?: string;
  description: string;
}

export const INDICATOR_REGISTRY: IndicatorDefinition[] = [
  // --- Trend & Overlays ---
  {
    id: "vwap",
    name: "VWAP (Volume Weighted Average Price)",
    shortName: "VWAP",
    category: "trend",
    isOverlay: true,
    color: "#f59e0b",
    description: "Benchmark showing average price weighted by volume for intraday momentum.",
  },
  {
    id: "ema9",
    name: "EMA 9 (Fast Exponential Moving Average)",
    shortName: "EMA 9",
    category: "trend",
    isOverlay: true,
    color: "#38bdf8",
    description: "Fast 9-period exponential moving average for short-term swing signals.",
  },
  {
    id: "ema21",
    name: "EMA 21 (Pullback Trend Line)",
    shortName: "EMA 21",
    category: "trend",
    isOverlay: true,
    color: "#ec4899",
    description: "21-period EMA representing dynamic trend support in trending markets.",
  },
  {
    id: "ema50",
    name: "EMA 50 (Intermediate Trend)",
    shortName: "EMA 50",
    category: "trend",
    isOverlay: true,
    color: "#a855f7",
    description: "50-period EMA for intermediate directional bias.",
  },
  {
    id: "ema200",
    name: "EMA 200 (Institutional Trend)",
    shortName: "EMA 200",
    category: "trend",
    isOverlay: true,
    color: "#f97316",
    description: "200-period baseline tracked by institutional investors for macro trend.",
  },
  {
    id: "sma20",
    name: "SMA 20 (Simple Moving Average)",
    shortName: "SMA 20",
    category: "trend",
    isOverlay: true,
    color: "#14b8a6",
    description: "20-period simple moving average for baseline price equilibrium.",
  },
  {
    id: "sma50",
    name: "SMA 50 (50 DMA)",
    shortName: "50 DMA",
    category: "trend",
    isOverlay: true,
    color: "#8b5cf6",
    description: "50-day moving average benchmark for swing position health.",
  },
  {
    id: "sma200",
    name: "SMA 200 (200 DMA)",
    shortName: "200 DMA",
    category: "trend",
    isOverlay: true,
    color: "#e11d48",
    description: "200-day moving average defining bull and bear market boundaries.",
  },
  {
    id: "bollinger",
    name: "Bollinger Bands (20, 2)",
    shortName: "BB(20,2)",
    category: "trend",
    isOverlay: true,
    color: "#60a5fa",
    secondaryColor: "#3b82f6",
    description: "Volatility envelope with upper/lower 2-standard-deviation bands around 20 SMA.",
  },
  {
    id: "supertrend",
    name: "Supertrend (10, 3)",
    shortName: "Supertrend",
    category: "trend",
    isOverlay: true,
    color: "#10b981",
    secondaryColor: "#f43f5e",
    description: "ATR-based trend filter widely traded in Indian equity & F&O segments.",
  },
  {
    id: "parabolic_sar",
    name: "Parabolic SAR (0.02, 0.2)",
    shortName: "SAR",
    category: "trend",
    isOverlay: true,
    color: "#fbbf24",
    description: "Trailing stop and reversal dots following price acceleration.",
  },
  {
    id: "keltner",
    name: "Keltner Channels (20, 1.5)",
    shortName: "KC(20,1.5)",
    category: "trend",
    isOverlay: true,
    color: "#34d399",
    description: "Volatility-based envelope using ATR around 20-period EMA.",
  },
  {
    id: "donchian",
    name: "Donchian Channels (20)",
    shortName: "DC(20)",
    category: "trend",
    isOverlay: true,
    color: "#c084fc",
    description: "20-period highest high and lowest low bands for breakout detection.",
  },
  {
    id: "pivot_points",
    name: "Standard Pivot Points (Floor Pivots)",
    shortName: "Pivots",
    category: "levels",
    isOverlay: true,
    color: "#f59e0b",
    description: "Calculates intraday Pivot, Support (S1, S2, S3), and Resistance (R1, R2, R3).",
  },

  // --- Momentum & Oscillators ---
  {
    id: "rsi",
    name: "RSI 14 (Relative Strength Index)",
    shortName: "RSI(14)",
    category: "momentum",
    isOverlay: false,
    color: "#a855f7",
    description: "Measures velocity and magnitude of price moves with 70/30 thresholds.",
  },
  {
    id: "macd",
    name: "MACD (12, 26, 9)",
    shortName: "MACD",
    category: "momentum",
    isOverlay: false,
    color: "#38bdf8",
    secondaryColor: "#f43f5e",
    description: "Moving Average Convergence Divergence line, signal line, and colored histogram.",
  },
  {
    id: "stochastic",
    name: "Stochastic Oscillator (14, 3, 3)",
    shortName: "Stoch(14,3)",
    category: "momentum",
    isOverlay: false,
    color: "#06b6d4",
    secondaryColor: "#f59e0b",
    description: "Compares closing price to price range over 14 periods with %K and %D lines.",
  },
  {
    id: "williams_r",
    name: "Williams %R (14)",
    shortName: "%R(14)",
    category: "momentum",
    isOverlay: false,
    color: "#e879f9",
    description: "Momentum indicator measuring overbought (-20) and oversold (-80) levels.",
  },
  {
    id: "cci",
    name: "Commodity Channel Index (20)",
    shortName: "CCI(20)",
    category: "momentum",
    isOverlay: false,
    color: "#fb923c",
    description: "Identifies cyclical extremes above +100 and below -100.",
  },
  {
    id: "adx",
    name: "Average Directional Index (ADX 14)",
    shortName: "ADX(14)",
    category: "momentum",
    isOverlay: false,
    color: "#eab308",
    description: "Quantifies trend strength (>25 strong) alongside directional movement.",
  },
  {
    id: "roc",
    name: "Rate of Change (ROC 12)",
    shortName: "ROC(12)",
    category: "momentum",
    isOverlay: false,
    color: "#2dd4bf",
    description: "Percentage price change comparing current close to 12 bars ago.",
  },

  // --- Volatility ---
  {
    id: "atr",
    name: "Average True Range (ATR 14)",
    shortName: "ATR(14)",
    category: "volatility",
    isOverlay: false,
    color: "#3b82f6",
    description: "Measures market volatility for risk management and stop-loss sizing.",
  },
  {
    id: "historical_volatility",
    name: "Historical Volatility (HV 20)",
    shortName: "HV(20)",
    category: "volatility",
    isOverlay: false,
    color: "#6366f1",
    description: "Annualized standard deviation of percentage price changes.",
  },

  // --- Volume ---
  {
    id: "volume",
    name: "Volume Histogram & 20 MA",
    shortName: "Vol MA",
    category: "volume",
    isOverlay: false,
    color: "#10b981",
    secondaryColor: "#f43f5e",
    description: "Traded share volume with bullish/bearish color coding and 20-period moving average.",
  },
  {
    id: "obv",
    name: "On-Balance Volume (OBV)",
    shortName: "OBV",
    category: "volume",
    isOverlay: false,
    color: "#0284c7",
    description: "Cumulative volume momentum correlating volume flow with price trends.",
  },
  {
    id: "mfi",
    name: "Money Flow Index (MFI 14)",
    shortName: "MFI(14)",
    category: "volume",
    isOverlay: false,
    color: "#10b981",
    description: "Volume-weighted Relative Strength Index oscillating between 0 and 100.",
  },
  {
    id: "cmf",
    name: "Chaikin Money Flow (CMF 20)",
    shortName: "CMF(20)",
    category: "volume",
    isOverlay: false,
    color: "#14b8a6",
    description: "Measures institutional accumulation vs distribution volume pressure.",
  },
];

// ==========================================
// MATHEMATICAL CALCULATION FUNCTIONS
// ==========================================

export function calculateSMA(candles: CandleItem[], period: number): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length < period) return result;

  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) {
      sum -= candles[i - period].close;
    }
    if (i >= period - 1) {
      result.push({
        time: candles[i].time as Time,
        value: round2(sum / period),
      });
    }
  }
  return result;
}

export function calculateEMA(candles: CandleItem[], period: number): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length === 0) return result;

  const k = 2 / (period + 1);
  let ema: number | null = null;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i].close;
    if (ema === null) {
      ema = c;
    } else {
      ema = c * k + ema * (1 - k);
    }
    if (i >= Math.min(period - 1, 5)) {
      result.push({
        time: candles[i].time as Time,
        value: round2(ema),
      });
    }
  }
  return result;
}

export function calculateWMA(candles: CandleItem[], period: number): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length < period) return result;

  const denominator = (period * (period + 1)) / 2;
  for (let i = period - 1; i < candles.length; i++) {
    let weightedSum = 0;
    for (let j = 0; j < period; j++) {
      weightedSum += candles[i - period + 1 + j].close * (j + 1);
    }
    result.push({
      time: candles[i].time as Time,
      value: round2(weightedSum / denominator),
    });
  }
  return result;
}

export function calculateVWAP(candles: CandleItem[]): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length === 0) return result;

  let cumTypicalVol = 0;
  let cumVol = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typical = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 1;
    cumTypicalVol += typical * vol;
    cumVol += vol;

    result.push({
      time: c.time as Time,
      value: round2(cumTypicalVol / cumVol),
    });
  }
  return result;
}

export interface BollingerBandsResult {
  upper: LineData<Time>[];
  middle: LineData<Time>[];
  lower: LineData<Time>[];
}

export function calculateBollingerBands(
  candles: CandleItem[],
  period: number = 20,
  multiplier: number = 2
): BollingerBandsResult {
  const upper: LineData<Time>[] = [];
  const middle: LineData<Time>[] = [];
  const lower: LineData<Time>[] = [];

  if (!candles || candles.length < period) {
    return { upper, middle, lower };
  }

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    const mean = sum / period;

    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      const diff = candles[i - j].close - mean;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / period);
    const t = candles[i].time as Time;

    middle.push({ time: t, value: round2(mean) });
    upper.push({ time: t, value: round2(mean + multiplier * stdDev) });
    lower.push({ time: t, value: round2(mean - multiplier * stdDev) });
  }

  return { upper, middle, lower };
}

export interface SupertrendResult {
  supertrend: LineData<Time>[];
  direction: ("bullish" | "bearish")[];
}

export function calculateSupertrend(
  candles: CandleItem[],
  period: number = 10,
  multiplier: number = 3
): SupertrendResult {
  const supertrend: LineData<Time>[] = [];
  const direction: ("bullish" | "bearish")[] = [];

  if (!candles || candles.length < period) {
    return { supertrend, direction };
  }

  // Calculate True Range
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
    } else {
      const hl = candles[i].high - candles[i].low;
      const hc = Math.abs(candles[i].high - candles[i - 1].close);
      const lc = Math.abs(candles[i].low - candles[i - 1].close);
      tr.push(Math.max(hl, hc, lc));
    }
  }

  // Wilder's ATR
  const atr: number[] = [];
  let atrSum = 0;
  for (let i = 0; i < period; i++) {
    atrSum += tr[i];
  }
  let currAtr = atrSum / period;
  for (let i = 0; i < period; i++) {
    atr.push(currAtr);
  }
  for (let i = period; i < candles.length; i++) {
    currAtr = (currAtr * (period - 1) + tr[i]) / period;
    atr.push(currAtr);
  }

  let prevUpper = 0;
  let prevLower = 0;
  let isBullish = true;

  for (let i = period - 1; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];
    const hl2 = (c.high + c.low) / 2;
    const bandOffset = multiplier * atr[i];

    let basicUpper = hl2 + bandOffset;
    let basicLower = hl2 - bandOffset;

    let finalUpper =
      i === period - 1 || basicUpper < prevUpper || prevC.close > prevUpper
        ? basicUpper
        : prevUpper;
    let finalLower =
      i === period - 1 || basicLower > prevLower || prevC.close < prevLower
        ? basicLower
        : prevLower;

    if (isBullish) {
      if (c.close < finalLower) {
        isBullish = false;
      }
    } else {
      if (c.close > finalUpper) {
        isBullish = true;
      }
    }

    prevUpper = finalUpper;
    prevLower = finalLower;

    const stVal = isBullish ? finalLower : finalUpper;
    supertrend.push({ time: c.time as Time, value: round2(stVal) });
    direction.push(isBullish ? "bullish" : "bearish");
  }

  return { supertrend, direction };
}

export function calculateParabolicSAR(
  candles: CandleItem[],
  step: number = 0.02,
  maxStep: number = 0.2
): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length < 5) return result;

  let isLong = candles[1].close > candles[0].close;
  let sar = isLong ? candles[0].low : candles[0].high;
  let ep = isLong ? candles[1].high : candles[1].low;
  let af = step;

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];

    sar = sar + af * (ep - sar);

    if (isLong) {
      if (i >= 2) sar = Math.min(sar, prevC.low, candles[i - 2].low);
      else sar = Math.min(sar, prevC.low);

      if (c.low < sar) {
        isLong = false;
        sar = ep;
        ep = c.low;
        af = step;
      } else {
        if (c.high > ep) {
          ep = c.high;
          af = Math.min(af + step, maxStep);
        }
      }
    } else {
      if (i >= 2) sar = Math.max(sar, prevC.high, candles[i - 2].high);
      else sar = Math.max(sar, prevC.high);

      if (c.high > sar) {
        isLong = true;
        sar = ep;
        ep = c.high;
        af = step;
      } else {
        if (c.low < ep) {
          ep = c.low;
          af = Math.min(af + step, maxStep);
        }
      }
    }

    result.push({ time: c.time as Time, value: round2(sar) });
  }

  return result;
}

export interface KeltnerChannelsResult {
  upper: LineData<Time>[];
  middle: LineData<Time>[];
  lower: LineData<Time>[];
}

export function calculateKeltnerChannels(
  candles: CandleItem[],
  period: number = 20,
  multiplier: number = 1.5,
  atrPeriod: number = 10
): KeltnerChannelsResult {
  const upper: LineData<Time>[] = [];
  const middle: LineData<Time>[] = [];
  const lower: LineData<Time>[] = [];

  if (!candles || candles.length < period) {
    return { upper, middle, lower };
  }

  const ema = calculateEMA(candles, period);
  const emaMap = new Map<number, number>();
  ema.forEach((item) => emaMap.set(Number(item.time), item.value));

  // Compute ATR
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
    } else {
      const hl = candles[i].high - candles[i].low;
      const hc = Math.abs(candles[i].high - candles[i - 1].close);
      const lc = Math.abs(candles[i].low - candles[i - 1].close);
      tr.push(Math.max(hl, hc, lc));
    }
  }

  let atrSum = 0;
  for (let i = 0; i < atrPeriod; i++) atrSum += tr[i];
  let currAtr = atrSum / atrPeriod;

  for (let i = Math.max(period, atrPeriod); i < candles.length; i++) {
    currAtr = (currAtr * (atrPeriod - 1) + tr[i]) / atrPeriod;
    const t = candles[i].time as Time;
    const midVal = emaMap.get(Number(t));
    if (midVal !== undefined) {
      middle.push({ time: t, value: midVal });
      upper.push({ time: t, value: round2(midVal + multiplier * currAtr) });
      lower.push({ time: t, value: round2(midVal - multiplier * currAtr) });
    }
  }

  return { upper, middle, lower };
}

export interface DonchianChannelsResult {
  upper: LineData<Time>[];
  middle: LineData<Time>[];
  lower: LineData<Time>[];
}

export function calculateDonchianChannels(
  candles: CandleItem[],
  period: number = 20
): DonchianChannelsResult {
  const upper: LineData<Time>[] = [];
  const middle: LineData<Time>[] = [];
  const lower: LineData<Time>[] = [];

  if (!candles || candles.length < period) {
    return { upper, middle, lower };
  }

  for (let i = period - 1; i < candles.length; i++) {
    let maxHigh = -Infinity;
    let minLow = Infinity;
    for (let j = 0; j < period; j++) {
      maxHigh = Math.max(maxHigh, candles[i - j].high);
      minLow = Math.min(minLow, candles[i - j].low);
    }
    const t = candles[i].time as Time;
    const mid = (maxHigh + minLow) / 2;
    upper.push({ time: t, value: round2(maxHigh) });
    lower.push({ time: t, value: round2(minLow) });
    middle.push({ time: t, value: round2(mid) });
  }

  return { upper, middle, lower };
}

export interface PivotPointsResult {
  p: LineData<Time>[];
  r1: LineData<Time>[];
  r2: LineData<Time>[];
  s1: LineData<Time>[];
  s2: LineData<Time>[];
}

export function calculatePivotPoints(candles: CandleItem[]): PivotPointsResult {
  const p: LineData<Time>[] = [];
  const r1: LineData<Time>[] = [];
  const r2: LineData<Time>[] = [];
  const s1: LineData<Time>[] = [];
  const s2: LineData<Time>[] = [];

  if (!candles || candles.length < 5) {
    return { p, r1, r2, s1, s2 };
  }

  // Session-based pivot calculation (lookback window of 30 bars or whole sequence)
  const windowSize = Math.min(candles.length, 40);
  let high = -Infinity;
  let low = Infinity;
  let close = candles[candles.length - 1].close;

  for (let i = candles.length - windowSize; i < candles.length; i++) {
    high = Math.max(high, candles[i].high);
    low = Math.min(low, candles[i].low);
  }

  const pivot = (high + low + close) / 3;
  const res1 = 2 * pivot - low;
  const sup1 = 2 * pivot - high;
  const res2 = pivot + (high - low);
  const sup2 = pivot - (high - low);

  for (let i = Math.max(0, candles.length - windowSize); i < candles.length; i++) {
    const t = candles[i].time as Time;
    p.push({ time: t, value: round2(pivot) });
    r1.push({ time: t, value: round2(res1) });
    r2.push({ time: t, value: round2(res2) });
    s1.push({ time: t, value: round2(sup1) });
    s2.push({ time: t, value: round2(sup2) });
  }

  return { p, r1, r2, s1, s2 };
}

export function calculateRSI(candles: CandleItem[], period: number = 14): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  result.push({ time: candles[period].time as Time, value: round2(rsi) });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
    result.push({ time: candles[i].time as Time, value: round2(rsi) });
  }

  return result;
}

export interface MACDResult {
  macd: LineData<Time>[];
  signal: LineData<Time>[];
  histogram: HistogramData<Time>[];
}

export function calculateMACD(
  candles: CandleItem[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const macd: LineData<Time>[] = [];
  const signal: LineData<Time>[] = [];
  const histogram: HistogramData<Time>[] = [];

  if (!candles || candles.length < slowPeriod + signalPeriod) {
    return { macd, signal, histogram };
  }

  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  const slowMap = new Map<number, number>();
  slowEMA.forEach((d) => slowMap.set(Number(d.time), d.value));

  const macdLinePoints: { time: Time; value: number }[] = [];
  fastEMA.forEach((f) => {
    const slowVal = slowMap.get(Number(f.time));
    if (slowVal !== undefined) {
      macdLinePoints.push({
        time: f.time,
        value: round2(f.value - slowVal),
      });
    }
  });

  // Signal line = EMA of MACD Line
  const k = 2 / (signalPeriod + 1);
  let sigEma: number | null = null;

  for (let i = 0; i < macdLinePoints.length; i++) {
    const pt = macdLinePoints[i];
    if (sigEma === null) {
      sigEma = pt.value;
    } else {
      sigEma = pt.value * k + sigEma * (1 - k);
    }

    if (i >= signalPeriod - 1) {
      const histVal = round2(pt.value - sigEma);
      macd.push(pt);
      signal.push({ time: pt.time, value: round2(sigEma) });
      histogram.push({
        time: pt.time,
        value: histVal,
        color: histVal >= 0 ? "#10b981cc" : "#f43f5ecc",
      });
    }
  }

  return { macd, signal, histogram };
}

export interface StochasticResult {
  k: LineData<Time>[];
  d: LineData<Time>[];
}

export function calculateStochastic(
  candles: CandleItem[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  smooth: number = 3
): StochasticResult {
  const k: LineData<Time>[] = [];
  const d: LineData<Time>[] = [];

  if (!candles || candles.length < kPeriod + dPeriod + smooth) {
    return { k, d };
  }

  const rawK: { time: Time; value: number }[] = [];
  for (let i = kPeriod - 1; i < candles.length; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      highest = Math.max(highest, candles[i - j].high);
      lowest = Math.min(lowest, candles[i - j].low);
    }
    const range = highest - lowest;
    const kVal = range === 0 ? 50 : ((candles[i].close - lowest) / range) * 100;
    rawK.push({ time: candles[i].time as Time, value: kVal });
  }

  // Smooth %K
  const smoothedK: { time: Time; value: number }[] = [];
  for (let i = smooth - 1; i < rawK.length; i++) {
    let sum = 0;
    for (let j = 0; j < smooth; j++) {
      sum += rawK[i - j].value;
    }
    smoothedK.push({ time: rawK[i].time, value: round2(sum / smooth) });
  }

  // Calculate %D (SMA of smoothed %K)
  for (let i = dPeriod - 1; i < smoothedK.length; i++) {
    let sum = 0;
    for (let j = 0; j < dPeriod; j++) {
      sum += smoothedK[i - j].value;
    }
    k.push(smoothedK[i]);
    d.push({ time: smoothedK[i].time, value: round2(sum / dPeriod) });
  }

  return { k, d };
}

export function calculateWilliamsR(candles: CandleItem[], period: number = 14): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length < period) return result;

  for (let i = period - 1; i < candles.length; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = 0; j < period; j++) {
      highest = Math.max(highest, candles[i - j].high);
      lowest = Math.min(lowest, candles[i - j].low);
    }
    const range = highest - lowest;
    const wr = range === 0 ? -50 : ((highest - candles[i].close) / range) * -100;
    result.push({ time: candles[i].time as Time, value: round2(wr) });
  }
  return result;
}

export function calculateCCI(candles: CandleItem[], period: number = 20): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length < period) return result;

  const tp: number[] = candles.map((c) => (c.high + c.low + c.close) / 3);

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += tp[i - j];
    }
    const mean = sum / period;

    let devSum = 0;
    for (let j = 0; j < period; j++) {
      devSum += Math.abs(tp[i - j] - mean);
    }
    const meanDev = devSum / period;
    const cci = meanDev === 0 ? 0 : (tp[i] - mean) / (0.015 * meanDev);
    result.push({ time: candles[i].time as Time, value: round2(cci) });
  }
  return result;
}

export function calculateATR(candles: CandleItem[], period: number = 14): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length <= period) return result;

  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
    } else {
      const hl = candles[i].high - candles[i].low;
      const hc = Math.abs(candles[i].high - candles[i - 1].close);
      const lc = Math.abs(candles[i].low - candles[i - 1].close);
      tr.push(Math.max(hl, hc, lc));
    }
  }

  let atrSum = 0;
  for (let i = 0; i < period; i++) atrSum += tr[i];
  let currAtr = atrSum / period;
  result.push({ time: candles[period - 1].time as Time, value: round2(currAtr) });

  for (let i = period; i < candles.length; i++) {
    currAtr = (currAtr * (period - 1) + tr[i]) / period;
    result.push({ time: candles[i].time as Time, value: round2(currAtr) });
  }

  return result;
}

export function calculateADX(candles: CandleItem[], period: number = 14): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length < period * 2) return result;

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      plusDM.push(0);
      minusDM.push(0);
      tr.push(candles[0].high - candles[0].low);
      continue;
    }
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }

  // Smooth DM and TR
  let smoothTR = 0;
  let smoothPlus = 0;
  let smoothMinus = 0;

  for (let i = 0; i < period; i++) {
    smoothTR += tr[i];
    smoothPlus += plusDM[i];
    smoothMinus += minusDM[i];
  }

  const dxValues: { time: Time; value: number }[] = [];

  for (let i = period; i < candles.length; i++) {
    smoothTR = smoothTR - smoothTR / period + tr[i];
    smoothPlus = smoothPlus - smoothPlus / period + plusDM[i];
    smoothMinus = smoothMinus - smoothMinus / period + minusDM[i];

    const plusDI = smoothTR === 0 ? 0 : (smoothPlus / smoothTR) * 100;
    const minusDI = smoothTR === 0 ? 0 : (smoothMinus / smoothTR) * 100;
    const diDiff = Math.abs(plusDI - minusDI);
    const diSum = plusDI + minusDI;
    const dx = diSum === 0 ? 0 : (diDiff / diSum) * 100;
    dxValues.push({ time: candles[i].time as Time, value: dx });
  }

  // Calculate ADX as smoothed DX
  if (dxValues.length >= period) {
    let adxSum = 0;
    for (let i = 0; i < period; i++) adxSum += dxValues[i].value;
    let currADX = adxSum / period;
    result.push({ time: dxValues[period - 1].time, value: round2(currADX) });

    for (let i = period; i < dxValues.length; i++) {
      currADX = (currADX * (period - 1) + dxValues[i].value) / period;
      result.push({ time: dxValues[i].time, value: round2(currADX) });
    }
  }

  return result;
}

export function calculateROC(candles: CandleItem[], period: number = 12): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length <= period) return result;

  for (let i = period; i < candles.length; i++) {
    const prevClose = candles[i - period].close;
    if (prevClose !== 0) {
      const roc = ((candles[i].close - prevClose) / prevClose) * 100;
      result.push({ time: candles[i].time as Time, value: round2(roc) });
    }
  }
  return result;
}

export function calculateOBV(candles: CandleItem[]): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length === 0) return result;

  let obv = 0;
  result.push({ time: candles[0].time as Time, value: 0 });

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];
    const vol = c.volume > 0 ? c.volume : 0;

    if (c.close > prevC.close) {
      obv += vol;
    } else if (c.close < prevC.close) {
      obv -= vol;
    }
    result.push({ time: c.time as Time, value: obv });
  }
  return result;
}

export function calculateMFI(candles: CandleItem[], period: number = 14): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length <= period) return result;

  const typicalPrice = candles.map((c) => (c.high + c.low + c.close) / 3);
  const rawMoneyFlow = candles.map((c, i) => typicalPrice[i] * (c.volume > 0 ? c.volume : 1));

  for (let i = period; i < candles.length; i++) {
    let posFlow = 0;
    let negFlow = 0;

    for (let j = 0; j < period; j++) {
      const idx = i - j;
      if (typicalPrice[idx] > typicalPrice[idx - 1]) {
        posFlow += rawMoneyFlow[idx];
      } else if (typicalPrice[idx] < typicalPrice[idx - 1]) {
        negFlow += rawMoneyFlow[idx];
      }
    }

    const mr = negFlow === 0 ? 100 : posFlow / negFlow;
    const mfi = 100 - 100 / (1 + mr);
    result.push({ time: candles[i].time as Time, value: round2(mfi) });
  }
  return result;
}

export function calculateCMF(candles: CandleItem[], period: number = 20): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  if (!candles || candles.length < period) return result;

  for (let i = period - 1; i < candles.length; i++) {
    let mfVolSum = 0;
    let volSum = 0;

    for (let j = 0; j < period; j++) {
      const c = candles[i - j];
      const range = c.high - c.low;
      const clv = range === 0 ? 0 : (c.close - c.low - (c.high - c.close)) / range;
      const vol = c.volume > 0 ? c.volume : 1;
      mfVolSum += clv * vol;
      volSum += vol;
    }

    const cmf = volSum === 0 ? 0 : mfVolSum / volSum;
    result.push({ time: candles[i].time as Time, value: round2(cmf) });
  }
  return result;
}

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
