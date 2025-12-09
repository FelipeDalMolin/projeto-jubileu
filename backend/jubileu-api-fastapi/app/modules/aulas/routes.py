from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.dias import service as dias_service
from app.modules.aulas import service
from app.modules.aulas.schemas import AulaCreate, AulaUpdate, AulaRead

router = APIRouter(prefix="/aulas", tags=["Aulas"])


@router.get("/{aula_id}", response_model=AulaRead)
def obter_aula(aula_id: int, db: Session = Depends(get_db)):
    aula = service.obter_aula(db, aula_id)
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")
    return aula


# Pensando no front: /dias/{data_iso}/aulas

@router.get("/por-dia/{data_iso}", response_model=List[AulaRead])
def listar_aulas_por_data(
    data_iso: str,
    db: Session = Depends(get_db),
):
    try:
        data_valor = date.fromisoformat(data_iso)
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida (use YYYY-MM-DD)")

    dia = dias_service.obter_dia_por_data(db, data_valor)
    if not dia:
        return []

    return service.listar_aulas_do_dia(db, dia)


@router.post(
    "/por-dia/{data_iso}",
    response_model=AulaRead,
    status_code=status.HTTP_201_CREATED,
)
def criar_aula_em_dia(
    data_iso: str,
    dados: AulaCreate,
    db: Session = Depends(get_db),
):
    try:
        data_valor = date.fromisoformat(data_iso)
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida (use YYYY-MM-DD)")

    return service.criar_aula_em_data(db, data_valor, dados)


@router.patch("/{aula_id}", response_model=AulaRead)
def atualizar_aula(
    aula_id: int,
    dados: AulaUpdate,
    db: Session = Depends(get_db),
):
    aula = service.obter_aula(db, aula_id)
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")
    return service.atualizar_aula(db, aula, dados)
