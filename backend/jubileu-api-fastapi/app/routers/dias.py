# app/routers/dias.py

from __future__ import annotations

from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, selectinload

from app.deps import get_db
from app.models.jogador_turma import (
    Turma as TurmaModel,
    TurmaJogador as TurmaJogadorModel,
    Jogador as JogadorModel,
)
from app.models.dia_aula import (
    Dia as DiaModel,
    Aula as AulaModel,
    TimeAula as TimeAulaModel,
    AulaEquipesEstado as AulaEquipesEstadoModel,
    JogadorAula as JogadorAulaModel,
    StatusPresencaEnum,
)
from app.schemas.dia_aula import (
    DiaOut,
    AulaOut,
    AulaCreate,
    TimeAulaOut,
    TimeAulaCreate,
    EstadoEquipesAulaIn,
    EstadoEquipesAulaOut,
    PresencaJogadorDiaOut,
)

router = APIRouter(
  prefix="/dias",
  tags=["Dias"],
)


# ---------------- DIA ----------------


@router.get("/", response_model=List[DiaOut])
def listar_dias(db: Session = Depends(get_db)) -> List[DiaOut]:
    """Lista todos os dias cadastrados (ordenados por data_iso)."""
    return (
        db.query(DiaModel)
        .options(selectinload(DiaModel.aulas).selectinload(AulaModel.jogadores))
        .order_by(DiaModel.data_iso.asc())
        .all()
    )


@router.get("/{data_iso}", response_model=DiaOut)
def obter_dia_por_data(data_iso: str, db: Session = Depends(get_db)) -> DiaOut:
    """
    Retorna o dia pela data ISO (YYYY-MM-DD).

    Se nao existir, cria um dia vazio no banco e devolve.
    """
    dia = (
        db.query(DiaModel)
        .options(selectinload(DiaModel.aulas).selectinload(AulaModel.jogadores))
        .filter(DiaModel.data_iso == data_iso)
        .first()
    )
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
) -> AulaOut:
    """
    Cria uma nova aula em um dia.

    Se o dia nao existir, ele e criado automaticamente.
    """
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        dia = DiaModel(
            data_iso=data_iso,
            feriado_nome=None,
            feriado_tipo=None,
        )
        db.add(dia)
        db.commit()
        db.refresh(dia)

    turma = db.query(TurmaModel).filter(TurmaModel.id == payload.turma_id).first()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma nao encontrada")

    ultima_aula = (
        db.query(AulaModel)
        .filter(AulaModel.turma_id == payload.turma_id)
        .order_by(AulaModel.numero_aula_na_turma.desc())
        .first()
    )
    novo_numero = (
        (ultima_aula.numero_aula_na_turma or 0) + 1 if ultima_aula else 1
    )

    aula = AulaModel(
        dia_id=dia.id,
        turma_id=payload.turma_id,
        turma_nome=turma.nome,
        numero_aula_na_turma=novo_numero,
        tipo=payload.tipo,
        horario_inicio=payload.horario_inicio,
        horario_fim=payload.horario_fim,
        status=payload.status,
    )
    db.add(aula)
    db.flush()

    jogadores_ativos = (
        db.query(TurmaJogadorModel)
        .join(JogadorModel, TurmaJogadorModel.jogador)
        .filter(TurmaJogadorModel.turma_id == payload.turma_id)
        .filter(TurmaJogadorModel.ativo.is_(True))
        .all()
    )

    for rel in jogadores_ativos:
        jogador_nome = rel.jogador.nome if rel.jogador else ""
        jogador_id = rel.jogador.id if rel.jogador else rel.jogador_id
        novo_jogador_aula = JogadorAulaModel(
            aula_id=aula.id,
            jogador_id=jogador_id,
            nome=jogador_nome or f"Jogador {jogador_id}",
            status=StatusPresencaEnum.so_treino,
        )
        db.add(novo_jogador_aula)

    db.commit()
    db.refresh(aula, attribute_names=["jogadores"])
    return aula


@router.get(
    "/{data_iso}/aulas/{aula_id}",
    response_model=AulaOut,
)
def obter_aula_no_dia(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> AulaOut:
    """
    Retorna uma aula especifica de um dia.

    Garante que a aula pertence ao dia informado.
    """
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")

    aula = (
        db.query(AulaModel)
        .options(selectinload(AulaModel.jogadores))
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )
    if not aula:
        raise HTTPException(
            status_code=404,
            detail="Aula nao encontrada para este dia",
        )
    return aula


@router.delete(
    "/{data_iso}/aulas/{aula_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def deletar_aula_no_dia(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> Response:
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )
    if not aula:
        raise HTTPException(
            status_code=404,
            detail="Aula nao encontrada para este dia",
        )

    db.delete(aula)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------- TIMES DA AULA ----------------


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
) -> TimeAulaOut:
    """
    Cria um novo time (TimeAula) dentro de uma aula especifica de um dia.

    Usado diretamente pela tela de Aula (botao "Adicionar equipe").
    """
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )
    if not aula:
        raise HTTPException(
            status_code=404,
            detail="Aula nao encontrada para este dia",
        )

    novo_time = TimeAulaModel(
        aula_id=aula.id,
        nome=payload.nome,
        caracteristica=payload.caracteristica,
        cor_camisa=payload.cor_camisa,
    )
    db.add(novo_time)
    db.commit()
    db.refresh(novo_time)

    # Transformamos o modelo de banco no DTO que o front espera
    return TimeAulaOut(
        id=str(novo_time.id),
        nome=novo_time.nome,
        jogadoresIds=[],
        caracteristica=novo_time.caracteristica,
        corCamisa=novo_time.cor_camisa,
    )


# ---------------- ESTADO DE EQUIPES (SNAPSHOT JSON) ----------------


@router.get(
    "/{data_iso}/aulas/{aula_id}/estado-equipes",
    response_model=EstadoEquipesAulaOut,
)
def obter_estado_equipes_aula(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> EstadoEquipesAulaOut:
    """
    Retorna o snapshot JSON do estado das equipes de uma aula.

    Usado para sincronizar separacao de times entre clientes.
    """
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )
    if not aula:
        raise HTTPException(
            status_code=404,
            detail="Aula nao encontrada para este dia",
        )

    estado_row = (
        db.query(AulaEquipesEstadoModel)
        .filter(AulaEquipesEstadoModel.aula_id == aula.id)
        .first()
    )

    if not estado_row:
        # estado inicial vazio
        return EstadoEquipesAulaOut(
            aula_id=aula.id,
            jogadores=[],
            times=[],
        )

    estado_dict: dict[str, Any] = estado_row.estado or {}
    jogadores_raw = estado_dict.get("jogadores", []) or []
    times_raw = estado_dict.get("times", []) or []

    jogadores = [
        PresencaJogadorDiaOut.model_validate(j) for j in jogadores_raw
    ]
    times = [TimeAulaOut.model_validate(t) for t in times_raw]

    return EstadoEquipesAulaOut(
        aula_id=aula.id,
        jogadores=jogadores,
        times=times,
    )


@router.put(
    "/{data_iso}/aulas/{aula_id}/estado-equipes",
    response_model=EstadoEquipesAulaOut,
)
def salvar_estado_equipes_aula(
    data_iso: str,
    aula_id: int,
    payload: EstadoEquipesAulaIn,
    db: Session = Depends(get_db),
) -> EstadoEquipesAulaOut:
    """
    Salva (ou atualiza) o snapshot JSON do estado das equipes de uma aula.
    """
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )
    if not aula:
        raise HTTPException(
            status_code=404,
            detail="Aula nao encontrada para este dia",
        )

    estado_dict: dict[str, Any] = {
        "jogadores": [j.model_dump() for j in payload.jogadores],
        "times": [t.model_dump() for t in payload.times],
    }

    estado_row = (
        db.query(AulaEquipesEstadoModel)
        .filter(AulaEquipesEstadoModel.aula_id == aula.id)
        .first()
    )

    if estado_row:
        estado_row.estado = estado_dict
    else:
        estado_row = AulaEquipesEstadoModel(
            aula_id=aula.id,
            estado=estado_dict,
        )
        db.add(estado_row)

    db.commit()
    db.refresh(estado_row)

    jogadores = [
        PresencaJogadorDiaOut.model_validate(j)
        for j in estado_dict["jogadores"]
    ]
    times = [
        TimeAulaOut.model_validate(t) for t in estado_dict["times"]
    ]

    return EstadoEquipesAulaOut(
        aula_id=aula.id,
        jogadores=jogadores,
        times=times,
    )
