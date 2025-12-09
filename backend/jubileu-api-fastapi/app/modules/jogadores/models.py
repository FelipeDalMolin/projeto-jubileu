from __future__ import annotations

from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.modules.usuarios.models import Usuario
    from app.modules.turmas.models import TurmaParticipante


class Jogador(Base):
    __tablename__ = "jogadores"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    idade: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    usuario: Mapped[Optional["Usuario"]] = relationship(
        back_populates="jogador",
        uselist=False,
    )

    turmas_participacoes: Mapped[List["TurmaParticipante"]] = relationship(
        back_populates="jogador",
        cascade="all, delete-orphan",
    )
