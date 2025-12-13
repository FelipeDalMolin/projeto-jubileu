from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Jogador
from .schemas import JogadorCreate, JogadorUpdate


def listar_jogadores(db: Session) -> List[Jogador]:
    stmt = select(Jogador).order_by(Jogador.nome)
    return list(db.scalars(stmt))


def obter_jogador(db: Session, jogador_id: int) -> Optional[Jogador]:
    return db.get(Jogador, jogador_id)


def criar_jogador(db: Session, dados: JogadorCreate) -> Jogador:
    obj = Jogador(
        nome=dados.nome,
        idade=dados.idade,
        ativo=dados.ativo,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def atualizar_jogador(
    db: Session,
    jogador: Jogador,
    dados: JogadorUpdate,
) -> Jogador:
    if dados.nome is not None:
        jogador.nome = dados.nome
    if dados.idade is not None:
        jogador.idade = dados.idade
    if dados.ativo is not None:
        jogador.ativo = dados.ativo

    db.add(jogador)
    db.commit()
    db.refresh(jogador)
    return jogador


def remover_jogador(db: Session, jogador: Jogador) -> None:
    db.delete(jogador)
    db.commit()
