from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from . import service
from .schemas import DiaCreate, DiaUpdate, DiaRead, DiaComAulas

router = APIRouter(prefix="/dias", tags=["Dias"])


@router.get("/", response_model=List[DiaRead])
def listar_dias(db: Session = Depends(get_db)):
    return service.listar_dias(db)


@router.post("/", response_model=DiaRead, status_code=status.HTTP_201_CREATED)
def criar_dia(dados: DiaCreate, db: Session = Depends(get_db)):
    return service.criar_dia(db, dados)


@router.get("/{dia_id}", response_model=DiaComAulas)
def obter_dia(dia_id: int, db: Session = Depends(get_db)):
    dia = service.obter_dia_por_id(db, dia_id)
    if not dia:
        raise HTTPException(status_code=404, detail="Dia não encontrado")
    return dia


@router.patch("/{dia_id}", response_model=DiaRead)
def atualizar_dia(
    dia_id: int,
    dados: DiaUpdate,
    db: Session = Depends(get_db),
):
    dia = service.obter_dia_por_id(db, dia_id)
    if not dia:
        raise HTTPException(status_code=404, detail="Dia não encontrado")
    return service.atualizar_dia(db, dia, dados)
