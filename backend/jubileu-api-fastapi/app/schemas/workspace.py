from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field

from app.models.dia_aula import StatusAulaEnum, TipoEventoAulaEnum
from app.schemas.dia_aula import PartidaEstadoOut, PresencaJogadorDiaOut, TimeAulaOut


class WorkspaceAulaMetaOut(BaseModel):
    id: int
    data_iso: str
    turma_id: int
    status: StatusAulaEnum
    tipo: TipoEventoAulaEnum
    version: int


class WorkspaceAulaHeaderOut(BaseModel):
    titulo: str
    horario_inicio: str
    horario_fim: str


class WorkspaceAulaKpisOut(BaseModel):
    presentes: int = 0
    total_jogadores: int = 0
    gols_total: int = 0


class WorkspaceAulaEquipesOut(BaseModel):
    jogadores: List[PresencaJogadorDiaOut] = Field(default_factory=list)
    times: List[TimeAulaOut] = Field(default_factory=list)


class WorkspaceAulaOut(BaseModel):
    meta: WorkspaceAulaMetaOut
    header: WorkspaceAulaHeaderOut
    kpis: WorkspaceAulaKpisOut
    equipes: WorkspaceAulaEquipesOut
    partidas: List[PartidaEstadoOut] = Field(default_factory=list)
    eventos: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
