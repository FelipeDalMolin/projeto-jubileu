from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, selectinload

from app.deps import get_db
from app.models.dia_aula import (
    EstatisticaJogadorPartida as EstatisticaModel,
    JogadorAula as JogadorAulaModel,
    Partida as PartidaModel,
)
from app.modules.dias import service as dias_service
from app.modules.partidas import service as partidas_service
from app.schemas.dia_aula import (
    CommandOkOut,
    PartidaCreate,
    PartidaOut,
    PartidaUpdate,
    StatsJogadorIn,
)

router = APIRouter(prefix="/dias", tags=["Partidas"])


def _to_partida_out(partida: PartidaModel) -> PartidaOut:
    return PartidaOut.model_validate(partida, from_attributes=True)


@router.get("/{data_iso}/aulas/{aula_id}/partidas", response_model=List[PartidaOut])
def listar_partidas(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> List[PartidaOut]:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)

    partidas = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.estatisticas))
        .filter(PartidaModel.aula_id == aula.id)
        .order_by(PartidaModel.ordem.asc(), PartidaModel.id.asc())
        .all()
    )

    ids_jogadores = [estat.jogador_aula_id for partida in partidas for estat in partida.estatisticas]
    jogadores_por_id = partidas_service.mapear_jogadores_da_aula(db, aula.id, ids_jogadores)

    for partida in partidas:
        gols_a, gols_b = partidas_service.calcular_placar(
            partida.estatisticas,
            jogadores_por_id,
            partida.time_a_id,
            partida.time_b_id,
        )
        partida.gols_time_a = gols_a
        partida.gols_time_b = gols_b

    return [_to_partida_out(p) for p in partidas]


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
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    dias_service.assert_aula_editavel(aula)
    partidas_service.validar_times_na_aula(
        db,
        aula_id=aula.id,
        time_a_id=payload.time_a_id,
        time_b_id=payload.time_b_id,
    )

    ordem = payload.ordem
    if ordem is None:
        ordem = db.query(PartidaModel).filter(PartidaModel.aula_id == aula.id).count() + 1

    ids_jogadores = [e.jogador_aula_id for e in payload.estatisticas]
    jogadores_por_id = partidas_service.mapear_jogadores_da_aula(db, aula.id, ids_jogadores)
    gols_a, gols_b = partidas_service.calcular_placar(
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
                chiliques=estat.chiliques,
                faltas=estat.faltas,
                nota=estat.nota,
            )
        )

    db.add(nova_partida)
    db.commit()
    db.refresh(nova_partida, attribute_names=["estatisticas"])
    return _to_partida_out(nova_partida)


@router.put("/{data_iso}/aulas/{aula_id}/partidas/{partida_id}", response_model=PartidaOut)
def atualizar_partida(
    data_iso: str,
    aula_id: int,
    partida_id: int,
    payload: PartidaUpdate,
    db: Session = Depends(get_db),
) -> PartidaOut:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    dias_service.assert_aula_editavel(aula)

    partida = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.estatisticas))
        .filter(PartidaModel.id == partida_id, PartidaModel.aula_id == aula.id)
        .first()
    )
    if not partida:
        raise HTTPException(status_code=404, detail="Partida nao encontrada para esta aula")

    novo_time_a_id = payload.time_a_id if payload.time_a_id is not None else partida.time_a_id
    novo_time_b_id = payload.time_b_id if payload.time_b_id is not None else partida.time_b_id
    partidas_service.validar_times_na_aula(
        db,
        aula_id=aula.id,
        time_a_id=novo_time_a_id,
        time_b_id=novo_time_b_id,
    )

    if payload.ordem is not None:
        partida.ordem = payload.ordem

    if payload.estatisticas is not None:
        ids_jogadores = [e.jogador_aula_id for e in payload.estatisticas]
        jogadores_por_id = partidas_service.mapear_jogadores_da_aula(db, aula.id, ids_jogadores)
        gols_a, gols_b = partidas_service.calcular_placar(
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
                    chiliques=estat.chiliques,
                    faltas=estat.faltas,
                    nota=estat.nota,
                )
            )
    else:
        ids_jogadores = [e.jogador_aula_id for e in partida.estatisticas]
        jogadores_por_id = partidas_service.mapear_jogadores_da_aula(db, aula.id, ids_jogadores)
        gols_a, gols_b = partidas_service.calcular_placar(
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
    return _to_partida_out(partida)


@router.put(
    "/{data_iso}/aulas/{aula_id}/partidas/{partida_id}/jogadores/{jogador_aula_id}/stats",
    response_model=CommandOkOut,
)
def atualizar_stats_jogador_partida(
    data_iso: str,
    aula_id: int,
    partida_id: int,
    jogador_aula_id: int,
    payload: StatsJogadorIn,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    dias_service.assert_aula_editavel(aula)

    partida = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.estatisticas))
        .filter(PartidaModel.id == partida_id, PartidaModel.aula_id == aula.id)
        .first()
    )
    if not partida:
        raise HTTPException(status_code=404, detail="Partida nao encontrada para esta aula")

    jogador = (
        db.query(JogadorAulaModel)
        .filter(JogadorAulaModel.id == jogador_aula_id, JogadorAulaModel.aula_id == aula.id)
        .first()
    )
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador nao encontrado na aula")
    if jogador.time_id not in {partida.time_a_id, partida.time_b_id}:
        raise HTTPException(status_code=400, detail="Jogador nao pertence a nenhum time da partida")

    estat = (
        db.query(EstatisticaModel)
        .filter(
            EstatisticaModel.partida_id == partida.id,
            EstatisticaModel.jogador_aula_id == jogador.id,
        )
        .first()
    )

    if estat is None:
        estat = EstatisticaModel(
            partida_id=partida.id,
            jogador_aula_id=jogador.id,
            gols=payload.gols,
            assistencias=payload.assistencias,
            chiliques=payload.chiliques,
            faltas=payload.faltas,
        )
        partida.estatisticas.append(estat)
    else:
        estat.gols = payload.gols
        estat.assistencias = payload.assistencias
        estat.chiliques = payload.chiliques
        estat.faltas = payload.faltas

    db.flush()
    ids_jogadores = [e.jogador_aula_id for e in partida.estatisticas] + [jogador.id]
    jogadores_por_id = partidas_service.mapear_jogadores_da_aula(db, aula.id, ids_jogadores)
    gols_a, gols_b = partidas_service.calcular_placar(
        partida.estatisticas,
        jogadores_por_id,
        partida.time_a_id,
        partida.time_b_id,
    )
    partida.gols_time_a = gols_a
    partida.gols_time_b = gols_b

    db.commit()
    current_version = partidas_service.calcular_version_atual(db, aula)
    return CommandOkOut(status="ok", version=current_version)


@router.delete("/{data_iso}/aulas/{aula_id}/partidas/{partida_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_partida(
    data_iso: str,
    aula_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> Response:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    dias_service.assert_aula_editavel(aula)

    partida = (
        db.query(PartidaModel)
        .filter(PartidaModel.id == partida_id, PartidaModel.aula_id == aula_id)
        .first()
    )
    if not partida:
        raise HTTPException(status_code=404, detail="Partida nao encontrada para esta aula")

    db.delete(partida)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
