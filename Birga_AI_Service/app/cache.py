import time
from typing import Optional
from .models import AiStructuredResponse

CACHE_TTL = 3600  # 1 hour
MAX_CACHE = 500

_store: dict[str, tuple[AiStructuredResponse, float]] = {}


def _hash(s: str) -> int:
    h = 0
    for c in s:
        h = (31 * h + ord(c)) & 0xFFFFFFFF
    return h


def cache_key(messages: list, locale: str) -> str:
    window = "|".join(
        f"{m.role}:{m.content.lower().strip()}"
        for m in messages[-3:]
    )
    return str(_hash(f"{locale}:{window}"))


def get(key: str) -> Optional[AiStructuredResponse]:
    entry = _store.get(key)
    if entry is None:
        return None
    response, expires_at = entry
    if time.time() > expires_at:
        del _store[key]
        return None
    return response


def set(key: str, response: AiStructuredResponse) -> None:
    if len(_store) >= MAX_CACHE:
        oldest = next(iter(_store))
        del _store[oldest]
    _store[key] = (response, time.time() + CACHE_TTL)
