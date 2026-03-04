from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.dia_aula import EventoParticipanteStatusEnum, PartidaStatusEnum


EventoTipoCanonical = Literal["AULA", "JOGO_LIVRE"]
EventoStatusCanonical = Literal["PLANEJADO", "EM_ANDAMENTO", "ENCERRADO", "CANCELADO"]


class EventoOut(BaseModel):
    id: int
    dia_id: int
    tipo: EventoTipoCanonical
    status: EventoStatusCanonical
    horario_inicio: str
    horario_fim: str
    inicio_at: Optional[datetime] = None
    fim_at: Optional[datetime] = None


class EventoParticipanteOut(BaseModel):
    id: int
    evento_id: int
    jogador_id: int
    status: EventoParticipanteStatusEnum
    rsvp_at: Optional[datetime] = None
    checkin_at: Optional[datetime] = None
    checkout_at: Optional[datetime] = None
    arrival_seq: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class EventoParticipantesListOut(BaseModel):
    items: list[EventoParticipanteOut] = Field(default_factory=list)


class EventoActionOut(BaseModel):
    evento: EventoOut
    summary: Optional[dict[str, Any]] = None


class SeedPartidaIn(BaseModel):
    mode: Literal["arrival_first"] = "arrival_first"
    players_count: int = Field(..., gt=1)
    team_size: int = Field(..., gt=0)


class TimeSeedOut(BaseModel):
    id: int
    nome: str
    jogadores_ids: list[int] = Field(default_factory=list)


class PartidaSeedOut(BaseModel):
    id: int
    evento_id: int
    ordem: int
    status: PartidaStatusEnum
    time_a_id: int
    time_b_id: int


class SeedPartidaOut(BaseModel):
    partida: PartidaSeedOut
    teams: list[TimeSeedOut]


class LanceCreateIn(BaseModel):
    tipo: str
    payload: dict[str, Any] = Field(default_factory=dict)
    jogador_id: Optional[int] = None
    client_event_id: Optional[str] = None


class LanceOut(BaseModel):
    id: int
    partida_id: int
    evento_id: int
    jogador_id: Optional[int] = None
    tipo: str
    payload: dict[str, Any]
    client_event_id: Optional[str] = None
    created_by_user_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LanceCreateOut(BaseModel):
    lance: LanceOut
