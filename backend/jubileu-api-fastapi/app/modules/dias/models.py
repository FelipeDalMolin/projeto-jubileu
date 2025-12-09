from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.modules.aulas.models import Aula

class Dia(Base):
    __tablename__ = "dias"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    data: Mapped[date] = mapped_column(Date, unique=True, nullable=False)

    observacoes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    treino_cancelado: Mapped[bool] = mapped_column(Boolean, default=False)

    aulas: Mapped[List["Aula"]] = relationship(
        back_populates="dia",
        cascade="all, delete-orphan",
    )
