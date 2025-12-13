from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from . import service
from .schemas import (
    TurmaCreate,
    TurmaUpdate,
    TurmaRead,
    TurmaComParticipantes,
    TurmaParticipanteCreate,
    TurmaParticipanteRead,
)

router = APIRouter(prefix="/turmas", tags=["Turmas"])


@router.get("/", response_model=List[TurmaRead])
def listar_turmas(db: Session = Depends(get_db)):
    return service.listar_turmas(db)


@router.post("/", response_model=TurmaRead, status_code=status.HTTP_201_CREATED)
def criar_turma(dados: TurmaCreate, db: Session = Depends(get_db)):
    return service.criar_turma(db, dados)


@router.get("/{turma_id}", response_model=TurmaComParticipantes)
def obter_turma(turma_id: int, db: Session = Depends(get_db)):
    turma = service.obter_turma(db, turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return turma


@router.put("/{turma_id}", response_model=TurmaRead)
def atualizar_turma(
    turma_id: int,
    dados: TurmaUpdate,
    db: Session = Depends(get_db),
):
    turma = service.obter_turma(db, turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return service.atualizar_turma(db, turma, dados)


@router.delete("/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_turma(turma_id: int, db: Session = Depends(get_db)):
    turma = service.obter_turma(db, turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    service.remover_turma(db, turma)
    return None


# ---- Participantes ----

@router.get(
    "/{turma_id}/participantes",
    response_model=List[TurmaParticipanteRead],
)
def listar_participantes_turma(
    turma_id: int,
    db: Session = Depends(get_db),
):
    turma = service.obter_turma(db, turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return service.listar_participantes(db, turma)


@router.post(
    "/{turma_id}/participantes",
    response_model=TurmaParticipanteRead,
    status_code=status.HTTP_201_CREATED,
)
def adicionar_participante_turma(
    turma_id: int,
    dados: TurmaParticipanteCreate,
    db: Session = Depends(get_db),
):
    turma = service.obter_turma(db, turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return service.adicionar_participante(db, turma, dados)
