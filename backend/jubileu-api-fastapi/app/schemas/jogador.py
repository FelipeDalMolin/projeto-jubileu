from pydantic import BaseModel
from enum import Enum


class StatusJogadorEnum(str, Enum):
    ativo = "ativo"
    temporariamente_inativo = "temporariamente_inativo"
    afastado = "afastado"


class JogadorBase(BaseModel):
    nome: str
    apelido: str | None = None
    posicao: str | None = None
    status: StatusJogadorEnum = StatusJogadorEnum.ativo


class JogadorCreate(JogadorBase):
    pass


class JogadorUpdate(JogadorBase):
    pass


class JogadorOut(JogadorBase):
    id: int

    class Config:
        from_attributes = True  # equivale ao antigo orm_mode
