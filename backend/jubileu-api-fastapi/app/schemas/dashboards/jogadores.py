from pydantic import BaseModel, Field
from typing import List


class JogadoresResumoOut(BaseModel):
    totalJogadores: int = 0
    mediaPresenca: float = Field(0, ge=0, le=100)
    totalGols: int = 0


class JogadorRankingOut(BaseModel):
    jogadorId: int
    nome: str
    turmaId: int | None = None
    turmaNome: str | None = None
    presencas: int = 0
    gols: int = 0
    assistencias: int = 0
    pontuacao: float = 0


class JogadoresRankingOut(BaseModel):
    items: List[JogadorRankingOut] = Field(default_factory=list)
