from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers.market import router as market_router

app = FastAPI(
    title="AlgoCulture India API",
    version="0.1.0",
    description="NSE/BSE market quotes, multi-horizon charts, F&O analytics, AI forecasts, and Moneycontrol news API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_router)
