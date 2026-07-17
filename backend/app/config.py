from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Haiku: cheapest model that still supports structured outputs. Extraction is
# easy — Opus is overkill and ~5x the price. Override via ANTHROPIC_MODEL.
DEFAULT_MODEL = "claude-haiku-4-5"

# Extraction backend. "anthropic" = Claude API (prod). "ollama" = a locally
# hosted model for free offline dev. Both return the same ExtractionResult.
PROVIDERS = ("anthropic", "ollama")
DEFAULT_PROVIDER = "anthropic"
DEFAULT_OLLAMA_MODEL = "gemma4:e4b"

# backend/.env — absolute so it loads regardless of the process CWD (uvicorn
# launched from repo root vs backend/ would otherwise miss it). OS env vars
# still take precedence over the file.
_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore")

    # Local dev defaults to a zero-setup SQLite file. Railway sets DATABASE_URL
    # to a Postgres URL in production.
    database_url: str = "sqlite:///./trackplication.db"
    anthropic_api_key: str = ""
    anthropic_model: str = DEFAULT_MODEL

    # Which backend runs extraction. Local dev sets EXTRACTION_PROVIDER=ollama.
    extraction_provider: str = DEFAULT_PROVIDER
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = DEFAULT_OLLAMA_MODEL

    @field_validator("anthropic_model")
    @classmethod
    def _model_default(cls, v: str) -> str:
        # A present-but-blank env var (ANTHROPIC_MODEL=) overrides the default
        # with "", which would send an empty model to the API. Coerce back.
        return v.strip() or DEFAULT_MODEL

    @field_validator("extraction_provider")
    @classmethod
    def _provider_valid(cls, v: str) -> str:
        v = v.strip().lower() or DEFAULT_PROVIDER
        if v not in PROVIDERS:
            raise ValueError(f"extraction_provider must be one of {PROVIDERS}")
        return v

    @field_validator("ollama_model")
    @classmethod
    def _ollama_model_default(cls, v: str) -> str:
        return v.strip() or DEFAULT_OLLAMA_MODEL

    # Auth. Set a strong JWT_SECRET in production.
    jwt_secret: str = "dev-secret-change-me-in-production-only"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Directory holding the built frontend (dist/). Empty in dev; set in the
    # Docker image so FastAPI serves the SPA. See main.py.
    static_dir: str = ""

    # Root log level for the app's own loggers (DEBUG, INFO, WARNING, ...).
    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
