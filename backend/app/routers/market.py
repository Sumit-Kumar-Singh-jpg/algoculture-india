from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.config import get_nse_market_status
from app.models import (
    FnoAnalyticsResponse,
    HealthResponse,
    MarketPulseResponse,
    StockHistoryResponse,
    StockPredictionResponse,
    StockQuoteResponse,
    StockSearchResponse,
)
from app.services.fno_service import get_fno_analytics
from app.services.history_service import get_stock_history
from app.services.prediction_service import get_stock_prediction
from app.services.market_data import (
    get_market_pulse,
    get_stock_quote,
    search_stocks,
)

router = APIRouter(prefix="/api", tags=["market"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="pulsetrade-india-backend",
        market_status=get_nse_market_status(),
    )


@router.get("/stocks/search", response_model=StockSearchResponse)
def stock_search(
    q: str = Query(default="", max_length=64),
    limit: int = Query(default=12, ge=1, le=30),
) -> StockSearchResponse:
    return StockSearchResponse(
        query=q,
        results=search_stocks(q, limit=limit),
    )


@router.get("/stocks/pulse", response_model=MarketPulseResponse)
def stock_pulse() -> MarketPulseResponse:
    return get_market_pulse()


@router.get("/stocks/{symbol}/quote", response_model=StockQuoteResponse)
def stock_quote(symbol: str) -> StockQuoteResponse:
    try:
        return get_stock_quote(symbol)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to fetch quote for {symbol}: {exc}",
        ) from exc


@router.get("/stocks/{symbol}/history", response_model=StockHistoryResponse)
def stock_history(
    symbol: str,
    mode: str = Query(default="intraday"),
    interval: str | None = Query(default=None),
    range: str | None = Query(default=None),
) -> StockHistoryResponse:
    try:
        return get_stock_history(symbol, mode=mode, interval=interval, time_range=range)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to fetch history for {symbol}: {exc}",
        ) from exc


@router.get("/stocks/{symbol}/fno", response_model=FnoAnalyticsResponse)
def stock_fno(
    symbol: str,
    expiry: str | None = Query(default=None),
) -> FnoAnalyticsResponse:
    try:
        return get_fno_analytics(symbol, expiry=expiry)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to fetch F&O derivatives for {symbol}: {exc}",
        ) from exc


@router.get("/stocks/{symbol}/predict", response_model=StockPredictionResponse)
def stock_predict(
    symbol: str,
    mode: str = Query(default="intraday"),
) -> StockPredictionResponse:
    try:
        return get_stock_prediction(symbol, mode=mode)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to generate AI prediction for {symbol}: {exc}",
        ) from exc


