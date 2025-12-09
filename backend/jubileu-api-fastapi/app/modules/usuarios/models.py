from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.modules.jogadores.models import Jogador


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    papel: Mapped[str] = mapped_column(String(20), default="aluno")
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    jogador_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("jogadores.id"),
        nullable=True,
    )

    jogador: Mapped[Optional["Jogador"]] = relationship(
        back_populates="usuario",
    )
