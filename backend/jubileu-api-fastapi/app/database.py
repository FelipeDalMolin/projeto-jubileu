from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Exemplo:
#   sqlite:  DATABASE_URL=sqlite:///./jubileu_dev.db
#   postgres: DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/jubileu_dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./jubileu_dev.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
