from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import jogadores, dias
from app import models  # importa para registrar todos os modelos


# Cria as tabelas (para DEV; em PROD vamos usar Alembic depois)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Jubileu API", version="0.1.0")

origins = [
    "http://localhost:5173",  # Vite dev
    "https://jubileu-web.vercel.app",  # ajustar depois se necessário
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Routers
app.include_router(jogadores.router)
app.include_router(dias.router)


@app.get("/health")
def health():
    return {"status": "ok"}
