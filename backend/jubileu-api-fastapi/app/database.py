"""
Compatibility bridge for legacy imports.

Slice 01 introduces app.db.*, but existing modules still import from app.database.
Keep this module as a stable re-export surface until later slices migrate imports.
"""

from app.db.base import Base
from app.db.session import DATABASE_URL, SessionLocal, engine

__all__ = ["Base", "DATABASE_URL", "SessionLocal", "engine"]
