from __future__ import annotations

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Carrega variáveis do .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or not DATABASE_URL.strip():
    raise RuntimeError(
        "DATABASE_URL não definido. Exemplo esperado:\n"
        "postgresql+psycopg://user:pass@localhost:5432/jubileu"
    )

# Garante que não use SQLite
if DATABASE_URL.startswith("sqlite"):
    raise RuntimeError(
        "SQLite não é suportado neste projeto. "
        "Use PostgreSQL via psycopg (postgresql+psycopg://)."
    )

# Criação do engine (SQLAlchemy 2.x + psycopg v3)
engine = create_engine(
    DATABASE_URL,
    future=True,
    pool_pre_ping=True,   # evita conexões mortas
)

# Session factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    future=True,
)

# Base declarativa
Base = declarative_base()
