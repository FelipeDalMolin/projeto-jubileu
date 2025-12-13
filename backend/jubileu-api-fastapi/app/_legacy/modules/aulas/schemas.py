from datetime import time
from typing import Optional

from pydantic import BaseModel


class AulaBase(BaseModel):
    turma_id: int
    titulo: str = "Aula"
    status: str = "planejada"
    horario_inicio: Optional[time] = None
    horario_fim: Optional[time] = None
    observacoes: Optional[str] = None


class AulaCreate(AulaBase):
    pass


class AulaUpdate(BaseModel):
    titulo: Optional[str] = None
    status: Optional[str] = None
    horario_inicio: Optional[time] = None
    horario_fim: Optional[time] = None
    observacoes: Optional[str] = None


class AulaRead(AulaBase):
    id: int
    dia_id: int

    class Config:
        from_attributes = True


class AulaReadShort(BaseModel):
    id: int
    titulo: str
    status: str

    class Config:
        from_attributes = True
