from datetime import datetime, time
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

QUOTE_TTL_SECONDS = 10
PULSE_TTL_SECONDS = 15
SEARCH_TTL_SECONDS = 3600
HISTORY_TTL_SECONDS = 120
FNO_TTL_SECONDS = 45
PREDICT_TTL_SECONDS = 300
NEWS_TTL_SECONDS = 300

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)


def get_nse_market_status(now: datetime | None = None) -> str:
    """Return current NSE market session status in IST."""
    current = (now or datetime.now(IST)).astimezone(IST)
    if current.weekday() >= 5:
        return "CLOSED"

    t = current.time()
    if time(9, 0) <= t < time(9, 15):
        return "PRE_OPEN"
    if time(9, 15) <= t <= time(15, 30):
        return "OPEN"
    return "CLOSED"
