from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from app.modules.dias.models import Dia
from app.modules.dias.service import (
    obter_dia_por_data,
    criar_dia,
)
from app.modules.dias.schemas import DiaCreate

from .models import Aula
from .schemas import AulaCreate, AulaUpdate


def listar_aulas_do_dia(db: Session, dia: Dia) -> List[Aula]:
    return db.query(Aula).filter_by(dia_id=dia.id).all()


def obter_aula(db: Session, aula_id: int) -> Optional[Aula]:
    return db.get(Aula, aula_id)


def criar_aula_em_data(
    db: Session,
    data_valor: date,
    dados: AulaCreate,
) -> Aula:
    """
    Garante que existe um Dia para data_valor e cria a Aula ligada a esse dia.
    """
    dia = obter_dia_por_data(db, data_valor)
    if not dia:
        dia = criar_dia(
            db,
            DiaCreate(
                data=data_valor,
                observacoes=None,
                treino_cancelado=False,
            ),
        )

    return criar_aula_no_dia(db, dia, dados)


def criar_aula_no_dia(
    db: Session,
    dia: Dia,
    dados: AulaCreate,
) -> Aula:
    aula = Aula(
        dia_id=dia.id,
        turma_id=dados.turma_id,
        titulo=dados.titulo,
        status=dados.status,
        horario_inicio=dados.horario_inicio,
        horario_fim=dados.horario_fim,
        observacoes=dados.observacoes,
    )
    db.add(aula)
    db.commit()
    db.refresh(aula)
    return aula


def atualizar_aula(db: Session, aula: Aula, dados: AulaUpdate) -> Aula:
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(aula, campo, valor)

    db.add(aula)
    db.commit()
    db.refresh(aula)
    return aula
