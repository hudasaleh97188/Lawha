"""FastAPI app factory."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.config import settings
from api.logging_config import setup_logging
from api.paths import GENERATED_DIR
from api.routes import ROUTERS


def create_app() -> FastAPI:
    setup_logging()
    app = FastAPI(title="Lawha API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")

    for r in ROUTERS:
        app.include_router(r)

    return app
