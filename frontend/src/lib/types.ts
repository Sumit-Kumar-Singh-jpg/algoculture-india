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

