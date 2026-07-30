import time
from uuid import uuid4

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import engine
from app.observability import (
    accepted_request_id,
    configure_json_logging,
    configure_opentelemetry,
    current_trace_ids,
    error_class,
    normalized_route,
    reset_probe_context,
    set_probe_context,
    should_log_request,
    suppress_automatic_instrumentation,
)
from app.modules.auth import routes as auth_routes
from app.modules.auth.deps import get_current_user
from app.routers import jogadores, dias, turmas, partidas, eventos, usuarios
from app.api.dashboards import jogadores as dashboards_jogadores
from app.api.dashboards import partidas as dashboards_partidas
from app.api.dashboards import estatisticas as dashboards_estatisticas

logger = configure_json_logging()


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
        request_id = accepted_request_id(request.headers.get("X-Request-ID")) or str(uuid4())
        request.state.request_id = request_id
        probe_context = set_probe_context(request.url.path)
        started_at = time.perf_counter()
        status_code = 500
        exception_name = None

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as exc:
            exception_name = type(exc).__name__
            # Do not let request exceptions reach Uvicorn's default traceback
            # logger: SQL drivers may include statements/parameters or domain
            # values in exception messages. The structured request log below
            # keeps only the exception class and correlation identifiers.
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error"},
            )
            return response
        finally:
            try:
                duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
                if "response" in locals():
                    response.headers["X-Request-ID"] = request_id
                route = normalized_route(request.scope)
                if should_log_request(route, status_code):
                    trace_id, span_id = current_trace_ids()
                    logger.info(
                        "request_completed",
                        extra={
                            "event": "request_completed",
                            "request_id": request_id,
                            "trace_id": trace_id,
                            "span_id": span_id,
                            "method": request.method,
                            "route": route,
                            "status_code": status_code,
                            "duration_ms": duration_ms,
                            "error_class": error_class(status_code, exception_name),
                            "service_version": settings.RELEASE_REF,
                            "deployment_environment": settings.APP_ENV,
                        },
                    )
            finally:
                reset_probe_context(probe_context)

    @app.get("/health")
    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.get("/api/ready")
    def readiness():
        try:
            with suppress_automatic_instrumentation():
                with engine.connect() as connection:
                    revision = connection.execute(
                        text("SELECT version_num FROM alembic_version")
                    ).scalar_one()
        except Exception as exc:
            logger.error(
                "readiness_failed",
                extra={
                    "event": "readiness_failed",
                    "error_class": type(exc).__name__,
                    "service_version": settings.RELEASE_REF,
                    "deployment_environment": settings.APP_ENV,
                },
            )
            return JSONResponse(status_code=503, content={"status": "not_ready"})

        if revision != settings.ALEMBIC_EXPECTED_REVISION:
            logger.error(
                "readiness_schema_mismatch",
                extra={
                    "event": "readiness_schema_mismatch",
                    "error_class": "schema_revision_mismatch",
                    "service_version": settings.RELEASE_REF,
                    "deployment_environment": settings.APP_ENV,
                },
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

    configure_opentelemetry(app, engine=engine, settings=settings)
    return app


app = create_app()
