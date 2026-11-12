import type {
  MarketPulseResponse,
  StockQuote,
  StockSearchResponse,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `API request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function searchStocks(
  query: string,
  signal?: AbortSignal
): Promise<StockSearchResponse> {
  const params = new URLSearchParams({ q: query, limit: "12" });
  return fetchJson<StockSearchResponse>(`/api/stocks/search?${params.toString()}`, signal);
}

export function fetchStockQuote(
  symbol: string,
  signal?: AbortSignal
): Promise<StockQuote> {
  return fetchJson<StockQuote>(
    `/api/stocks/${encodeURIComponent(symbol)}/quote`,
    signal
  );
}

export function fetchMarketPulse(
  signal?: AbortSignal
): Promise<MarketPulseResponse> {
  return fetchJson<MarketPulseResponse>("/api/stocks/pulse", signal);
}

export function fetchStockHistory(
  symbol: string,
  mode: "intraday" | "longterm",
  interval?: string,
  timeRange?: string,
  signal?: AbortSignal
): Promise<import("./types").StockHistoryResponse> {
  const params = new URLSearchParams({ mode });
  if (interval) params.set("interval", interval);
  if (timeRange) params.set("range", timeRange);
  return fetchJson<import("./types").StockHistoryResponse>(
    `/api/stocks/${encodeURIComponent(symbol)}/history?${params.toString()}`,
    signal
  );
}

export function fetchFnoAnalytics(
  symbol: string,
  expiry?: string,
  signal?: AbortSignal
): Promise<import("./types").FnoAnalyticsResponse> {
  const params = new URLSearchParams();
  if (expiry) params.set("expiry", expiry);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchJson<import("./types").FnoAnalyticsResponse>(
    `/api/stocks/${encodeURIComponent(symbol)}/fno${q}`,
    signal
  );
}

export function fetchStockPrediction(
  symbol: string,
  mode: "intraday" | "fno" | "longterm",
  signal?: AbortSignal
): Promise<import("./types").StockPredictionResponse> {
  const params = new URLSearchParams({ mode });
  return fetchJson<import("./types").StockPredictionResponse>(
    `/api/stocks/${encodeURIComponent(symbol)}/predict?${params.toString()}`,
    signal
  );
}


