from typing import List, Optional

from sqlalchemy.orm import Session

from .models import Turma, TurmaParticipante
from .schemas import (
    TurmaCreate,
    TurmaUpdate,
    TurmaParticipanteCreate,
)


# ---- Turma ----

def listar_turmas(db: Session) -> List[Turma]:
    return db.query(Turma).order_by(Turma.nome).all()


def obter_turma(db: Session, turma_id: int) -> Optional[Turma]:
    return db.get(Turma, turma_id)


def criar_turma(db: Session, dados: TurmaCreate) -> Turma:
    turma = Turma(
        nome=dados.nome,
        categoria=dados.categoria,
        dia_semana=dados.dia_semana,
        horario_inicio=dados.horario_inicio,
        horario_fim=dados.horario_fim,
        ativo=dados.ativo,
    )
    db.add(turma)
    db.commit()
    db.refresh(turma)
    return turma


def atualizar_turma(db: Session, turma: Turma, dados: TurmaUpdate) -> Turma:
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(turma, campo, valor)

    db.add(turma)
    db.commit()
    db.refresh(turma)
    return turma


def remover_turma(db: Session, turma: Turma) -> None:
    db.delete(turma)
    db.commit()


# ---- Participantes ----

def adicionar_participante(
    db: Session,
    turma: Turma,
    dados: TurmaParticipanteCreate,
) -> TurmaParticipante:
    participante = TurmaParticipante(
        turma_id=turma.id,
        jogador_id=dados.jogador_id,
        papel=dados.papel,
        pode_jogar=dados.pode_jogar,
        ativo=dados.ativo,
    )
    db.add(participante)
    db.commit()
    db.refresh(participante)
    return participante


def listar_participantes(db: Session, turma: Turma) -> List[TurmaParticipante]:
    return db.query(TurmaParticipante).filter_by(turma_id=turma.id).all()
