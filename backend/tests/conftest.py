import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://tracker:tracker@localhost:5432/tracker_test",
)
os.environ["DATABASE_URL"] = TEST_DB_URL
os.environ["APP_API_KEY"] = "test-key"

from app import db as db_module  # noqa: E402
from app.db import Base  # noqa: E402

# Point the app's engine/session at the test database before anything else
# imports them.
_engine = create_engine(TEST_DB_URL, pool_pre_ping=True)
db_module.engine = _engine
db_module.SessionLocal = sessionmaker(
    bind=_engine, autoflush=False, expire_on_commit=False
)

from app import models  # noqa: E402,F401 — register tables
from app.main import create_app  # noqa: E402

API_KEY = "test-key"


@pytest.fixture(scope="session", autouse=True)
def _schema():
    Base.metadata.drop_all(_engine)
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


@pytest.fixture
def auth():
    return {"X-API-Key": API_KEY}
