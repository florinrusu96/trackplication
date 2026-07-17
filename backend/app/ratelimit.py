"""Per-user rate limiting for the extract endpoint.

The extract endpoint calls the LLM (costs money) and fetches user-supplied URLs,
so it's the abuse-prone surface. This limits each user to one request per window.

In-memory store — correct for the single always-warm Railway container. A
multi-instance deploy would need a shared store (Redis); out of scope for v1.
"""

import threading
import time

from fastapi import Depends, HTTPException, status

from app.auth import get_current_user
from app.models import User

WINDOW_SECONDS = 10.0
# Cap the store so it can't grow one entry per user forever. Pruning is
# threshold-gated so it's not an O(n) sweep on every request.
_MAX_KEYS = 10_000

_lock = threading.Lock()
_last_seen: dict[str, float] = {}


def _prune_locked(now: float) -> None:
    """Drop entries older than the window. Caller must hold _lock.

    An entry older than WINDOW_SECONDS would pass the limit anyway, so removing
    it changes no behavior — it only bounds memory.
    """
    cutoff = now - WINDOW_SECONDS
    for key in [k for k, ts in _last_seen.items() if ts < cutoff]:
        del _last_seen[key]


def reset() -> None:
    """Clear all recorded timestamps. For tests."""
    with _lock:
        _last_seen.clear()


def rate_limit_extract(user: User = Depends(get_current_user)) -> None:
    """Allow one request per WINDOW_SECONDS per user; else 429."""
    key = str(user.id)
    now = time.monotonic()
    with _lock:
        last = _last_seen.get(key)
        if last is not None and now - last < WINDOW_SECONDS:
            retry_after = int(WINDOW_SECONDS - (now - last)) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You're going a bit fast — wait a few seconds and try again.",
                headers={"Retry-After": str(retry_after)},
            )
        if len(_last_seen) > _MAX_KEYS:
            _prune_locked(now)
        _last_seen[key] = now
