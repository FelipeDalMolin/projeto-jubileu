from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.dia_evento import EventoParticipanteStatusEnum, PartidaStatusEnum, RotacaoSorteioStatusEnum


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
    jogador_id: int
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
    jogador_nome: Optional[str] = None
    time_id: Optional[int] = None
    time_nome: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LanceCreateOut(BaseModel):
    lance: LanceOut


class LanceListOut(BaseModel):
    items: list[LanceOut] = Field(default_factory=list)


class RotacaoIndicadoresOut(BaseModel):
    jogadores_em_campo: int = 0
    jogadores_na_fila: int = 0
    proximos_times_completos: int = 0
    jogadores_aguardando_complemento: int = 0


class RotacaoGrupoOut(BaseModel):
    grupo_id: str
    jogadores_ids: list[int] = Field(default_factory=list)
    target_size: int
    faltam: int
    completo: bool


class RotacaoEstadoOut(BaseModel):
    evento_id: int
    team_size_ref: int
    duracao_partida_segundos: int
    fila_jogadores_ids: list[int] = Field(default_factory=list)
    proximos_times: list[RotacaoGrupoOut] = Field(default_factory=list)
    indicadores: RotacaoIndicadoresOut
    version: int
    updated_at: datetime | None = None
    updated_by_user_id: str | None = None


class RotacaoGrupoPatchIn(BaseModel):
    grupo_id: str
    jogadores_ids: list[int] = Field(default_factory=list)


class RotacaoEstadoUpdateIn(BaseModel):
    team_size_ref: int | None = Field(default=None, gt=0, le=50)
    duracao_partida_segundos: int | None = Field(default=None, ge=60, le=7200)
    fila_jogadores_ids: list[int] | None = None
    proximos_times: list[RotacaoGrupoPatchIn] | None = None
    expected_version: int | None = None


class RotacaoPreviewIn(BaseModel):
    grupo_alvo_id: str
    partida_origem_id: int | None = None


class RotacaoPreviewOut(BaseModel):
    token: str
    evento_id: int
    grupo_alvo_id: str
    needed_count: int
    candidatos_ids: list[int] = Field(default_factory=list)
    sorteados_ids: list[int] = Field(default_factory=list)
    nao_sorteados_ids: list[int] = Field(default_factory=list)
    expires_at: datetime


class RotacaoConfirmIn(BaseModel):
    token: str


class RotacaoAuditRecordOut(BaseModel):
    token: str
    status: RotacaoSorteioStatusEnum
    grupo_alvo_id: str
    needed_count: int
    candidatos_ids: list[int] = Field(default_factory=list)
    sorteados_ids: list[int] = Field(default_factory=list)
    nao_sorteados_ids: list[int] = Field(default_factory=list)
    partida_origem_id: int | None = None
    created_by_user_id: str | None = None
    created_at: datetime
    confirmed_at: datetime | None = None
    expires_at: datetime


class RotacaoConfirmOut(BaseModel):
    estado: RotacaoEstadoOut
    audit: RotacaoAuditRecordOut
