import json
import os
import time
import threading
from typing import Any, Optional, Dict
from backend.app.config import Config
from backend.app.utils.logging import logger


class InMemoryCache:
    """Thread-safe in-memory cache with TTL support used when Redis is offline."""

    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[str]:
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            if entry["expires_at"] is not None and time.time() > entry["expires_at"]:
                del self._store[key]
                return None
            return entry["val"]

    def set(self, key: str, value: str, ttl: Optional[int] = None) -> None:
        with self._lock:
            expires_at = (time.time() + ttl) if ttl else None
            self._store[key] = {"val": value, "expires_at": expires_at}

    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._store:
                del self._store[key]
                return True
            return False

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


class CacheService:
    """
    Unified high-performance cache service.
    Connects to Redis (via REDIS_URL) with automatic fallback to high-speed in-memory store.
    """

    _instance = None
    _redis_client = None
    _memory_cache = None
    _is_redis = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CacheService, cls).__new__(cls)
            cls._instance._init_backend()
        return cls._instance

    def _init_backend(self):
        self._memory_cache = InMemoryCache()
        self._redis_client = None
        self._is_redis = False

        redis_url = os.getenv("REDIS_URL") or Config.REDIS_URL or "redis://localhost:6379/0"

        try:
            import redis
            client = redis.Redis.from_url(redis_url, socket_timeout=1.0, socket_connect_timeout=1.0)
            client.ping()
            self._redis_client = client
            self._is_redis = True
            logger.info(f"Connected to Redis cache at {redis_url}")
        except Exception as e:
            logger.info(f"Redis not available ({e}); using fast thread-safe in-memory cache fallback.")
            self._redis_client = None
            self._is_redis = False

    def is_redis_active(self) -> bool:
        return self._is_redis

    def backend_name(self) -> str:
        return "redis" if self._is_redis else "memory"

    def get(self, key: str) -> Optional[str]:
        if self._is_redis and self._redis_client:
            try:
                res = self._redis_client.get(key)
                if res is not None:
                    return res.decode("utf-8") if isinstance(res, bytes) else str(res)
            except Exception as e:
                logger.warning(f"Redis get error: {e}; falling back to memory.")
                self._is_redis = False
        return self._memory_cache.get(key)

    def set(self, key: str, value: str, ttl: Optional[int] = None) -> None:
        if self._is_redis and self._redis_client:
            try:
                if ttl:
                    self._redis_client.setex(key, ttl, value)
                else:
                    self._redis_client.set(key, value)
                return
            except Exception as e:
                logger.warning(f"Redis set error: {e}; writing to memory.")
                self._is_redis = False
        self._memory_cache.set(key, value, ttl=ttl)

    def get_json(self, key: str) -> Optional[Any]:
        raw = self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except Exception:
            return None

    def set_json(self, key: str, data: Any, ttl: Optional[int] = 3600) -> None:
        try:
            serialized = json.dumps(data, default=str)
            self.set(key, serialized, ttl=ttl)
        except Exception as e:
            logger.error(f"Failed to serialize cache data for key '{key}': {e}")

    def delete(self, key: str) -> bool:
        if self._is_redis and self._redis_client:
            try:
                return bool(self._redis_client.delete(key))
            except Exception:
                pass
        return self._memory_cache.delete(key)

    def preload_operational_data(self, date_str: str, payload: Dict[str, Any], ttl: int = 7200):
        """Preloads next operational metrics into cache for instantaneous access."""
        key = f"khb:operational:{date_str}"
        self.set_json(key, payload, ttl=ttl)
        self.set_json("khb:operational:latest", payload, ttl=ttl)
        logger.info(f"Loaded operational data to cache key: '{key}' (backend: {self.backend_name()})")

    def get_preloaded_operational_data(self, date_str: Optional[str] = None) -> Optional[Dict[str, Any]]:
        key = f"khb:operational:{date_str}" if date_str else "khb:operational:latest"
        return self.get_json(key)


# Global singleton instance
cache = CacheService()

