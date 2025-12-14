from __future__ import annotations

import enum
from typing import List, Optional

from sqlalchemy import Integer, String, Enum as SAEnum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.jogador_turma import Turma


# -------- ENUMS --------


class StatusAulaEnum(str, enum.Enum):
    PLANEJADA = "PLANEJADA"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"


class TipoEventoAulaEnum(str, enum.Enum):
    AULA = "AULA"
    JOGO = "JOGO"
    OUTRO = "OUTRO"


class StatusPresencaEnum(str, enum.Enum):
    presente = "presente"
    faltou = "faltou"
    atestado = "atestado"
    coringa = "coringa"
    so_treino = "so_treino"


# -------- MODELOS --------


class Dia(Base):
    __tablename__ = "dias"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Ex: "2025-11-20"
    data_iso: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False
    )

    # Campos simples de feriado (podemos refinar depois)
    feriado_nome: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    feriado_tipo: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relação 1:N com Aula
    aulas: Mapped[List["Aula"]] = relationship(
        "Aula",
        back_populates="dia",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class Aula(Base):
    __tablename__ = "aulas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    dia_id: Mapped[int] = mapped_column(ForeignKey("dias.id"), nullable=False)
    turma_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("turmas.id"), nullable=False
    )
    turma_nome: Mapped[str] = mapped_column(String, nullable=False)

    numero_aula_na_turma: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )

    tipo: Mapped[TipoEventoAulaEnum] = mapped_column(
        SAEnum(TipoEventoAulaEnum),
        nullable=False,
        default=TipoEventoAulaEnum.AULA,
    )

    # Ex: "19:00"
    horario_inicio: Mapped[str] = mapped_column(String, nullable=False)
    horario_fim: Mapped[str] = mapped_column(String, nullable=False)

    status: Mapped[StatusAulaEnum] = mapped_column(
        SAEnum(StatusAulaEnum),
        nullable=False,
        default=StatusAulaEnum.PLANEJADA,
    )

    # -------- RELACIONAMENTOS --------

    dia: Mapped["Dia"] = relationship("Dia", back_populates="aulas")
    turma: Mapped["Turma"] = relationship("Turma")

    estado_equipes: Mapped[Optional["AulaEquipesEstado"]] = relationship(
        "AulaEquipesEstado",
        back_populates="aula",
        uselist=False,
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


class AulaEquipesEstado(Base):
    # ATENÇÃO: o nome da tabela precisa bater com o que o Alembic criou.
    # Se o autogenerate criou "aula_equipes_estado", mantenha esse nome.
    __tablename__ = "aula_equipes_estado"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    aula_id: Mapped[int] = mapped_column(
        ForeignKey("aulas.id"), unique=True, nullable=False
    )
    # JSON com snapshot: { jogadores: [...], times: [...] }
    estado: Mapped[dict] = mapped_column(JSON, nullable=False)

    aula: Mapped["Aula"] = relationship(
        "Aula",
        back_populates="estado_equipes",
    )


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
    """
    Snapshot do jogador dentro da aula:
    - vínculo com Jogador 'global' (FK opcional por enquanto)
    - nome no dia
    - status de presença
    - atributos acumulados na aula
    """

    __tablename__ = "jogadores_aula"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id"), nullable=False)

    # opcionalmente apontamos pro Jogador global
    jogador_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("jogadores.id"), nullable=True
    )

    nome: Mapped[str] = mapped_column(String, nullable=False)

    status: Mapped[StatusPresencaEnum] = mapped_column(
        SAEnum(StatusPresencaEnum),
        nullable=False,
        default=StatusPresencaEnum.so_treino,
    )

    # atributos acumulados na aula
    gols: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assistencias: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    defesas: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chiliques: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    faltas: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # time atual na aula (pode ser nulo)
    time_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("times_aula.id"), nullable=True
    )

    aula: Mapped["Aula"] = relationship("Aula", back_populates="jogadores")
    time: Mapped[Optional["TimeAula"]] = relationship(
        "TimeAula", back_populates="jogadores"
    )


class Partida(Base):
    __tablename__ = "partidas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id"), nullable=False)

    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    time_a_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("times_aula.id"), nullable=False
    )
    time_b_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("times_aula.id"), nullable=False
    )

    gols_time_a: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    gols_time_b: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    aula: Mapped["Aula"] = relationship("Aula", back_populates="partidas")
    estatisticas: Mapped[List["EstatisticaJogadorPartida"]] = relationship(
        "EstatisticaJogadorPartida",
        back_populates="partida",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class EstatisticaJogadorPartida(Base):
    __tablename__ = "estatisticas_jogador_partida"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    partida_id: Mapped[int] = mapped_column(
        ForeignKey("partidas.id"), nullable=False
    )
    jogador_aula_id: Mapped[int] = mapped_column(
        ForeignKey("jogadores_aula.id"), nullable=False
    )

    gols: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assistencias: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    defesas: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chiliques: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    faltas: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nota: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    partida: Mapped["Partida"] = relationship("Partida", back_populates="estatisticas")
    jogador_aula: Mapped["JogadorAula"] = relationship("JogadorAula")
