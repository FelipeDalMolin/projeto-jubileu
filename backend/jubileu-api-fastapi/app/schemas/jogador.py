# app/schemas/jogador.py

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class StatusJogadorEnum(str, Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"
    LESIONADO = "lesionado"
    AFASTADO = "afastado"
    # Ajuste os valores conforme o domínio real do Jubileu


class JogadorBase(BaseModel):
    nome: str = Field(..., min_length=1)
    apelido: Optional[str] = None
    status: StatusJogadorEnum = StatusJogadorEnum.ATIVO


class JogadorCreate(JogadorBase):
    """
    Schema para criação de jogador.
    Herda de JogadorBase, então já tem nome, apelido e status.
    """
    pass


class JogadorUpdate(BaseModel):
    """
    Schema para atualização parcial de jogador.
    Todos os campos opcionais.
    """
    nome: Optional[str] = Field(None, min_length=1)
    apelido: Optional[str] = None
    status: Optional[StatusJogadorEnum] = None


class JogadorOut(JogadorBase):
    """
    Schema de saída (response) com ID.
    """
    id: int

    class Config:
        from_attributes = True  # FastAPI/Pydantic v2
        # Se você ainda estiver com Pydantic v1, troque por:
        # orm_mode = True
