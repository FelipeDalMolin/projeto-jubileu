# app/routers/turmas.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models.jogador_turma import Turma, TurmaJogador, Jogador
from app.schemas.jogador_turma import (
    JogadorOut,
    TurmaOut,
    TurmaCreate,
    TurmaUpdate,
)

router = APIRouter(
    prefix="/turmas",
    tags=["Turmas"],
)


@router.get("/", response_model=list[TurmaOut])
def listar_turmas(db: Session = Depends(get_db)) -> list[Turma]:
    return db.query(Turma).order_by(Turma.nome).all()


@router.post("/", response_model=TurmaOut, status_code=status.HTTP_201_CREATED)
def criar_turma(payload: TurmaCreate, db: Session = Depends(get_db)) -> Turma:
    turma = Turma(nome=payload.nome)
    db.add(turma)
    db.commit()
    db.refresh(turma)
    return turma


@router.get("/{turma_id}", response_model=TurmaOut)
def obter_turma(turma_id: int, db: Session = Depends(get_db)) -> Turma:
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return turma


@router.put("/{turma_id}", response_model=TurmaOut)
def atualizar_turma(
    turma_id: int,
    payload: TurmaUpdate,
    db: Session = Depends(get_db),
) -> Turma:
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    if payload.nome is not None:
        turma.nome = payload.nome

    db.commit()
    db.refresh(turma)
    return turma


@router.delete("/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_turma(turma_id: int, db: Session = Depends(get_db)) -> None:
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    db.delete(turma)
    db.commit()
    return None


@router.get("/{turma_id}/jogadores", response_model=list[JogadorOut])
def listar_jogadores_da_turma(
    turma_id: int,
    db: Session = Depends(get_db),
):
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    vinculacoes = (
        db.query(TurmaJogador)
        .join(Jogador, TurmaJogador.jogador_id == Jogador.id)
        .filter(
            TurmaJogador.turma_id == turma_id,
            TurmaJogador.ativo.is_(True),
        )
        .order_by(Jogador.nome)
        .all()
    )

    return [v.jogador for v in vinculacoes]
