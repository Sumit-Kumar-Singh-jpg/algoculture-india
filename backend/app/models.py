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


class CandleItem(BaseModel):
    time: int  # Unix timestamp in seconds for lightweight-charts
    time_iso: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    vwap: float | None = None
    ema9: float | None = None
    ema21: float | None = None
    sma50: float | None = None
    sma200: float | None = None
    rsi14: float | None = None


class TechnicalBias(BaseModel):
    bias: str  # BULLISH | BEARISH | NEUTRAL
    score: float  # -1.0 to 1.0
    summary: str
    rsi: float | None = None
    vwap_signal: str
    ema_signal: str
    dma_signal: str


class StockHistoryResponse(BaseModel):
    symbol: str
    yahoo_symbol: str
    mode: str
    interval: str
    range: str
    currency: str = "INR"
    session_date: str
    candles: list[CandleItem]
    bias: TechnicalBias
    as_of: str
    stale: bool = False


class OptionStrikeItem(BaseModel):
    strike: float
    call_oi: int
    call_change_oi: int
    call_ltp: float
    call_iv: float | None = None
    put_oi: int
    put_change_oi: int
    put_ltp: float
    put_iv: float | None = None


class FnoAnalyticsResponse(BaseModel):
    symbol: str
    fno_eligible: bool
    spot_price: float
    current_expiry: str | None = None
    expiries: list[str] = []
    pcr: float | None = None
    max_pain: float | None = None
    atm_iv: float | None = None
    call_resistance_strike: float | None = None
    put_support_strike: float | None = None
    fno_bias: str = "NEUTRAL"
    strikes: list[OptionStrikeItem] = []
    message: str | None = None
    as_of: str
    stale: bool = False


class ForecastPoint(BaseModel):
    time: int
    time_iso: str
    predicted: float
    lower_1sigma: float
    upper_1sigma: float
    lower_2sigma: float
    upper_2sigma: float


class BacktestMetrics(BaseModel):
    directional_accuracy_pct: float
    mape_pct: float
    rmse: float
    tested_candles: int
    model_name: str


class HorizonForecastItem(BaseModel):
    horizon_id: str  # 1m, 5m, 30m, 1h, 1d, 5d
    label: str       # Next 1 Min, Next 5 Min, Next 30 Min, Next 1 Hr, Next 1 Day, Next 5 Days
    target_price: float
    expected_change: float
    expected_change_pct: float
    direction: str   # BULLISH | BEARISH | NEUTRAL
    lower_1sigma: float
    upper_1sigma: float
    lower_2sigma: float
    upper_2sigma: float
    target_time_iso: str
    target_time_sec: int


class StockPredictionResponse(BaseModel):
    symbol: str
    yahoo_symbol: str
    mode: str
    current_price: float
    forecast_target: float
    expected_change_pct: float
    projected_direction: str  # BULLISH | BEARISH | NEUTRAL
    disclaimer: str
    metrics: BacktestMetrics
    forecast: list[ForecastPoint]
    horizons: list[HorizonForecastItem] = []
    as_of: str
    stale: bool = False


class NewsArticleItem(BaseModel):
    id: str
    title: str
    url: str
    source: str  # Moneycontrol | Economic Times | LiveMint | Google News
    published_at: str
    published_iso: str
    time_sec: int
    summary: str
    sentiment: str  # BULLISH | BEARISH | NEUTRAL
    sentiment_score: float  # -1.0 to 1.0


class StockNewsResponse(BaseModel):
    symbol: str
    name: str
    timeframe: str
    source_filter: str
    total_articles: int
    sentiment_breakdown: dict[str, int]
    articles: list[NewsArticleItem]
    as_of: str
    stale: bool = False



