# Trackplication

A personal job-application tracker. Paste a job posting into the AI assistant, Claude
extracts the structured fields (company, role, location, salary, requirements), you
confirm/edit, and it lands on your dashboard. Status tracking, inline detail, summary
stats, filtering — responsive for checking from your phone.

**Stack:** FastAPI · React + TypeScript · SQLite (dev) / Postgres (prod) · Anthropic Claude
API. One deployable service (FastAPI serves the built React SPA), deployed on Railway.

## Architecture

```
Browser (desktop + phone)
  ├─ Dashboard: GET /api/applications once → filter/sort/search/stats client-side
  ├─ Status cycle / notes edit → PATCH (optimistic UI)
  └─ Chat panel: POST /api/extract → Claude → editable confirm card → POST /api/applications

FastAPI (one container)
  ├─ /api/*  REST → SQLAlchemy → SQLite (dev) / Postgres (prod)
  ├─ /api/extract → extraction provider (Claude API in prod, local Ollama in dev; schema-enforced)
  └─ /*      StaticFiles: built React bundle (SPA fallback to index.html)
```

The LLM call lives only in `POST /api/extract`, isolated from the dashboard path — the
dashboard is a single DB query and never blocked by Claude latency.

## Auth

Multi-user, email + password. Register or log in → the API returns a **JWT**; the frontend
stores it in `localStorage` and sends it as `Authorization: Bearer <token>` on every
request. Passwords are bcrypt-hashed. All `/api/applications` and `/api/extract` routes
require a valid token, and every query is scoped to the logged-in user — you only see your
own applications. Google sign-in is planned next (the `users` table already carries a
nullable `google_sub` for account linking).

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account (email + password ≥8). Returns `{ token, user }`. |
| POST | `/api/auth/login` | — | Log in. Returns `{ token, user }`. |
| GET | `/api/auth/me` | Bearer | Current user. |
| POST | `/api/extract` | Bearer | Extract fields from raw text. Saves nothing. |
| GET | `/api/applications` | Bearer | Your applications (newest first). |
| POST | `/api/applications` | Bearer | Create from confirm-card fields. |
| PATCH | `/api/applications/{id}` | Bearer | Update any subset (status, notes, …). |
| DELETE | `/api/applications/{id}` | Bearer | Delete. |
| GET | `/api/health` | — | Healthcheck. |

## Local development

No Docker needed — local dev uses a zero-setup **SQLite** file (`backend/trackplication.db`,
created automatically). Just Python 3.11+ and Node 20+. Production uses Postgres via
`DATABASE_URL`; the schema is dialect-portable, so the same migration runs on both.

```bash
# 1. Backend
cd backend
python -m venv .venv && .venv/bin/pip install -e ".[dev]"
cp .env.example .env        # pick an extraction backend — see below
source .venv/bin/activate # start the venv
alembic upgrade head          # creates trackplication.db
uvicorn app.main:app --reload # → http://localhost:8000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # → http://localhost:5173  (proxies /api to :8000)
```

Open http://localhost:5173. On first load, **sign up** with an email and password; the
JWT is stored in `localStorage`.

### Extraction backend: Claude API or local Ollama

`POST /api/extract` runs through one of two providers, selected by `EXTRACTION_PROVIDER`.
Both return the same schema-validated result — the app code is identical either way.

**Option A — local Ollama (free, offline, recommended for dev).** No API key or credits;
runs a small local model. Install [Ollama](https://ollama.com), pull the model, and point
the app at it:

```bash
ollama pull gemma4:e4b       # ~ small, fast; any instruct model works
# in backend/.env:
EXTRACTION_PROVIDER=ollama
OLLAMA_MODEL=gemma4:e4b
# OLLAMA_BASE_URL=http://localhost:11434   # default; override if remote
```

Ollama's daemon must be running (`ollama serve`, or the app on macOS starts it). First
extraction is slower (~10s while the model loads); subsequent calls are faster. Quality is
lower than Claude but fine for building/testing the pipeline.

**Option B — Claude API (production path).** Real quality, costs credits. Extraction is
~$0.0045/request on Haiku, so a few dollars of credit covers all dev + demos:

```bash
# in backend/.env:
EXTRACTION_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...      # needs a funded API account (separate from a Claude.ai sub)
# ANTHROPIC_MODEL=claude-haiku-4-5  # default; set claude-opus-4-8 for best quality
```

> The Anthropic **API** is billed separately from a Claude.ai Pro/Max subscription — a
> subscription does **not** grant API access. Restart uvicorn after changing provider/keys
> (settings are cached at startup).

Run backend tests (self-contained, in-memory SQLite — no setup):

```bash
cd backend && .venv/bin/pytest
```

**Optional — Postgres parity:** to run local dev against Postgres instead (e.g. to
sanity-check before deploy), `docker compose up -d db` and set
`DATABASE_URL=postgresql+psycopg://tracker:tracker@localhost:5432/tracker` before
`alembic upgrade head`.

### Database migrations

The schema is managed by Alembic (`backend/alembic/versions/`). The SQLite file is created
empty when the app first connects — **tables only exist after you run the migrations**, so
a fresh clone (or a new migration after `git pull`) needs an upgrade before the app works.

Run all Alembic commands from `backend/` with the venv active (`.venv/bin/alembic …`):

```bash
# Apply all pending migrations (run after clone and after every git pull).
alembic upgrade head

# See where your DB is vs. the latest migration.
alembic current          # revision your DB is stamped at
alembic heads            # latest revision in the codebase

# After you change a model in app/models.py, autogenerate a migration…
alembic revision --autogenerate -m "describe the change"
# …review the generated file in alembic/versions/, then apply it:
alembic upgrade head

# Roll back the most recent migration (down one revision).
alembic downgrade -1
```

Symptom of a stale DB: `OperationalError: no such table: …` on startup or first request —
you're behind on migrations. Run `alembic upgrade head`. A running `uvicorn --reload` picks
up new SQLite tables on the next request, so no restart is needed after upgrading.

**Nuclear reset (local SQLite only):** since there's no data worth keeping in dev, you can
delete the file and rebuild from scratch — `rm trackplication.db && alembic upgrade head`.

New migrations are portable across SQLite and Postgres: stick to `sa.Uuid`, `sa.JSON`, and
`sa.func.*` server defaults (see the existing versions), and avoid Postgres-only types.

## Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | DB connection. Unset locally → SQLite file. Railway sets it to Postgres. |
| `EXTRACTION_PROVIDER` | `anthropic` (Claude API — default, prod) or `ollama` (free local model for dev). |
| `ANTHROPIC_API_KEY` | Claude API key. Required when `EXTRACTION_PROVIDER=anthropic`. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-haiku-4-5` (cheap, structured-output capable). |
| `OLLAMA_MODEL` | Optional. Model for the `ollama` provider. Defaults to `gemma4:e4b`. |
| `OLLAMA_BASE_URL` | Optional. Ollama daemon URL. Defaults to `http://localhost:11434`. |
| `JWT_SECRET` | Signs auth tokens. **Set a strong random value (≥32 bytes) in production.** |

## Deploy (Railway)

1. Add a **Postgres** plugin (sets `DATABASE_URL`).
2. New service from this repo — Railway builds the `Dockerfile` (multi-stage: builds the
   React bundle, then serves it from FastAPI). `railway.json` sets the healthcheck to
   `/api/health`.
3. Set `ANTHROPIC_API_KEY` and a strong `JWT_SECRET` in the service variables.
4. Deploy. Migrations run automatically at container start (`alembic upgrade head`).

## Scope

Multi-user with email/password auth (JWT). Google sign-in is next. No browser extension or
notifications yet. See `~/.claude/plans/vast-wobbling-sifakis.md` for the original v1 plan.
