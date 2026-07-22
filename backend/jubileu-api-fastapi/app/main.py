import logging
import time
from uuid import uuid4

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import engine
from app.modules.auth import routes as auth_routes
from app.modules.auth.deps import get_current_user
from app.routers import jogadores, dias, turmas, partidas, eventos, usuarios
from app.api.dashboards import jogadores as dashboards_jogadores
from app.api.dashboards import partidas as dashboards_partidas
from app.api.dashboards import estatisticas as dashboards_estatisticas

logger = logging.getLogger("jubileu.request")


def create_app() -> FastAPI:
    docs_enabled = settings.APP_ENV.strip().lower() != "production"
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
        redirect_slashes=False,
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

    @app.get("/health")
    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.get("/api/ready")
    def readiness():
        try:
            with engine.connect() as connection:
                revision = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
                connection.execute(text("SELECT 1")).scalar_one()
        except Exception:
            logger.exception("readiness database check failed")
            return JSONResponse(status_code=503, content={"status": "not_ready"})

        if revision != settings.ALEMBIC_EXPECTED_REVISION:
            logger.error(
                "readiness schema mismatch current=%s expected=%s",
                revision,
                settings.ALEMBIC_EXPECTED_REVISION,
            )
            return JSONResponse(
                status_code=503,
                content={"status": "not_ready"},
            )
        return {"status": "ready"}

    protected_api = APIRouter(prefix="/api", dependencies=[Depends(get_current_user)])

    @protected_api.get("/version")
    def version():
        return {
            "release_ref": settings.RELEASE_REF,
            "git_sha": settings.GIT_SHA,
            "backend_image_digest": settings.BACKEND_IMAGE_DIGEST,
            "frontend_image_digest": settings.FRONTEND_IMAGE_DIGEST,
            "schema_revision": settings.ALEMBIC_EXPECTED_REVISION,
        }

    app.include_router(auth_routes.router)
    protected_api.include_router(jogadores.router)
    protected_api.include_router(dias.router)
    protected_api.include_router(turmas.router)
    protected_api.include_router(partidas.router)
    protected_api.include_router(eventos.router)
    protected_api.include_router(usuarios.router)
    protected_api.include_router(dashboards_jogadores.router)
    protected_api.include_router(dashboards_partidas.router)
    protected_api.include_router(dashboards_estatisticas.router)
    app.include_router(protected_api)

    return app


app = create_app()
