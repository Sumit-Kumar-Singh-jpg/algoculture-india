from __future__ import annotations

from datetime import datetime, timezone
from threading import RLock
from typing import Any, Callable, TypeVar

from cachetools import TTLCache

T = TypeVar("T")


class ResilientTTLCache:
    """Thread-safe TTL cache that preserves stale values as fallback on upstream failure."""

    def __init__(self, maxsize: int = 512, ttl: int = 15) -> None:
        self._cache: TTLCache[str, tuple[Any, str]] = TTLCache(maxsize=maxsize, ttl=ttl)
        self._stale: dict[str, tuple[Any, str]] = {}
        self._lock = RLock()

    def get(self, key: str) -> tuple[Any, str] | None:
        with self._lock:
            return self._cache.get(key)

    def set(self, key: str, value: Any) -> str:
        ts = datetime.now(timezone.utc).isoformat()
        with self._lock:
            self._cache[key] = (value, ts)
            self._stale[key] = (value, ts)
        return ts

    def get_stale(self, key: str) -> tuple[Any, str] | None:
        with self._lock:
            return self._stale.get(key)

    def get_or_fetch(
        self,
        key: str,
        fetcher: Callable[[], T],
    ) -> tuple[T, str, bool]:
        """Return (data, cached_at_iso, is_stale). Falls back to stale entry if fetcher fails."""
        cached = self.get(key)
        if cached is not None:
            return cached[0], cached[1], False

        try:
            fresh = fetcher()
            ts = self.set(key, fresh)
            return fresh, ts, False
        except Exception:
            stale = self.get_stale(key)
            if stale is not None:
                return stale[0], stale[1], True
            raise

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            self._stale.clear()
