# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import jogadores, dias, turmas


app = FastAPI(
    title="Jubileu API",
    version="0.1.0",
)

@app.get("/")
def root():
    return {"message": "Jubileu API up!"}
