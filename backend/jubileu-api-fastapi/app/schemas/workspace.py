from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field

from app.models.dia_evento import StatusEventoEnum, TipoEventoEnum
from app.schemas.dia_evento import PartidaEstadoOut, PresencaJogadorDiaOut, TimeEventoOut


class WorkspaceEventoMetaOut(BaseModel):
    id: int
    data_iso: str
    turma_id: int | None = None
    status: StatusEventoEnum
    tipo: TipoEventoEnum
    version: int


class WorkspaceEventoHeaderOut(BaseModel):
    titulo: str
    horario_inicio: str
    horario_fim: str


class WorkspaceEventoKpisOut(BaseModel):
    presentes: int = 0
    total_jogadores: int = 0
    gols_total: int = 0


class WorkspaceEventoEquipesOut(BaseModel):
    jogadores: List[PresencaJogadorDiaOut] = Field(default_factory=list)
    times: List[TimeEventoOut] = Field(default_factory=list)


class WorkspaceEventoWarningOut(BaseModel):
    code: str
    message: str
    severity: Literal["info", "warning", "error"]


class WorkspaceEventoOut(BaseModel):
    meta: WorkspaceEventoMetaOut
    header: WorkspaceEventoHeaderOut
    kpis: WorkspaceEventoKpisOut
    equipes: WorkspaceEventoEquipesOut
    partidas: List[PartidaEstadoOut] = Field(default_factory=list)
    eventos: List[str] = Field(default_factory=list)
    warnings: List[WorkspaceEventoWarningOut] = Field(default_factory=list)
