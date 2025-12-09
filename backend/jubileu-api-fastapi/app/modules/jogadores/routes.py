from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from . import service
from .models import Jogador
from .schemas import JogadorCreate, JogadorRead, JogadorUpdate

router = APIRouter()


@router.get("/", response_model=List[JogadorRead])
def listar_todos_jogadores(db: Session = Depends(get_db)):
    return service.listar_jogadores(db)


@router.get("/{jogador_id}", response_model=JogadorRead)
def obter_jogador_por_id(jogador_id: int, db: Session = Depends(get_db)):
    jogador = service.obter_jogador(db, jogador_id)
    if not jogador:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jogador não encontrado",
        )
    return jogador


@router.post("/", response_model=JogadorRead, status_code=status.HTTP_201_CREATED)
def criar_novo_jogador(dados: JogadorCreate, db: Session = Depends(get_db)):
    return service.criar_jogador(db, dados)


@router.put("/{jogador_id}", response_model=JogadorRead)
def atualizar_jogador_por_id(
    jogador_id: int,
    dados: JogadorUpdate,
    db: Session = Depends(get_db),
):
    jogador = service.obter_jogador(db, jogador_id)
    if not jogador:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jogador não encontrado",
        )
    return service.atualizar_jogador(db, jogador, dados)


@router.delete("/{jogador_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_jogador(jogador_id: int, db: Session = Depends(get_db)):
    jogador: Jogador | None = service.obter_jogador(db, jogador_id)
    if not jogador:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jogador não encontrado",
        )
    service.remover_jogador(db, jogador)
    return None
