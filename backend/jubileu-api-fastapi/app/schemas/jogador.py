# app/schemas/jogador.py
from typing import Optional
from pydantic import BaseModel, ConfigDict


class JogadorBase(BaseModel):
    nome: str
    apelido: Optional[str] = None
    status: str = "ativo"


class JogadorCreate(JogadorBase):
    """DTO de entrada para criar jogador."""
    pass


class JogadorUpdate(BaseModel):
    """DTO de entrada para atualizar jogador (campos opcionais)."""
    nome: Optional[str] = None
    apelido: Optional[str] = None
    status: Optional[str] = None


class JogadorOut(JogadorBase):
    """DTO de saída (response) com id."""
    id: int

    model_config = ConfigDict(from_attributes=True)
