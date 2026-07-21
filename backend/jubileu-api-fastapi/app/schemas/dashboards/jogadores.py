from pydantic import BaseModel, Field
from typing import List


class JogadorEventoContextoOut(BaseModel):
    eventoId: int
    dataIso: str
    tipo: str
    turmaNome: str | None = None
    presencas: int = 0
    gols: int = 0
    assistencias: int = 0


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
    eventos: List[JogadorEventoContextoOut] = Field(default_factory=list)


class JogadoresRankingOut(BaseModel):
    items: List[JogadorRankingOut] = Field(default_factory=list)
