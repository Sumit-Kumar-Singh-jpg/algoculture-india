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
