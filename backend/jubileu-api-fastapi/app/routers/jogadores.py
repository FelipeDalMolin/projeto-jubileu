# app/routers/jogadores.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models.jogador_turma import Jogador
from app.schemas.jogador import (
    JogadorOut,
    JogadorCreate,
    JogadorUpdate,
)

router = APIRouter(
    prefix="/jogadores",
    tags=["Jogadores"],
)


@router.get("/", response_model=List[JogadorOut])
def listar_jogadores(db: Session = Depends(get_db)) -> List[Jogador]:
    """
    Lista todos os jogadores cadastrados, ordenados por nome.
    """
    return db.query(Jogador).order_by(Jogador.nome).all()


@router.post(
    "/",
    response_model=JogadorOut,
    status_code=status.HTTP_201_CREATED,
)
def criar_jogador(
    payload: JogadorCreate,
    db: Session = Depends(get_db),
) -> Jogador:
    """
    Cria um novo jogador.
    """
    jogador = Jogador(
        nome=payload.nome,
        apelido=payload.apelido,
        status=payload.status or "ativo",
    )
    db.add(jogador)
    db.commit()
    db.refresh(jogador)
    return jogador


@router.get("/{jogador_id}", response_model=JogadorOut)
def obter_jogador(
    jogador_id: int,
    db: Session = Depends(get_db),
) -> Jogador:
    """
    Retorna um jogador específico pelo ID.
    """
    jogador = db.query(Jogador).filter(Jogador.id == jogador_id).first()
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")
    return jogador


@router.put("/{jogador_id}", response_model=JogadorOut)
def atualizar_jogador(
    jogador_id: int,
    payload: JogadorUpdate,
    db: Session = Depends(get_db),
) -> Jogador:
    """
    Atualiza dados de um jogador.
    """
    jogador = db.query(Jogador).filter(Jogador.id == jogador_id).first()
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")

    if payload.nome is not None:
        jogador.nome = payload.nome
    if payload.apelido is not None:
        jogador.apelido = payload.apelido
    if payload.status is not None:
        jogador.status = payload.status

    db.commit()
    db.refresh(jogador)
    return jogador


@router.delete("/{jogador_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_jogador(
    jogador_id: int,
    db: Session = Depends(get_db),
) -> None:
    """
    Remove um jogador.
    """
    jogador = db.query(Jogador).filter(Jogador.id == jogador_id).first()
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")

    db.delete(jogador)
    db.commit()
    return None
