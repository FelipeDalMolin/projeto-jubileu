from __future__ import annotations

from datetime import time
from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import String, Boolean, Integer, Time, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.modules.jogadores.models import Jogador
    from app.modules.aulas.models import Aula


class Turma(Base):
    __tablename__ = "turmas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    categoria: Mapped[str] = mapped_column(String(50), nullable=False)  # ex.: "Adulto", "Sub-11"

    # Opcional: dia padrão da turma (futuro: recorrência)
    dia_semana: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 0=segunda ... 6=domingo
    horario_inicio: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    horario_fim: Mapped[Optional[time]] = mapped_column(Time, nullable=True)

    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    participantes: Mapped[List["TurmaParticipante"]] = relationship(
        back_populates="turma",
        cascade="all, delete-orphan",
    )
    
    aulas: Mapped[List["Aula"]] = relationship(
        back_populates="turma",
        cascade="all, delete-orphan",
    )


class TurmaParticipante(Base):
    __tablename__ = "turma_participantes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    turma_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("turmas.id", ondelete="CASCADE"),
        nullable=False,
    )

    jogador_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("jogadores.id", ondelete="CASCADE"),
        nullable=False,
    )

    # papel dentro da turma: aluno, professor, assistente
    papel: Mapped[str] = mapped_column(String(20), default="aluno")

    # se ele entra como jogador nas partidas dessa turma
    pode_jogar: Mapped[bool] = mapped_column(Boolean, default=True)

    # se está atualmente vinculado à turma
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    turma: Mapped["Turma"] = relationship(back_populates="participantes")
    jogador: Mapped["Jogador"] = relationship(back_populates="turmas_participacoes")
