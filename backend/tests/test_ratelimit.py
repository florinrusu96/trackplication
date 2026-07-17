import time
from types import SimpleNamespace
from unittest.mock import patch

import app.ratelimit as rl
from app.schemas import ExtractionResult


def _ok(_text: str) -> ExtractionResult:
    return ExtractionResult(is_job_posting=True, company="Acme", role="Engineer")


def _register(client, email: str) -> dict:
    res = client.post("/api/auth/register", json={"email": email, "password": "password123"})
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['token']}"}


def test_second_request_within_window_is_429(client, auth):
    with patch("app.routes.extract_application", side_effect=_ok):
        r1 = client.post("/api/extract", json={"text": "a posting"}, headers=auth)
        r2 = client.post("/api/extract", json={"text": "a posting"}, headers=auth)
    assert r1.status_code == 200
    assert r2.status_code == 429
    assert r2.headers.get("Retry-After")


def test_limit_is_per_user(client, auth):
    other = _register(client, "other@example.com")
    with patch("app.routes.extract_application", side_effect=_ok):
        first_user = client.post("/api/extract", json={"text": "x"}, headers=auth)
        other_user = client.post("/api/extract", json={"text": "x"}, headers=other)
    # The second call is a different account — not throttled by the first user's request.
    assert first_user.status_code == 200
    assert other_user.status_code == 200


def test_window_resets_after_interval(client, auth, monkeypatch):
    clock = {"t": 1000.0}
    monkeypatch.setattr(rl.time, "monotonic", lambda: clock["t"])
    with patch("app.routes.extract_application", side_effect=_ok):
        r1 = client.post("/api/extract", json={"text": "x"}, headers=auth)
        r2 = client.post("/api/extract", json={"text": "x"}, headers=auth)
        clock["t"] += rl.WINDOW_SECONDS + 1
        r3 = client.post("/api/extract", json={"text": "x"}, headers=auth)
    assert r1.status_code == 200
    assert r2.status_code == 429
    assert r3.status_code == 200


def test_prune_evicts_stale_entries_over_threshold():
    rl.reset()
    now = time.monotonic()
    with rl._lock:
        for i in range(rl._MAX_KEYS + 5):
            rl._last_seen[f"stale{i}"] = now - (rl.WINDOW_SECONDS + 100)
    # A fresh request over the threshold triggers the prune of stale entries.
    rl.rate_limit_extract(user=SimpleNamespace(id="fresh"))
    assert "fresh" in rl._last_seen
    assert not any(k.startswith("stale") for k in rl._last_seen)
    rl.reset()
