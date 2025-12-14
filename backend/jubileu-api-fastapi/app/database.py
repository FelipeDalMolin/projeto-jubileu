# app/database.py
from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL não definida.\n"
        "➡️ Defina DATABASE_URL no seu ambiente (.env, variáveis do sistema, Docker, etc).\n\n"
        "Exemplos:\n"
        "  Postgres (local): DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/jubileu_dev\n"
        "  Postgres (docker compose): DATABASE_URL=postgresql+psycopg2://postgres:postgres@jubileu-postgres:5432/jubileu_dev\n"
    )

# Garante que você não está rodando em sqlite sem querer (e dá erro explícito)
if DATABASE_URL.strip().lower().startswith("sqlite"):
    raise RuntimeError(
        "DATABASE_URL aponta para SQLite, mas este projeto NÃO suporta SQLite.\n"
        f"Valor atual: {DATABASE_URL}\n"
        "➡️ Use Postgres com postgresql+psycopg2://..."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # evita conexões mortas
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()
