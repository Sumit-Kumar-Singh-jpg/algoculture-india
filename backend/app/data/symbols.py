from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class StockEntry:
    symbol: str
    yahoo_symbol: str
    name: str
    exchange: str
    sector: str
    is_fno: bool
    is_index: bool = False


POPULAR_STOCKS: tuple[StockEntry, ...] = (
    # Major Indices
    StockEntry("NIFTY", "^NSEI", "NIFTY 50 Index", "NSE", "Index", True, True),
    StockEntry("BANKNIFTY", "^NSEBANK", "NIFTY Bank Index", "NSE", "Index", True, True),
    StockEntry("FINNIFTY", "NIFTY_FIN_SERVICE.NS", "NIFTY Financial Services", "NSE", "Index", True, True),
    StockEntry("SENSEX", "^BSESN", "BSE SENSEX Index", "BSE", "Index", True, True),
    StockEntry("INDIAVIX", "^INDIAVIX", "India VIX Volatility Index", "NSE", "Volatility", False, True),
    # NIFTY 50 & Top F&O Equities
    StockEntry("RELIANCE", "RELIANCE.NS", "Reliance Industries Ltd", "NSE", "Energy & Telecom", True),
    StockEntry("TCS", "TCS.NS", "Tata Consultancy Services Ltd", "NSE", "IT Services", True),
    StockEntry("HDFCBANK", "HDFCBANK.NS", "HDFC Bank Ltd", "NSE", "Banking", True),
    StockEntry("ICICIBANK", "ICICIBANK.NS", "ICICI Bank Ltd", "NSE", "Banking", True),
    StockEntry("INFY", "INFY.NS", "Infosys Ltd", "NSE", "IT Services", True),
    StockEntry("SBIN", "SBIN.NS", "State Bank of India", "NSE", "Banking", True),
    StockEntry("BHARTIARTL", "BHARTIARTL.NS", "Bharti Airtel Ltd", "NSE", "Telecom", True),
    StockEntry("ITC", "ITC.NS", "ITC Ltd", "NSE", "FMCG", True),
    StockEntry("LT", "LT.NS", "Larsen & Toubro Ltd", "NSE", "Infrastructure", True),
    StockEntry("KOTAKBANK", "KOTAKBANK.NS", "Kotak Mahindra Bank Ltd", "NSE", "Banking", True),
    StockEntry("AXISBANK", "AXISBANK.NS", "Axis Bank Ltd", "NSE", "Banking", True),
    StockEntry("HINDUNILVR", "HINDUNILVR.NS", "Hindustan Unilever Ltd", "NSE", "FMCG", True),
    StockEntry("BAJFINANCE", "BAJFINANCE.NS", "Bajaj Finance Ltd", "NSE", "NBFC", True),
    StockEntry("MARUTI", "MARUTI.NS", "Maruti Suzuki India Ltd", "NSE", "Automobiles", True),
    StockEntry("TATAMOTORS", "TATAMOTORS.NS", "Tata Motors Ltd", "NSE", "Automobiles", True),
    StockEntry("TATASTEEL", "TATASTEEL.NS", "Tata Steel Ltd", "NSE", "Metals", True),
    StockEntry("SUNPHARMA", "SUNPHARMA.NS", "Sun Pharmaceutical Industries Ltd", "NSE", "Pharma", True),
    StockEntry("TITAN", "TITAN.NS", "Titan Company Ltd", "NSE", "Consumer Durables", True),
    StockEntry("ASIANPAINT", "ASIANPAINT.NS", "Asian Paints Ltd", "NSE", "Consumer Goods", True),
    StockEntry("WIPRO", "WIPRO.NS", "Wipro Ltd", "NSE", "IT Services", True),
    StockEntry("ADANIENT", "ADANIENT.NS", "Adani Enterprises Ltd", "NSE", "Conglomerate", True),
    StockEntry("ADANIPORTS", "ADANIPORTS.NS", "Adani Ports and Special Economic Zone Ltd", "NSE", "Logistics", True),
    StockEntry("HCLTECH", "HCLTECH.NS", "HCL Technologies Ltd", "NSE", "IT Services", True),
    StockEntry("NTPC", "NTPC.NS", "NTPC Ltd", "NSE", "Power", True),
    StockEntry("POWERGRID", "POWERGRID.NS", "Power Grid Corporation of India Ltd", "NSE", "Power", True),
    StockEntry("ULTRACEMCO", "ULTRACEMCO.NS", "UltraTech Cement Ltd", "NSE", "Cement", True),
    StockEntry("ONGC", "ONGC.NS", "Oil & Natural Gas Corporation Ltd", "NSE", "Energy", True),
    StockEntry("COALINDIA", "COALINDIA.NS", "Coal India Ltd", "NSE", "Mining", True),
    StockEntry("JSWSTEEL", "JSWSTEEL.NS", "JSW Steel Ltd", "NSE", "Metals", True),
    StockEntry("M&M", "M&M.NS", "Mahindra & Mahindra Ltd", "NSE", "Automobiles", True),
    StockEntry("BAJAJFINSV", "BAJAJFINSV.NS", "Bajaj Finserv Ltd", "NSE", "Financial Services", True),
    StockEntry("TECHM", "TECHM.NS", "Tech Mahindra Ltd", "NSE", "IT Services", True),
    StockEntry("DRREDDY", "DRREDDY.NS", "Dr. Reddy's Laboratories Ltd", "NSE", "Pharma", True),
    StockEntry("CIPLA", "CIPLA.NS", "Cipla Ltd", "NSE", "Pharma", True),
    StockEntry("INDUSINDBK", "INDUSINDBK.NS", "IndusInd Bank Ltd", "NSE", "Banking", True),
    StockEntry("HINDALCO", "HINDALCO.NS", "Hindalco Industries Ltd", "NSE", "Metals", True),
    StockEntry("EICHERMOT", "EICHERMOT.NS", "Eicher Motors Ltd", "NSE", "Automobiles", True),
    StockEntry("HEROMOTOCO", "HEROMOTOCO.NS", "Hero MotoCorp Ltd", "NSE", "Automobiles", True),
    StockEntry("BRITANNIA", "BRITANNIA.NS", "Britannia Industries Ltd", "NSE", "FMCG", True),
    StockEntry("BPCL", "BPCL.NS", "Bharat Petroleum Corporation Ltd", "NSE", "Energy", True),
    StockEntry("TATACONSUM", "TATACONSUM.NS", "Tata Consumer Products Ltd", "NSE", "FMCG", True),
    StockEntry("SBILIFE", "SBILIFE.NS", "SBI Life Insurance Company Ltd", "NSE", "Insurance", True),
    StockEntry("HDFCLIFE", "HDFCLIFE.NS", "HDFC Life Insurance Company Ltd", "NSE", "Insurance", True),
    StockEntry("HAL", "HAL.NS", "Hindustan Aeronautics Ltd", "NSE", "Defence", True),
    StockEntry("BEL", "BEL.NS", "Bharat Electronics Ltd", "NSE", "Defence", True),
    StockEntry("BHEL", "BHEL.NS", "Bharat Heavy Electricals Ltd", "NSE", "Capital Goods", True),
    StockEntry("DLF", "DLF.NS", "DLF Ltd", "NSE", "Real Estate", True),
    StockEntry("TRENT", "TRENT.NS", "Trent Ltd", "NSE", "Retail", True),
    StockEntry("IRCTC", "IRCTC.NS", "Indian Railway Catering and Tourism Corp Ltd", "NSE", "Travel & Tourism", True),
    StockEntry("VEDL", "VEDL.NS", "Vedanta Ltd", "NSE", "Metals", True),
    StockEntry("JIOFIN", "JIOFIN.NS", "Jio Financial Services Ltd", "NSE", "Financial Services", True),
    StockEntry("ETERNAL", "ETERNAL.NS", "Eternal Ltd (Zomato)", "NSE", "Consumer Tech", True),
    StockEntry("PAYTM", "PAYTM.NS", "One 97 Communications Ltd (Paytm)", "NSE", "Fintech", True),
    StockEntry("SUZLON", "SUZLON.NS", "Suzlon Energy Ltd", "NSE", "Renewables", False),
    StockEntry("YESBANK", "YESBANK.NS", "Yes Bank Ltd", "NSE", "Banking", False),
    StockEntry("IDEA", "IDEA.NS", "Vodafone Idea Ltd", "NSE", "Telecom", True),
)

STOCK_BY_SYMBOL: dict[str, StockEntry] = {item.symbol: item for item in POPULAR_STOCKS}

SYMBOL_ALIASES: dict[str, str] = {
    "NIFTY50": "NIFTY",
    "NIFTY 50": "NIFTY",
    "^NSEI": "NIFTY",
    "NIFTY BANK": "BANKNIFTY",
    "^NSEBANK": "BANKNIFTY",
    "BSE SENSEX": "SENSEX",
    "^BSESN": "SENSEX",
    "INDIA VIX": "INDIAVIX",
    "^INDIAVIX": "INDIAVIX",
    "ZOMATO": "ETERNAL",
    "ZOMATO.NS": "ETERNAL",
}

FNO_ELIGIBLE_SYMBOLS: frozenset[str] = frozenset(
    item.symbol for item in POPULAR_STOCKS if item.is_fno
)


def _load_all_nse_equities() -> tuple[StockEntry, ...]:
    entries: list[StockEntry] = list(POPULAR_STOCKS)
    seen = {e.symbol for e in entries}

    json_path = Path(__file__).parent / "nse_equities.json"
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for item in data:
                sym = item.get("symbol", "").strip()
                name = item.get("name", "").strip()
                if sym and sym not in seen:
                    entries.append(
                        StockEntry(
                            symbol=sym,
                            yahoo_symbol=f"{sym}.NS",
                            name=name,
                            exchange="NSE",
                            sector="Equity",
                            is_fno=sym in FNO_ELIGIBLE_SYMBOLS,
                            is_index=False,
                        )
                    )
                    seen.add(sym)
        except Exception:
            pass
    return tuple(entries)


ALL_NSE_STOCKS: tuple[StockEntry, ...] = _load_all_nse_equities()
ALL_STOCKS_BY_SYMBOL: dict[str, StockEntry] = {item.symbol: item for item in ALL_NSE_STOCKS}


def resolve_symbol(raw_symbol: str) -> tuple[str, str, str, str, bool, bool]:
    """
    Resolve a user-supplied ticker into:
    (canonical_symbol, yahoo_symbol, company_name, exchange, is_fno, is_index)
    """
    cleaned = raw_symbol.strip().upper()
    cleaned = SYMBOL_ALIASES.get(cleaned, cleaned)

    base = cleaned
    explicit_exchange = None
    if cleaned.endswith(".NS"):
        base = cleaned[:-3]
        explicit_exchange = "NSE"
    elif cleaned.endswith(".BO"):
        base = cleaned[:-3]
        explicit_exchange = "BSE"

    if base in ALL_STOCKS_BY_SYMBOL and explicit_exchange != "BSE":
        entry = ALL_STOCKS_BY_SYMBOL[base]
        return (
            entry.symbol,
            entry.yahoo_symbol,
            entry.name,
            entry.exchange,
            entry.is_fno,
            entry.is_index,
        )

    if explicit_exchange == "BSE":
        entry = ALL_STOCKS_BY_SYMBOL.get(base)
        return (
            f"{base}.BO",
            f"{base}.BO",
            entry.name if entry else base,
            "BSE",
            False,
            False,
        )

    if cleaned.startswith("^"):
        return (cleaned, cleaned, cleaned, "INDEX", False, True)

    return (
        base,
        f"{base}.NS",
        base,
        "NSE",
        base in FNO_ELIGIBLE_SYMBOLS,
        False,
    )
