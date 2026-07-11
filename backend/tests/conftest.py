import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# In-memory SQLite, shared across the app's threadpool connections via
# StaticPool — fully self-contained, no database to provision.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret-at-least-thirty-two-bytes-long"

from app import db as db_module  # noqa: E402
from app.db import Base  # noqa: E402

_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
db_module.engine = _engine
db_module.SessionLocal = sessionmaker(
    bind=_engine, autoflush=False, expire_on_commit=False
)

from app import models  # noqa: E402,F401 — register tables
from app.main import create_app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _schema():
    Base.metadata.create_all(_engine)
    yield
    Base.metadata.drop_all(_engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    with _engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    yield


@pytest.fixture
def client():
    return TestClient(create_app())


def register(client: TestClient, email: str, password: str = "password123") -> dict:
    """Register a user and return an Authorization header for them."""
    res = client.post(
        "/api/auth/register", json={"email": email, "password": password}
    )
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['token']}"}


@pytest.fixture
def auth(client):
    return register(client, "user@example.com")
