# app/schemas/jogadores.py
from typing import Optional
from pydantic import BaseModel, ConfigDict


class JogadorBase(BaseModel):
    nome: str
    apelido: Optional[str] = None
    status: str = "ativo"


class JogadorCreate(JogadorBase):
    pass


class JogadorUpdate(BaseModel):
    nome: Optional[str] = None
    apelido: Optional[str] = None
    status: Optional[str] = None


class JogadorOut(JogadorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
