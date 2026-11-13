export type TradingMode = "intraday" | "fno" | "longterm";

export type MarketStatus = "OPEN" | "PRE_OPEN" | "CLOSED";

export interface StockSearchItem {
  symbol: string;
  yahoo_symbol: string;
  name: string;
  exchange: string;
  sector: string;
  is_fno: boolean;
  is_index: boolean;
}

export interface StockSearchResponse {
  query: string;
  results: StockSearchItem[];
}

export interface StockQuote {
  symbol: string;
  yahoo_symbol: string;
  name: string;
  exchange: string;
  currency: string;
  ltp: number;
  change: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  prev_close: number;
  volume: number;
  week52_high: number | null;
  week52_low: number | null;
  market_status: MarketStatus | string;
  is_fno: boolean;
  is_index: boolean;
  as_of: string;
  stale: boolean;
}

export interface MarketPulseItem {
  symbol: string;
  label: string;
  ltp: number;
  change: number;
  change_pct: number;
  stale: boolean;
}

export interface MarketPulseResponse {
  market_status: MarketStatus | string;
  as_of: string;
  items: MarketPulseItem[];
}

export interface WatchlistEntry {
  symbol: string;
  name: string;
  exchange: string;
}

export interface CandleItem {
  time: number; // Unix timestamp in seconds
  time_iso: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number | null;
  ema9?: number | null;
  ema21?: number | null;
  sma50?: number | null;
  sma200?: number | null;
  rsi14?: number | null;
}

export interface TechnicalBias {
  bias: "BULLISH" | "BEARISH" | "NEUTRAL" | string;
  score: number;
  summary: string;
  rsi?: number | null;
  vwap_signal: string;
  ema_signal: string;
  dma_signal: string;
}

export interface StockHistoryResponse {
  symbol: string;
  yahoo_symbol: string;
  mode: string;
  interval: string;
  range: string;
  currency: string;
  session_date: string;
  candles: CandleItem[];
  bias: TechnicalBias;
  as_of: string;
  stale: boolean;
}

export interface OptionStrikeItem {
  strike: number;
  call_oi: number;
  call_change_oi: number;
  call_ltp: number;
  call_iv?: number | null;
  put_oi: number;
  put_change_oi: number;
  put_ltp: number;
  put_iv?: number | null;
}

export interface FnoAnalyticsResponse {
  symbol: string;
  fno_eligible: boolean;
  spot_price: number;
  current_expiry?: string | null;
  expiries: string[];
  pcr?: number | null;
  max_pain?: number | null;
  atm_iv?: number | null;
  call_resistance_strike?: number | null;
  put_support_strike?: number | null;
  fno_bias: string;
  strikes: OptionStrikeItem[];
  message?: string | null;
  as_of: string;
  stale: boolean;
}

export interface ForecastPoint {
  time: number;
  time_iso: string;
  predicted: number;
  lower_1sigma: number;
  upper_1sigma: number;
  lower_2sigma: number;
  upper_2sigma: number;
}

export interface BacktestMetrics {
  directional_accuracy_pct: number;
  mape_pct: number;
  rmse: number;
  tested_candles: number;
  model_name: string;
}

export interface HorizonForecastItem {
  horizon_id: "1m" | "5m" | "30m" | "1h" | "1d" | "5d" | string;
  label: string;
  target_price: number;
  expected_change: number;
  expected_change_pct: number;
  direction: "BULLISH" | "BEARISH" | "NEUTRAL" | string;
  lower_1sigma: number;
  upper_1sigma: number;
  lower_2sigma: number;
  upper_2sigma: number;
  target_time_iso: string;
  target_time_sec: number;
}

export interface StockPredictionResponse {
  symbol: string;
  yahoo_symbol: string;
  mode: string;
  current_price: number;
  forecast_target: number;
  expected_change_pct: number;
  projected_direction: "BULLISH" | "BEARISH" | "NEUTRAL" | string;
  disclaimer: string;
  metrics: BacktestMetrics;
  forecast: ForecastPoint[];
  horizons?: HorizonForecastItem[];
  as_of: string;
  stale: boolean;
}

export interface NewsArticleItem {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
  published_iso: string;
  time_sec: number;
  summary: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | string;
  sentiment_score: number;
}

export interface StockNewsResponse {
  symbol: string;
  name: string;
  timeframe: string;
  source_filter: string;
  total_articles: number;
  sentiment_breakdown: Record<string, number>;
  articles: NewsArticleItem[];
  as_of: string;
  stale: boolean;
}



