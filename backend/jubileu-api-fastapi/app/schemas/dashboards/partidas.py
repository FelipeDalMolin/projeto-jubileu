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
