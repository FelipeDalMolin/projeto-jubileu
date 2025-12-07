# app/models/jogador_turma.py
from __future__ import annotations

from typing import List

from sqlalchemy import String, Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Jogador(Base):
    __tablename__ = "jogadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    apelido: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="ativo")

    # relação N:N com Turma via TurmaJogador
    turmas_rel: Mapped[List["TurmaJogador"]] = relationship(
        "TurmaJogador",
        back_populates="jogador",
        cascade="all, delete-orphan",
    )


class Turma(Base):
    __tablename__ = "turmas"

    # IMPORTANTE: usar string para casar com o front (turmaId da Aula)
    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)

    jogadores_rel: Mapped[List["TurmaJogador"]] = relationship(
        "TurmaJogador",
        back_populates="turma",
        cascade="all, delete-orphan",
    )


class TurmaJogador(Base):
    __tablename__ = "turmas_jogadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    turma_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("turmas.id"),
        nullable=False,
    )
    jogador_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("jogadores.id"),
        nullable=False,
    )

    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    turma: Mapped["Turma"] = relationship("Turma", back_populates="jogadores_rel")
    jogador: Mapped["Jogador"] = relationship("Jogador", back_populates="turmas_rel")

    __table_args__ = (
        UniqueConstraint(
            "turma_id",
            "jogador_id",
            name="uq_turma_jogador",
        ),
    )
