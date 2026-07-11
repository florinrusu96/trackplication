import secrets

from fastapi import Header, HTTPException, status

from app.config import get_settings


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Guard every /api route (except health) with a shared key.

    Single-user v1: the frontend prompts for the key once and stores it in
    localStorage. Swap this dependency for a session/user lookup to add real
    auth later.
    """
    expected = get_settings().app_api_key
    if not x_api_key or not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
