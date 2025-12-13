from pydantic import BaseModel, EmailStr
from typing import Optional


class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr
    papel: str = "aluno"
    ativo: bool = True
    jogador_id: Optional[int] = None


class UsuarioCreate(UsuarioBase):
    senha: str


class UsuarioUpdate(BaseModel):
    nome: Optional[str]
    email: Optional[EmailStr]
    senha: Optional[str]
    papel: Optional[str]
    ativo: Optional[bool]
    jogador_id: Optional[int]


class UsuarioOut(UsuarioBase):
    id: int

    class Config:
        from_attributes = True
