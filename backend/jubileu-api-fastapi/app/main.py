from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import jogadores, dias, turmas

app = FastAPI(
    title="Jubileu API",
    version="0.1.0",
)

origins=[
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


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Jubileu API rodando"}


app.include_router(jogadores.router, prefix="/jogadores", tags=["Jogadores"])
# o router de dias já tem prefix="/dias" lá dentro
app.include_router(dias.router)
app.include_router(turmas.router, prefix="/turmas", tags=["Turmas"])
