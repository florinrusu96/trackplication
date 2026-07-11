import os

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routes import auth_router, router


def create_app() -> FastAPI:
    app = FastAPI(title="Trackplication")

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth_router)
    app.include_router(router)

    # Serve the built React SPA in production (static_dir set in the Docker
    # image). Mounted last so it doesn't shadow /api routes. An unknown path
    # falls back to index.html for client-side routing.
    static_dir = get_settings().static_dir
    if static_dir and os.path.isdir(static_dir):
        assets = os.path.join(static_dir, "assets")
        if os.path.isdir(assets):
            app.mount("/assets", StaticFiles(directory=assets), name="assets")
        index = os.path.join(static_dir, "index.html")

        @app.get("/{full_path:path}")
        def spa(full_path: str) -> FileResponse:
            candidate = os.path.join(static_dir, full_path)
            if full_path and os.path.isfile(candidate):
                return FileResponse(candidate)
            return FileResponse(index)

    return app


app = create_app()
