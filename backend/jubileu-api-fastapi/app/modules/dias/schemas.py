from datetime import date
from typing import Optional, List

from pydantic import BaseModel

from app.modules.aulas.schemas import AulaReadShort


class DiaBase(BaseModel):
    data: date
    observacoes: Optional[str] = None
    treino_cancelado: bool = False


class DiaCreate(DiaBase):
    pass


class DiaUpdate(BaseModel):
    observacoes: Optional[str] = None
    treino_cancelado: Optional[bool] = None


class DiaRead(DiaBase):
    id: int

    class Config:
        from_attributes = True


class DiaComAulas(DiaRead):
    aulas: List[AulaReadShort] = []
