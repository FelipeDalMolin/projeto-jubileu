from __future__ import annotations

from typing import Iterable, List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, selectinload

from app.deps import get_db
from app.models.dia_aula import (
    Aula as AulaModel,
    Dia as DiaModel,
    EstatisticaJogadorPartida as EstatisticaModel,
    JogadorAula as JogadorAulaModel,
    Partida as PartidaModel,
    TimeAula as TimeAulaModel,
)
from app.schemas.dia_aula import PartidaCreate, PartidaOut, PartidaUpdate

router = APIRouter(
    prefix="/dias",
    tags=["Partidas"],
)


def _obter_aula_ou_404(
    db: Session,
    data_iso: str,
    aula_id: int,
) -> AulaModel:
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
            status_code=404, detail="Aula nao encontrada para este dia"
        )
    return aula


def _validar_times_na_aula(
    db: Session,
    aula_id: int,
    time_a_id: int,
    time_b_id: int,
) -> None:
    if time_a_id == time_b_id:
        raise HTTPException(
            status_code=400, detail="time_a_id e time_b_id devem ser diferentes"
        )

    times = (
        db.query(TimeAulaModel)
        .filter(
            TimeAulaModel.aula_id == aula_id,
            TimeAulaModel.id.in_([time_a_id, time_b_id]),
        )
        .all()
    )

    if len(times) != 2:
        raise HTTPException(
            status_code=400, detail="Times informados nao pertencem a aula"
        )


def _mapear_jogadores_da_aula(
    db: Session,
    aula_id: int,
    jogador_ids: List[int],
) -> dict[int, JogadorAulaModel]:
    if not jogador_ids:
        return {}

    jogadores = (
        db.query(JogadorAulaModel)
        .filter(
            JogadorAulaModel.aula_id == aula_id,
            JogadorAulaModel.id.in_(jogador_ids),
        )
        .all()
    )

    encontrados = {j.id for j in jogadores}
    faltantes = set(jogador_ids) - encontrados
    if faltantes:
        faltantes_str = ", ".join(str(jid) for jid in sorted(faltantes))
        raise HTTPException(
            status_code=400,
            detail=f"Jogador(es) nao encontrado(s) na aula: {faltantes_str}",
        )

    return {j.id: j for j in jogadores}


def _calcular_placar(
    estatisticas: Iterable,
    jogadores_por_id: dict[int, JogadorAulaModel],
    time_a_id: int,
    time_b_id: int,
) -> tuple[int, int]:
    gols_a = 0
    gols_b = 0

    for estat in estatisticas:
        jogador = jogadores_por_id.get(estat.jogador_aula_id)
        if not jogador:
            raise HTTPException(
                status_code=400,
                detail=f"Jogador {estat.jogador_aula_id} nao pertence a aula",
            )

        if jogador.time_id is None:
            raise HTTPException(
                status_code=400,
                detail=f"Jogador {jogador.id} nao possui time na aula",
            )

        if jogador.time_id == time_a_id:
            gols_a += estat.gols
        elif jogador.time_id == time_b_id:
            gols_b += estat.gols
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Jogador {jogador.id} nao esta em um dos times da partida",
            )

    return gols_a, gols_b


@router.get(
    "/{data_iso}/aulas/{aula_id}/partidas",
    response_model=List[PartidaOut],
)
def listar_partidas(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> List[PartidaOut]:
    aula = _obter_aula_ou_404(db, data_iso, aula_id)

    partidas = (
        db.query(PartidaModel)
        .options(
            selectinload(PartidaModel.estatisticas).selectinload(
                EstatisticaModel.jogador_aula
            )
        )
        .filter(PartidaModel.aula_id == aula.id)
        .order_by(PartidaModel.ordem.asc(), PartidaModel.id.asc())
        .all()
    )

    ids_jogadores = [
        estat.jogador_aula_id
        for partida in partidas
        for estat in partida.estatisticas
    ]
    jogadores_por_id = _mapear_jogadores_da_aula(db, aula.id, ids_jogadores)

    for partida in partidas:
        gols_a, gols_b = _calcular_placar(
            partida.estatisticas,
            jogadores_por_id,
            partida.time_a_id,
            partida.time_b_id,
        )
        partida.gols_time_a = gols_a
        partida.gols_time_b = gols_b

    return partidas


@router.post(
    "/{data_iso}/aulas/{aula_id}/partidas",
    response_model=PartidaOut,
    status_code=status.HTTP_201_CREATED,
)
def criar_partida(
    data_iso: str,
    aula_id: int,
    payload: PartidaCreate,
    db: Session = Depends(get_db),
) -> PartidaOut:
    aula = _obter_aula_ou_404(db, data_iso, aula_id)
    _validar_times_na_aula(
        db,
        aula_id=aula.id,
        time_a_id=payload.time_a_id,
        time_b_id=payload.time_b_id,
    )

    ordem = payload.ordem
    if ordem is None:
        total = (
            db.query(PartidaModel)
            .filter(PartidaModel.aula_id == aula.id)
            .count()
        )
        ordem = total + 1

    ids_jogadores = [e.jogador_aula_id for e in payload.estatisticas]
    jogadores_por_id = _mapear_jogadores_da_aula(db, aula.id, ids_jogadores)
    gols_a, gols_b = _calcular_placar(
        payload.estatisticas,
        jogadores_por_id,
        payload.time_a_id,
        payload.time_b_id,
    )

    nova_partida = PartidaModel(
        aula_id=aula.id,
        ordem=ordem,
        time_a_id=payload.time_a_id,
        time_b_id=payload.time_b_id,
        gols_time_a=gols_a,
        gols_time_b=gols_b,
    )

    for estat in payload.estatisticas:
        nova_partida.estatisticas.append(
            EstatisticaModel(
                jogador_aula_id=estat.jogador_aula_id,
                gols=estat.gols,
                assistencias=estat.assistencias,
                defesas=estat.defesas,
                chiliques=estat.chiliques,
                faltas=estat.faltas,
                nota=estat.nota,
            )
        )

    db.add(nova_partida)
    db.commit()
    db.refresh(nova_partida, attribute_names=["estatisticas"])
    return nova_partida


@router.put(
    "/{data_iso}/aulas/{aula_id}/partidas/{partida_id}",
    response_model=PartidaOut,
)
def atualizar_partida(
    data_iso: str,
    aula_id: int,
    partida_id: int,
    payload: PartidaUpdate,
    db: Session = Depends(get_db),
) -> PartidaOut:
    aula = _obter_aula_ou_404(db, data_iso, aula_id)
    partida = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.estatisticas))
        .filter(PartidaModel.id == partida_id, PartidaModel.aula_id == aula.id)
        .first()
    )

    if not partida:
        raise HTTPException(
            status_code=404, detail="Partida nao encontrada para esta aula"
        )

    novo_time_a_id = (
        payload.time_a_id if payload.time_a_id is not None else partida.time_a_id
    )
    novo_time_b_id = (
        payload.time_b_id if payload.time_b_id is not None else partida.time_b_id
    )
    _validar_times_na_aula(
        db,
        aula_id=aula.id,
        time_a_id=novo_time_a_id,
        time_b_id=novo_time_b_id,
    )

    if payload.ordem is not None:
        partida.ordem = payload.ordem

    if payload.estatisticas is not None:
        ids_jogadores = [e.jogador_aula_id for e in payload.estatisticas]
        jogadores_por_id = _mapear_jogadores_da_aula(
            db, aula.id, ids_jogadores
        )
        gols_a, gols_b = _calcular_placar(
            payload.estatisticas,
            jogadores_por_id,
            novo_time_a_id,
            novo_time_b_id,
        )

        partida.estatisticas.clear()
        for estat in payload.estatisticas:
            partida.estatisticas.append(
                EstatisticaModel(
                    jogador_aula_id=estat.jogador_aula_id,
                    gols=estat.gols,
                    assistencias=estat.assistencias,
                    defesas=estat.defesas,
                    chiliques=estat.chiliques,
                    faltas=estat.faltas,
                    nota=estat.nota,
                )
            )
    else:
        ids_jogadores = [e.jogador_aula_id for e in partida.estatisticas]
        jogadores_por_id = _mapear_jogadores_da_aula(
            db, aula.id, ids_jogadores
        )
        gols_a, gols_b = _calcular_placar(
            partida.estatisticas,
            jogadores_por_id,
            novo_time_a_id,
            novo_time_b_id,
        )

    partida.time_a_id = novo_time_a_id
    partida.time_b_id = novo_time_b_id
    partida.gols_time_a = gols_a
    partida.gols_time_b = gols_b

    db.commit()
    db.refresh(partida, attribute_names=["estatisticas"])
    return partida


@router.delete(
    "/{data_iso}/aulas/{aula_id}/partidas/{partida_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def deletar_partida(
    data_iso: str,
    aula_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> Response:
    _obter_aula_ou_404(db, data_iso, aula_id)

    partida = (
        db.query(PartidaModel)
        .filter(PartidaModel.id == partida_id, PartidaModel.aula_id == aula_id)
        .first()
    )

    if not partida:
        raise HTTPException(
            status_code=404, detail="Partida nao encontrada para esta aula"
        )

    db.delete(partida)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
