from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.dia_evento import (
    StatusEventoEnum,
    TipoEventoEnum,
    StatusPresencaEnum,
    PartidaStatusEnum,
)


# ---------------------------------------------------------
# ATRIBUTOS / JOGADORES / TIMES (para SNAPSHOT da evento)
# ---------------------------------------------------------


class AtributosJogadorDia(BaseModel):
    gols: int = 0
    assistencias: int = 0
    chiliques: int = 0
    faltas: int = 0


class PresencaJogadorDiaOut(BaseModel):
    """
    Snapshot do jogador dentro da evento (nao e o Jogador global).
    """

    jogadorId: int
    nome: str
    status: StatusPresencaEnum
    atributos: AtributosJogadorDia
    # id logico do time dentro da evento (ex.: "time-1")
    timeId: Optional[str] = None


class TimeEventoOut(BaseModel):
    """Snapshot de um time dentro da AULA, no formato que o front usa."""

    id: str  # "time-1", "time-2"...
    nome: str  # "Time 1", "Time Azul"...
    jogadoresIds: List[int]
    caracteristica: Optional[str] = None
    corCamisa: Optional[str] = None


class TimeEventoCreate(BaseModel):
    """
    DTO de entrada para criar um time no banco (model TimeEvento).
    """

    nome: str
    caracteristica: Optional[str] = None
    cor_camisa: Optional[str] = None


class MoverJogadorTimeIn(BaseModel):
    time_id: Optional[int] = None


class AtualizarStatusJogadorIn(BaseModel):
    status: StatusPresencaEnum


class CommandOkOut(BaseModel):
    status: str = "ok"
    version: Optional[int] = None


class ConfirmarPresencasIn(BaseModel):
    presentes_ids: List[int] = Field(default_factory=list)


# ---------------------------------------------------------
# ESTADO DE EQUIPES / SNAPSHOT
# ---------------------------------------------------------


class EstadoEquipesEventoIn(BaseModel):
    """
    Payload que o front envia para salvar o estado de equipes da evento.
    """

    jogadores: List[PresencaJogadorDiaOut] = Field(default_factory=list)
    times: List[TimeEventoOut] = Field(default_factory=list)


class EstadoEquipesEventoOut(EstadoEquipesEventoIn):
    """Resposta do backend com o estado de equipes + id da evento."""

    evento_id: int


# ---------------------------------------------------------
# PARTIDA / ESTATISTICAS
# ---------------------------------------------------------


class EstatisticaJogadorPartidaBase(BaseModel):
    jogador_evento_id: int
    gols: int = Field(0, ge=0)
    assistencias: int = Field(0, ge=0)
    chiliques: int = Field(0, ge=0)
    faltas: int = Field(0, ge=0)
    nota: Optional[int] = None


class EstatisticaJogadorPartidaOut(EstatisticaJogadorPartidaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class PartidaCreate(BaseModel):
    ordem: Optional[int] = None
    time_a_id: int = Field(alias="timeAId")
    time_b_id: int = Field(alias="timeBId")
    estatisticas: List[EstatisticaJogadorPartidaBase] = Field(
        default_factory=list
    )

    model_config = ConfigDict(populate_by_name=True)


class PartidaUpdate(BaseModel):
    ordem: Optional[int] = None
    time_a_id: Optional[int] = Field(default=None, alias="timeAId")
    time_b_id: Optional[int] = Field(default=None, alias="timeBId")
    estatisticas: Optional[List[EstatisticaJogadorPartidaBase]] = None

    model_config = ConfigDict(populate_by_name=True)


class PartidaOut(BaseModel):
    id: int
    evento_id: int
    status: PartidaStatusEnum = PartidaStatusEnum.PLANEJADA
    ordem: int
    time_a_id: int
    time_b_id: int
    gols_time_a: int
    gols_time_b: int
    estatisticas: List[EstatisticaJogadorPartidaOut] = Field(
        default_factory=list
    )

    model_config = ConfigDict(from_attributes=True)


class PartidaEstadoOut(BaseModel):
    id: int
    ordem: int
    status: PartidaStatusEnum = PartidaStatusEnum.PLANEJADA
    inicio_at: Optional[datetime] = None
    fim_at: Optional[datetime] = None
    timeAId: str
    timeBId: str
    golsTimeA: int
    golsTimeB: int
    estatisticas: Optional[List[EstatisticaJogadorPartidaOut]] = None


class StatsJogadorIn(BaseModel):
    gols: int = Field(0, ge=0)
    assistencias: int = Field(0, ge=0)
    chiliques: int = Field(0, ge=0)
    faltas: int = Field(0, ge=0)


class EquipesEstadoOut(BaseModel):
    jogadores: List[PresencaJogadorDiaOut] = Field(default_factory=list)
    times: List[TimeEventoOut] = Field(default_factory=list)


class EventoEstadoOut(BaseModel):
    evento_id: int
    data_iso: str
    version: int
    updated_at: datetime
    equipes: EquipesEstadoOut
    partidas: List[PartidaEstadoOut] = Field(default_factory=list)


# ---------------------------------------------------------
# AULA (IN / OUT)
# ---------------------------------------------------------


class EventoBase(BaseModel):
    turma_id: Optional[int] = None
    tipo: TipoEventoEnum = TipoEventoEnum.AULA
    horario_inicio: str  # "19:00"
    horario_fim: str  # "20:00"
    status: StatusEventoEnum = StatusEventoEnum.PLANEJADO


class EventoCreate(EventoBase):
    """DTO de entrada para criar uma nova evento em um dia."""

    # turma_nome opcional (sera sobrescrito pelo nome da turma no backend)
    turma_nome: Optional[str] = None
    numero_evento_na_turma: Optional[int] = None


class JogadorEventoOut(BaseModel):
    id: int
    jogador_id: Optional[int] = None
    nome: str
    status: StatusPresencaEnum
    time_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class EventoDiaOut(EventoBase):
    """
    Representacao da Evento retornada pelos endpoints:
    - GET /dias/{data_iso}
    - GET /dias/{data_iso}/eventos/{evento_id}
    """

    id: int
    dia_id: int
    turma_nome: Optional[str] = None
    numero_evento_na_turma: Optional[int] = None
    jogadores: List[JogadorEventoOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# DIA (OUT)
# ---------------------------------------------------------


class DiaOut(BaseModel):
    """Representacao de um dia com suas eventos."""

    id: int
    data_iso: str
    feriado_nome: Optional[str] = None
    feriado_tipo: Optional[str] = None
    eventos: List[EventoDiaOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class DiaListOut(BaseModel):
    """Representacao leve de um dia (sem eventos)."""

    id: int
    data_iso: str
    feriado_nome: Optional[str] = None
    feriado_tipo: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
