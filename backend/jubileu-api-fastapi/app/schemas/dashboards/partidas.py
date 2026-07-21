from pydantic import BaseModel, Field
from typing import List


class PartidasResumoOut(BaseModel):
    totalPartidas: int = 0
    mediaGolsPorPartida: float = 0
    totalGols: int = 0


class SeriePorDiaItem(BaseModel):
    data: str
    partidas: int = 0
    gols: int = 0


class SeriePorDiaOut(BaseModel):
    items: List[SeriePorDiaItem] = Field(default_factory=list)


class PartidaListaItem(BaseModel):
    partidaId: int
    eventoId: int
    dataIso: str
    eventoTipo: str
    eventoStatus: str
    turmaId: int | None = None
    turmaNome: str | None = None
    ordem: int
    partidaStatus: str
    timeAId: int
    timeANome: str
    timeBId: int
    timeBNome: str
    golsTimeA: int = 0
    golsTimeB: int = 0


class PartidasListaOut(BaseModel):
    items: List[PartidaListaItem] = Field(default_factory=list)
