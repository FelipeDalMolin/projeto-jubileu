from __future__ import annotations

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or not DATABASE_URL.strip():
    raise RuntimeError(
        "DATABASE_URL não definido. Configure ex: "
        "postgresql+psycopg2://user:pass@localhost:5432/jubileu_dev"
    )

# Postgres obrigatório (sem sqlite)
if DATABASE_URL.startswith("sqlite"):
    raise RuntimeError(
        "SQLite não é suportado neste projeto. Use Postgres em DATABASE_URL."
    )

engine = create_engine(DATABASE_URL, future=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

Base = declarative_base()
