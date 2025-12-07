# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import dias, turmas, jogadores

# Cria as tabelas (para SQLite em dev) – em prod a gente usa só alembic
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Jubileu API")

# CORS para o front em localhost:5173
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(dias.router)
app.include_router(turmas.router)
app.include_router(jogadores.router)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Jubileu API rodando"}
