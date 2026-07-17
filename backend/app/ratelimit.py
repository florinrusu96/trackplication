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

_lock = threading.Lock()
_last_seen: dict[str, float] = {}


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
        _last_seen[key] = now
