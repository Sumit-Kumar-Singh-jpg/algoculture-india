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
