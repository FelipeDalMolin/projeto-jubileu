from __future__ import annotations

from datetime import time
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    String,
    Boolean,
    Integer,
    Time,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.modules.dias.models import Dia
    from app.modules.turmas.models import Turma


class Aula(Base):
    __tablename__ = "aulas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    dia_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("dias.id", ondelete="CASCADE"),
        nullable=False,
    )

    turma_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("turmas.id", ondelete="CASCADE"),
        nullable=False,
    )

    titulo: Mapped[str] = mapped_column(
        String(120),
        default="Aula",
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="planejada",  # planejada / em_andamento / concluida / cancelada
    )

    horario_inicio: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    horario_fim: Mapped[Optional[time]] = mapped_column(Time, nullable=True)

    observacoes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    dia: Mapped["Dia"] = relationship(back_populates="aulas")
    turma: Mapped["Turma"] = relationship(back_populates="aulas")
