from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.dia_evento_enums import StatusEventoEnum, StatusPresencaEnum, TipoEventoEnum
from app.models.jogador_turma import Turma


class Dia(Base):
    __tablename__ = "dias"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    data_iso: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    feriado_nome: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    feriado_tipo: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    eventos: Mapped[List["Evento"]] = relationship(
        "Evento",
        back_populates="dia",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Evento(Base):
    __tablename__ = "eventos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    dia_id: Mapped[int] = mapped_column(ForeignKey("dias.id"), nullable=False)
    turma_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("turmas.id"), nullable=True)
    turma_nome: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    numero_evento_na_turma: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tipo: Mapped[TipoEventoEnum] = mapped_column(
        SAEnum(TipoEventoEnum),
        nullable=False,
        default=TipoEventoEnum.AULA,
    )
    horario_inicio: Mapped[str] = mapped_column(String, nullable=False)
    horario_fim: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[StatusEventoEnum] = mapped_column(
        SAEnum(StatusEventoEnum),
        nullable=False,
        default=StatusEventoEnum.PLANEJADO,
    )

    dia: Mapped["Dia"] = relationship("Dia", back_populates="eventos")
    turma: Mapped[Optional["Turma"]] = relationship("Turma")
    estado_equipes: Mapped[Optional["EventoEquipesEstado"]] = relationship(
        "EventoEquipesEstado",
        back_populates="evento",
        uselist=False,
    )
    team_configs: Mapped[List["TeamConfig"]] = relationship(
        "TeamConfig",
        back_populates="evento",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    times: Mapped[List["TimeEvento"]] = relationship(
        "TimeEvento",
        back_populates="evento",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    jogadores: Mapped[List["JogadorEvento"]] = relationship(
        "JogadorEvento",
        back_populates="evento",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    partidas: Mapped[List["Partida"]] = relationship(
        "Partida",
        back_populates="evento",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    participantes: Mapped[List["EventoParticipante"]] = relationship(
        "EventoParticipante",
        back_populates="evento",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    lances: Mapped[List["Lance"]] = relationship(
        "Lance",
        back_populates="evento",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    rotacao_estado: Mapped[Optional["EventoRotacaoEstado"]] = relationship(
        "EventoRotacaoEstado",
        back_populates="evento",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    rotacao_sorteios: Mapped[List["EventoRotacaoSorteio"]] = relationship(
        "EventoRotacaoSorteio",
        back_populates="evento",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class EventoEquipesEstado(Base):
    __tablename__ = "evento_equipes_estado"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    evento_id: Mapped[int] = mapped_column(ForeignKey("eventos.id"), unique=True, nullable=False)
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

    evento: Mapped["Evento"] = relationship("Evento", back_populates="estado_equipes")


class TeamConfig(Base):
    __tablename__ = "team_configs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    evento_id: Mapped[int] = mapped_column(ForeignKey("eventos.id"), nullable=False, index=True)
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

    evento: Mapped["Evento"] = relationship("Evento", back_populates="team_configs")


class TimeEvento(Base):
    __tablename__ = "times_evento"
    __table_args__ = (UniqueConstraint("evento_id", "nome", name="uq_times_evento_evento_nome"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    evento_id: Mapped[int] = mapped_column(ForeignKey("eventos.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    caracteristica: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cor_camisa: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    evento: Mapped["Evento"] = relationship("Evento", back_populates="times")
    jogadores: Mapped[List["JogadorEvento"]] = relationship(
        "JogadorEvento",
        back_populates="time",
        lazy="selectin",
    )


class JogadorEvento(Base):
    __tablename__ = "jogadores_evento"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    evento_id: Mapped[int] = mapped_column(ForeignKey("eventos.id"), nullable=False)
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
    time_id: Mapped[Optional[int]] = mapped_column(ForeignKey("times_evento.id"), nullable=True)

    evento: Mapped["Evento"] = relationship("Evento", back_populates="jogadores")
    time: Mapped[Optional["TimeEvento"]] = relationship("TimeEvento", back_populates="jogadores")
