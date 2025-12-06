from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


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

    id = Column(Integer, primary_key=True, index=True)
    # Ex: "2025-11-20"
    data_iso = Column(String, unique=True, index=True, nullable=False)

    # Campos simples de feriado (podemos refinar depois)
    feriado_nome = Column(String, nullable=True)
    feriado_tipo = Column(String, nullable=True)

    # Relação 1:N com Aula
    aulas = relationship(
        "Aula",
        back_populates="dia",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class Aula(Base):
    __tablename__ = "aulas"

    id = Column(Integer, primary_key=True, index=True)

    dia_id = Column(Integer, ForeignKey("dias.id"), nullable=False)
    turma_id = Column(String, nullable=False)
    turma_nome = Column(String, nullable=False)

    numero_aula_na_turma = Column(Integer, nullable=False, default=1)

    tipo = Column(
        Enum(TipoEventoAulaEnum),
        nullable=False,
        default=TipoEventoAulaEnum.AULA,
    )

    # Ex: "19:00"
    horario_inicio = Column(String, nullable=False)
    horario_fim = Column(String, nullable=False)

    status = Column(
        Enum(StatusAulaEnum),
        nullable=False,
        default=StatusAulaEnum.PLANEJADA,
    )

    dia = relationship("Dia", back_populates="aulas")

    # Relações 1:N dentro da aula
    times = relationship(
        "TimeAula",
        back_populates="aula",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    jogadores = relationship(
        "JogadorAula",
        back_populates="aula",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    partidas = relationship(
        "Partida",
        back_populates="aula",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class TimeAula(Base):
    __tablename__ = "times_aula"

    id = Column(Integer, primary_key=True, index=True)
    aula_id = Column(Integer, ForeignKey("aulas.id"), nullable=False)

    nome = Column(String, nullable=False)
    caracteristica = Column(String, nullable=True)
    cor_camisa = Column(String, nullable=True)

    aula = relationship("Aula", back_populates="times")
    jogadores = relationship(
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

    id = Column(Integer, primary_key=True, index=True)

    aula_id = Column(Integer, ForeignKey("aulas.id"), nullable=False)

    # opcionalmente apontamos pro Jogador global
    jogador_id = Column(Integer, ForeignKey("jogadores.id"), nullable=True)

    nome = Column(String, nullable=False)

    status = Column(
        Enum(StatusPresencaEnum),
        nullable=False,
        default=StatusPresencaEnum.so_treino,
    )

    # atributos acumulados na aula
    gols = Column(Integer, nullable=False, default=0)
    assistencias = Column(Integer, nullable=False, default=0)
    defesas = Column(Integer, nullable=False, default=0)
    chiliques = Column(Integer, nullable=False, default=0)
    faltas = Column(Integer, nullable=False, default=0)

    # time atual na aula (pode ser nulo)
    time_id = Column(Integer, ForeignKey("times_aula.id"), nullable=True)

    aula = relationship("Aula", back_populates="jogadores")
    time = relationship("TimeAula", back_populates="jogadores")


class Partida(Base):
    __tablename__ = "partidas"

    id = Column(Integer, primary_key=True, index=True)
    aula_id = Column(Integer, ForeignKey("aulas.id"), nullable=False)

    ordem = Column(Integer, nullable=False, default=1)

    time_a_id = Column(Integer, ForeignKey("times_aula.id"), nullable=False)
    time_b_id = Column(Integer, ForeignKey("times_aula.id"), nullable=False)

    gols_time_a = Column(Integer, nullable=False, default=0)
    gols_time_b = Column(Integer, nullable=False, default=0)

    aula = relationship("Aula", back_populates="partidas")
    estatisticas = relationship(
        "EstatisticaJogadorPartida",
        back_populates="partida",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class EstatisticaJogadorPartida(Base):
    __tablename__ = "estatisticas_jogador_partida"

    id = Column(Integer, primary_key=True, index=True)

    partida_id = Column(Integer, ForeignKey("partidas.id"), nullable=False)
    jogador_aula_id = Column(Integer, ForeignKey("jogadores_aula.id"), nullable=False)

    gols = Column(Integer, nullable=False, default=0)
    assistencias = Column(Integer, nullable=False, default=0)
    defesas = Column(Integer, nullable=False, default=0)
    chiliques = Column(Integer, nullable=False, default=0)
    faltas = Column(Integer, nullable=False, default=0)
    nota = Column(Integer, nullable=True)

    partida = relationship("Partida", back_populates="estatisticas")
    jogador_aula = relationship("JogadorAula")
