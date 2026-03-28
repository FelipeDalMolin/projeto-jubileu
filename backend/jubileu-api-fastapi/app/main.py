from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.auth import routes as auth_routes
from app.routers import jogadores, dias, turmas, partidas, eventos
from app.api.dashboards import jogadores as dashboards_jogadores
from app.api.dashboards import partidas as dashboards_partidas
from app.api.dashboards import estatisticas as dashboards_estatisticas

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
    )

    @app.get("/")
    def read_root():
        return {"status": "ok", "message": "Jubileu API rodando"}

    @app.get("/health")
    def health():
        return {"status": "ok"}

    # Legacy routes preserved for compatibility during the transition window.
    app.include_router(jogadores.router)
    app.include_router(dias.router)
    app.include_router(turmas.router)
    app.include_router(partidas.router)
    app.include_router(eventos.router)
    app.include_router(auth_routes.router)
    app.include_router(dashboards_jogadores.router)
    app.include_router(dashboards_partidas.router)
    app.include_router(dashboards_estatisticas.router)

    # Standardized /api exposure aliases (compatibility-first, non-breaking).
    app.include_router(jogadores.router, prefix="/api")
    app.include_router(dias.router, prefix="/api")
    app.include_router(turmas.router, prefix="/api")
    app.include_router(partidas.router, prefix="/api")
    app.include_router(dashboards_jogadores.router, prefix="/api")
    app.include_router(dashboards_partidas.router, prefix="/api")
    app.include_router(dashboards_estatisticas.router, prefix="/api")

    return app


app = create_app()
