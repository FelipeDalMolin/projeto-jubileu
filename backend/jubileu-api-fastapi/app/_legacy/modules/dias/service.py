from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from .models import Dia
from .schemas import DiaCreate, DiaUpdate


def listar_dias(db: Session) -> List[Dia]:
    return db.query(Dia).order_by(Dia.data).all()


def obter_dia_por_id(db: Session, dia_id: int) -> Optional[Dia]:
    return db.get(Dia, dia_id)


def obter_dia_por_data(db: Session, data_valor: date) -> Optional[Dia]:
    return db.query(Dia).filter(Dia.data == data_valor).first()


def criar_dia(db: Session, dados: DiaCreate) -> Dia:
    existente = obter_dia_por_data(db, dados.data)
    if existente:
        return existente

    dia = Dia(
        data=dados.data,
        observacoes=dados.observacoes,
        treino_cancelado=dados.treino_cancelado,
    )
    db.add(dia)
    db.commit()
    db.refresh(dia)
    return dia


def atualizar_dia(db: Session, dia: Dia, dados: DiaUpdate) -> Dia:
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(dia, campo, valor)

    db.add(dia)
    db.commit()
    db.refresh(dia)
    return dia
