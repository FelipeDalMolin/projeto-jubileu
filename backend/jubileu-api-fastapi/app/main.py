from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import jogadores, dias, turmas

app = FastAPI(
    title="Jubileu API",
    version="0.1.0",
)

ALLOWED_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Jubileu API rodando"}


app.include_router(jogadores.router)
app.include_router(dias.router)
app.include_router(turmas.router)
