# Trackplication

A personal job-application tracker. Paste a job posting into the AI assistant, Claude
extracts the structured fields (company, role, location, salary, requirements), you
confirm/edit, and it lands on your dashboard. Status tracking, inline detail, summary
stats, filtering — responsive for checking from your phone.

**Stack:** FastAPI · React + TypeScript · Postgres · Anthropic Claude API. One deployable
service (FastAPI serves the built React SPA), deployed on Railway.

## Architecture

```
Browser (desktop + phone)
  ├─ Dashboard: GET /api/applications once → filter/sort/search/stats client-side
  ├─ Status cycle / notes edit → PATCH (optimistic UI)
  └─ Chat panel: POST /api/extract → Claude → editable confirm card → POST /api/applications

FastAPI (one container)
  ├─ /api/*  REST → SQLAlchemy → Postgres
  ├─ /api/extract → Anthropic API (messages.parse, schema-enforced)
  └─ /*      StaticFiles: built React bundle (SPA fallback to index.html)
```

The LLM call lives only in `POST /api/extract`, isolated from the dashboard path — the
dashboard is a single DB query and never blocked by Claude latency.

## API

All `/api/*` routes require an `X-API-Key` header matching `APP_API_KEY` (single-user v1).

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/extract` | Extract fields from raw text. Saves nothing. |
| GET | `/api/applications` | All applications (newest first). |
| POST | `/api/applications` | Create from confirm-card fields. |
| PATCH | `/api/applications/{id}` | Update any subset (status, notes, …). |
| DELETE | `/api/applications/{id}` | Delete. |
| GET | `/api/health` | Healthcheck (no auth). |

## Local development

Requires Docker (for Postgres), Python 3.11+, Node 20+.

```bash
# 1. Postgres
docker compose up -d db

# 2. Backend
cd backend
python -m venv .venv && .venv/bin/pip install -e ".[dev]"
cp .env.example .env        # fill in ANTHROPIC_API_KEY
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload      # → http://localhost:8000

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # → http://localhost:5173  (proxies /api to :8000)
```

Open http://localhost:5173. On first load, enter your `APP_API_KEY` (default `dev-key`);
it's stored in `localStorage`.

Run backend tests (needs the `tracker_test` database):

```bash
docker compose exec -T db psql -U tracker -d tracker -c "CREATE DATABASE tracker_test;"
cd backend && .venv/bin/pytest
```

## Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (Railway provides this). |
| `ANTHROPIC_API_KEY` | For the extraction endpoint. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-opus-4-8`; set `claude-haiku-4-5` for cheaper/faster extraction. |
| `APP_API_KEY` | Shared access key the frontend and API check. |

## Deploy (Railway)

1. Add a **Postgres** plugin (sets `DATABASE_URL`).
2. New service from this repo — Railway builds the `Dockerfile` (multi-stage: builds the
   React bundle, then serves it from FastAPI). `railway.json` sets the healthcheck to
   `/api/health`.
3. Set `ANTHROPIC_API_KEY` and `APP_API_KEY` in the service variables.
4. Deploy. Migrations run automatically at container start (`alembic upgrade head`).

## Scope (v1)

Single user, shared API key. No browser extension, multi-user, or notifications — those
are v2. See `~/.claude/plans/vast-wobbling-sifakis.md` for the full plan and the
deliberate scope cuts.
