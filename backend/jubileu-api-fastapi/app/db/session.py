from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


DATABASE_URL = settings.DATABASE_URL

if not DATABASE_URL or not DATABASE_URL.strip():
    raise RuntimeError(
        "DATABASE_URL nao definido. Exemplo esperado:\n"
        "postgresql+psycopg://user:pass@localhost:5432/jubileu"
    )

if DATABASE_URL.startswith("sqlite"):
    raise RuntimeError(
        "SQLite nao e suportado neste projeto. "
        "Use PostgreSQL via psycopg (postgresql+psycopg://)."
    )

engine = create_engine(
    DATABASE_URL,
    future=True,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    future=True,
)
