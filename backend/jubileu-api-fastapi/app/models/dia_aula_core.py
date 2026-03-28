from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.dia_aula_enums import StatusAulaEnum, StatusPresencaEnum, TipoEventoAulaEnum
from app.models.jogador_turma import Turma


class Dia(Base):
    __tablename__ = "dias"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    data_iso: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    feriado_nome: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    feriado_tipo: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    aulas: Mapped[List["Aula"]] = relationship(
        "Aula",
        back_populates="dia",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Aula(Base):
    __tablename__ = "aulas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    dia_id: Mapped[int] = mapped_column(ForeignKey("dias.id"), nullable=False)
    turma_id: Mapped[int] = mapped_column(Integer, ForeignKey("turmas.id"), nullable=False)
    turma_nome: Mapped[str] = mapped_column(String, nullable=False)
    numero_aula_na_turma: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo: Mapped[TipoEventoAulaEnum] = mapped_column(
        SAEnum(TipoEventoAulaEnum),
        nullable=False,
        default=TipoEventoAulaEnum.AULA,
    )
    horario_inicio: Mapped[str] = mapped_column(String, nullable=False)
    horario_fim: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[StatusAulaEnum] = mapped_column(
        SAEnum(StatusAulaEnum),
        nullable=False,
        default=StatusAulaEnum.PLANEJADA,
    )

    dia: Mapped["Dia"] = relationship("Dia", back_populates="aulas")
    turma: Mapped["Turma"] = relationship("Turma")
    estado_equipes: Mapped[Optional["AulaEquipesEstado"]] = relationship(
        "AulaEquipesEstado",
        back_populates="aula",
        uselist=False,
    )
    team_configs: Mapped[List["TeamConfig"]] = relationship(
        "TeamConfig",
        back_populates="aula",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    times: Mapped[List["TimeAula"]] = relationship(
        "TimeAula",
        back_populates="aula",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    jogadores: Mapped[List["JogadorAula"]] = relationship(
        "JogadorAula",
        back_populates="aula",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    partidas: Mapped[List["Partida"]] = relationship(
        "Partida",
        back_populates="aula",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    participantes: Mapped[List["EventoParticipante"]] = relationship(
        "EventoParticipante",
        back_populates="aula",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    lances: Mapped[List["Lance"]] = relationship(
        "Lance",
        back_populates="aula",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class AulaEquipesEstado(Base):
    __tablename__ = "aula_equipes_estado"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id"), unique=True, nullable=False)
    estado: Mapped[dict] = mapped_column(JSON, nullable=False)
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    aula: Mapped["Aula"] = relationship("Aula", back_populates="estado_equipes")


class TeamConfig(Base):
    __tablename__ = "team_configs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id"), nullable=False, index=True)
    estado: Mapped[dict] = mapped_column(JSON, nullable=False)
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    aula: Mapped["Aula"] = relationship("Aula", back_populates="team_configs")


class TimeAula(Base):
    __tablename__ = "times_aula"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    caracteristica: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cor_camisa: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    aula: Mapped["Aula"] = relationship("Aula", back_populates="times")
    jogadores: Mapped[List["JogadorAula"]] = relationship(
        "JogadorAula",
        back_populates="time",
        lazy="selectin",
    )


class JogadorAula(Base):
    __tablename__ = "jogadores_aula"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id"), nullable=False)
    jogador_id: Mapped[Optional[int]] = mapped_column(ForeignKey("jogadores.id"), nullable=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[StatusPresencaEnum] = mapped_column(
        SAEnum(StatusPresencaEnum),
        nullable=False,
        default=StatusPresencaEnum.so_treino,
    )
    gols: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assistencias: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chiliques: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    faltas: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    time_id: Mapped[Optional[int]] = mapped_column(ForeignKey("times_aula.id"), nullable=True)

    aula: Mapped["Aula"] = relationship("Aula", back_populates="jogadores")
    time: Mapped[Optional["TimeAula"]] = relationship("TimeAula", back_populates="jogadores")
