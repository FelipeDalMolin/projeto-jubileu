import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.auth import routes as auth_routes
from app.routers import jogadores, dias, turmas, partidas, eventos, usuarios
from app.api.dashboards import jogadores as dashboards_jogadores
from app.api.dashboards import partidas as dashboards_partidas
from app.api.dashboards import estatisticas as dashboards_estatisticas

logger = logging.getLogger("jubileu.request")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.APP_VERSION,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.CORS_ALLOWED_ORIGINS),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        started_at = time.perf_counter()
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
            if "response" in locals():
                response.headers["X-Request-ID"] = request_id
            logger.info(
                "request_id=%s method=%s path=%s status_code=%s duration_ms=%.2f",
                request_id,
                request.method,
                request.url.path,
                status_code,
                duration_ms,
            )

    @app.get("/")
    def read_root():
        return {"status": "ok", "message": "Jubileu API rodando"}

    @app.get("/health")
    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    app.include_router(jogadores.router)
    app.include_router(dias.router)
    app.include_router(turmas.router)
    app.include_router(partidas.router)
    app.include_router(eventos.router)
    app.include_router(usuarios.router)
    app.include_router(auth_routes.router)
    app.include_router(dashboards_jogadores.router)
    app.include_router(dashboards_partidas.router)
    app.include_router(dashboards_estatisticas.router)

    app.include_router(jogadores.router, prefix="/api")
    app.include_router(dias.router, prefix="/api")
    app.include_router(turmas.router, prefix="/api")
    app.include_router(partidas.router, prefix="/api")
    app.include_router(dashboards_jogadores.router, prefix="/api")
    app.include_router(dashboards_partidas.router, prefix="/api")
    app.include_router(dashboards_estatisticas.router, prefix="/api")

    return app


app = create_app()
