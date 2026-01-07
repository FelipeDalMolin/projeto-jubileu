from pydantic import BaseModel, Field
from typing import List


class ItemScore(BaseModel):
    jogadorId: int | None = None
    nome: str
    valor: int = 0


class GolsPorTurma(BaseModel):
    turmaId: int | None = None
    turmaNome: str | None = None
    gols: int = 0


class EstatisticasVisaoGeralOut(BaseModel):
    topArtilheiros: List[ItemScore] = Field(default_factory=list)
    topPresencas: List[ItemScore] = Field(default_factory=list)
    golsPorTurma: List[GolsPorTurma] = Field(default_factory=list)
