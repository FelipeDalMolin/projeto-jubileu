from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.dia_aula import Dia as DiaModel, Aula as AulaModel, TimeAula
from app.schemas.dia_aula import (
    DiaOut,
    AulaOut,
    AulaCreate,
    TimeAulaOut,
    TimeAulaCreate,
)

router = APIRouter(
    prefix="/dias",
    tags=["Dias"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- DIA ----------------


@router.get("/{data_iso}", response_model=DiaOut)
def obter_dia_por_data(data_iso: str, db: Session = Depends(get_db)):
    """
    Retorna o dia pela data ISO (YYYY-MM-DD).
    Se não existir, cria um dia vazio no banco e devolve.
    """
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()

    if not dia:
        dia = DiaModel(data_iso=data_iso)
        db.add(dia)
        db.commit()
        db.refresh(dia)

    return dia


# ---------------- AULAS DENTRO DO DIA ----------------


@router.post(
    "/{data_iso}/aulas",
    response_model=AulaOut,
    status_code=status.HTTP_201_CREATED,
)
def criar_aula_no_dia(
    data_iso: str,
    payload: AulaCreate,
    db: Session = Depends(get_db),
):
    """
    Cria uma nova aula em um dia.
    Se o dia não existir, é criado automaticamente.
    """
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        dia = DiaModel(data_iso=data_iso)
        db.add(dia)
        db.commit()
        db.refresh(dia)

    aula = AulaModel(
        dia_id=dia.id,
        turma_id=payload.turma_id,
        turma_nome=payload.turma_nome,
        numero_aula_na_turma=payload.numero_aula_na_turma,
        tipo=payload.tipo,
        horario_inicio=payload.horario_inicio,
        horario_fim=payload.horario_fim,
        status=payload.status,
    )

    db.add(aula)
    db.commit()
    db.refresh(aula)

    return aula


@router.get(
    "/{data_iso}/aulas/{aula_id}",
    response_model=AulaOut,
)
def obter_aula_no_dia(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
):
    """
    Retorna uma aula específica de um dia.
    Garante que a aula pertence ao dia informado.
    """
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia não encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )

    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada para este dia")

    return aula

@router.post(
    "/{data_iso}/aulas/{aula_id}/times",
    response_model=TimeAulaOut,
    status_code=status.HTTP_201_CREATED,
)
def criar_time_na_aula(
    data_iso: str,
    aula_id: int,
    payload: TimeAulaCreate,
    db: Session = Depends(get_db),
):
    """
    Cria um novo time (TimeAula) dentro de uma aula específica de um dia.

    - Garante que o dia existe e que a aula pertence a esse dia.
    """
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia não encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )

    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada para este dia")

    novo_time = TimeAula(
        aula_id=aula.id,
        nome=payload.nome,
        caracteristica=payload.caracteristica,
        cor_camisa=payload.cor_camisa,
    )

    db.add(novo_time)
    db.commit()
    db.refresh(novo_time)

    return novo_time