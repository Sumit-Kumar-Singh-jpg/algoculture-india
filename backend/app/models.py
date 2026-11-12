from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    market_status: str


class StockSearchItem(BaseModel):
    symbol: str
    yahoo_symbol: str
    name: str
    exchange: str
    sector: str
    is_fno: bool
    is_index: bool = False


class StockSearchResponse(BaseModel):
    query: str
    results: list[StockSearchItem]


class StockQuoteResponse(BaseModel):
    symbol: str
    yahoo_symbol: str
    name: str
    exchange: str
    currency: str = "INR"
    ltp: float
    change: float
    change_pct: float
    open: float
    high: float
    low: float
    prev_close: float
    volume: int
    week52_high: float | None = None
    week52_low: float | None = None
    market_status: str
    is_fno: bool
    is_index: bool
    as_of: str
    stale: bool = False


class MarketPulseItem(BaseModel):
    symbol: str
    label: str
    ltp: float
    change: float
    change_pct: float
    stale: bool = False


class MarketPulseResponse(BaseModel):
    market_status: str
    as_of: str
    items: list[MarketPulseItem]
