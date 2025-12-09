from datetime import time
from typing import Optional, List

from pydantic import BaseModel, Field


# ---- Turma ----

class TurmaBase(BaseModel):
    nome: str = Field(..., max_length=100)
    categoria: str = Field(..., max_length=50)
    dia_semana: Optional[int] = Field(
        default=None,
        ge=0,
        le=6,
        description="0=segunda ... 6=domingo",
    )
    horario_inicio: Optional[time] = None
    horario_fim: Optional[time] = None
    ativo: bool = True


class TurmaCreate(TurmaBase):
    pass


class TurmaUpdate(BaseModel):
    nome: Optional[str] = None
    categoria: Optional[str] = None
    dia_semana: Optional[int] = None
    horario_inicio: Optional[time] = None
    horario_fim: Optional[time] = None
    ativo: Optional[bool] = None


class TurmaRead(TurmaBase):
    id: int

    class Config:
        from_attributes = True


# ---- Participante da Turma ----

class TurmaParticipanteBase(BaseModel):
    jogador_id: int
    papel: str = Field(default="aluno", max_length=20)
    pode_jogar: bool = True
    ativo: bool = True


class TurmaParticipanteCreate(TurmaParticipanteBase):
    pass


class TurmaParticipanteRead(TurmaParticipanteBase):
    id: int
    turma_id: int

    class Config:
        from_attributes = True


class TurmaComParticipantes(TurmaRead):
    participantes: List[TurmaParticipanteRead] = []
