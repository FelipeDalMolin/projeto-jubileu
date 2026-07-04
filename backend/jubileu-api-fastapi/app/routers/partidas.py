from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.deps import get_db
from app.models.dia_evento import (
    Evento as EventoModel,
    EstatisticaJogadorPartida as EstatisticaModel,
    JogadorEvento as JogadorEventoModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusEventoEnum,
)
from app.modules.dias import service as dias_service
from app.modules.partidas import service as partidas_service
from app.schemas.dia_evento import (
    CommandOkOut,
    PartidaCreate,
    PartidaOut,
    PartidaUpdate,
    StatsJogadorIn,
)

router = APIRouter(prefix="/dias", tags=["Partidas"])


def _to_partida_out(partida: PartidaModel) -> PartidaOut:
    return PartidaOut.model_validate(partida, from_attributes=True)


def _obter_partida_na_evento_or_404(db: Session, evento_id: int, partida_id: int) -> PartidaModel:
    partida = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.estatisticas))
        .filter(PartidaModel.id == partida_id, PartidaModel.evento_id == evento_id)
        .first()
    )
    if not partida:
        raise HTTPException(status_code=404, detail="Partida nao encontrada para esta evento")
    return partida


def _lock_evento_for_command(db: Session, evento_id: int) -> None:
    db.query(EventoModel.id).filter(EventoModel.id == evento_id).with_for_update().one()


@router.get("/{data_iso}/eventos/{evento_id}/partidas", response_model=List[PartidaOut])
def listar_partidas(
    data_iso: str,
    evento_id: int,
    db: Session = Depends(get_db),
) -> List[PartidaOut]:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)

    partidas = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.estatisticas))
        .filter(PartidaModel.evento_id == evento.id)
        .order_by(PartidaModel.ordem.asc(), PartidaModel.id.asc())
        .all()
    )

    ids_jogadores = [estat.jogador_evento_id for partida in partidas for estat in partida.estatisticas]
    jogadores_por_id = partidas_service.mapear_jogadores_da_evento(db, evento.id, ids_jogadores)

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
    "/{data_iso}/eventos/{evento_id}/partidas",
    response_model=PartidaOut,
    status_code=status.HTTP_201_CREATED,
)
def criar_partida(
    data_iso: str,
    evento_id: int,
    payload: PartidaCreate,
    db: Session = Depends(get_db),
) -> PartidaOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)
    _lock_evento_for_command(db, evento.id)
    partidas_service.validar_times_na_evento(
        db,
        evento_id=evento.id,
        time_a_id=payload.time_a_id,
        time_b_id=payload.time_b_id,
    )

    ordem = payload.ordem
    if ordem is None:
        ultima_ordem = db.query(func.max(PartidaModel.ordem)).filter(PartidaModel.evento_id == evento.id).scalar()
        ordem = int(ultima_ordem or 0) + 1

    ids_jogadores = [e.jogador_evento_id for e in payload.estatisticas]
    jogadores_por_id = partidas_service.mapear_jogadores_da_evento(db, evento.id, ids_jogadores)
    gols_a, gols_b = partidas_service.calcular_placar(
        payload.estatisticas,
        jogadores_por_id,
        payload.time_a_id,
        payload.time_b_id,
    )

    nova_partida = PartidaModel(
        evento_id=evento.id,
        ordem=ordem,
        time_a_id=payload.time_a_id,
        time_b_id=payload.time_b_id,
        gols_time_a=gols_a,
        gols_time_b=gols_b,
    )

    for estat in payload.estatisticas:
        nova_partida.estatisticas.append(
            EstatisticaModel(
                jogador_evento_id=estat.jogador_evento_id,
                gols=estat.gols,
                assistencias=estat.assistencias,
                chiliques=estat.chiliques,
                faltas=estat.faltas,
                nota=estat.nota,
            )
        )

    db.add(nova_partida)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ordem de partida mudou no servidor. Recarregue e tente novamente.",
        ) from exc
    db.refresh(nova_partida, attribute_names=["estatisticas"])
    return _to_partida_out(nova_partida)


@router.put("/{data_iso}/eventos/{evento_id}/partidas/{partida_id}", response_model=PartidaOut)
def atualizar_partida(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    payload: PartidaUpdate,
    db: Session = Depends(get_db),
) -> PartidaOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)

    partida = _obter_partida_na_evento_or_404(db, evento.id, partida_id)

    novo_time_a_id = payload.time_a_id if payload.time_a_id is not None else partida.time_a_id
    novo_time_b_id = payload.time_b_id if payload.time_b_id is not None else partida.time_b_id
    partidas_service.validar_times_na_evento(
        db,
        evento_id=evento.id,
        time_a_id=novo_time_a_id,
        time_b_id=novo_time_b_id,
    )

    if payload.ordem is not None:
        partida.ordem = payload.ordem

    if payload.estatisticas is not None:
        ids_jogadores = [e.jogador_evento_id for e in payload.estatisticas]
        jogadores_por_id = partidas_service.mapear_jogadores_da_evento(db, evento.id, ids_jogadores)
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
                    jogador_evento_id=estat.jogador_evento_id,
                    gols=estat.gols,
                    assistencias=estat.assistencias,
                    chiliques=estat.chiliques,
                    faltas=estat.faltas,
                    nota=estat.nota,
                )
            )
    else:
        ids_jogadores = [e.jogador_evento_id for e in partida.estatisticas]
        jogadores_por_id = partidas_service.mapear_jogadores_da_evento(db, evento.id, ids_jogadores)
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

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Partida ou estatisticas mudaram no servidor. Recarregue e tente novamente.",
        ) from exc
    db.refresh(partida, attribute_names=["estatisticas"])
    return _to_partida_out(partida)


@router.put(
    "/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/jogadores/{jogador_evento_id}/stats",
    response_model=CommandOkOut,
)
def atualizar_stats_jogador_partida(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    jogador_evento_id: int,
    payload: StatsJogadorIn,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)

    partida = _obter_partida_na_evento_or_404(db, evento.id, partida_id)

    jogador = (
        db.query(JogadorEventoModel)
        .filter(JogadorEventoModel.id == jogador_evento_id, JogadorEventoModel.evento_id == evento.id)
        .first()
    )
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador nao encontrado na evento")
    if jogador.time_id not in {partida.time_a_id, partida.time_b_id}:
        raise HTTPException(status_code=400, detail="Jogador nao pertence a nenhum time da partida")

    estat = (
        db.query(EstatisticaModel)
        .filter(
            EstatisticaModel.partida_id == partida.id,
            EstatisticaModel.jogador_evento_id == jogador.id,
        )
        .first()
    )

    if estat is None:
        estat = EstatisticaModel(
            partida_id=partida.id,
            jogador_evento_id=jogador.id,
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

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
        partida = _obter_partida_na_evento_or_404(db, evento.id, partida_id)
        estat = (
            db.query(EstatisticaModel)
            .filter(
                EstatisticaModel.partida_id == partida.id,
                EstatisticaModel.jogador_evento_id == jogador_evento_id,
            )
            .first()
        )
        if estat is None:
            raise HTTPException(
                status_code=409,
                detail="Estatisticas mudaram no servidor. Recarregue e tente novamente.",
            )
        estat.gols = payload.gols
        estat.assistencias = payload.assistencias
        estat.chiliques = payload.chiliques
        estat.faltas = payload.faltas
        db.flush()
    ids_jogadores = [e.jogador_evento_id for e in partida.estatisticas] + [jogador_evento_id]
    jogadores_por_id = partidas_service.mapear_jogadores_da_evento(db, evento.id, ids_jogadores)
    gols_a, gols_b = partidas_service.calcular_placar(
        partida.estatisticas,
        jogadores_por_id,
        partida.time_a_id,
        partida.time_b_id,
    )
    partida.gols_time_a = gols_a
    partida.gols_time_b = gols_b

    db.commit()
    current_version = partidas_service.calcular_version_atual(db, evento)
    return CommandOkOut(status="ok", version=current_version)


@router.delete("/{data_iso}/eventos/{evento_id}/partidas/{partida_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_partida(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> Response:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)

    partida = (
        db.query(PartidaModel)
        .filter(PartidaModel.id == partida_id, PartidaModel.evento_id == evento_id)
        .first()
    )
    if not partida:
        raise HTTPException(status_code=404, detail="Partida nao encontrada para esta evento")

    db.delete(partida)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start", response_model=CommandOkOut)
def iniciar_partida(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)
    partida = _obter_partida_na_evento_or_404(db, evento.id, partida_id)

    if evento.status != StatusEventoEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Evento precisa estar EM_ANDAMENTO para iniciar partida")
    if partida.status != PartidaStatusEnum.PLANEJADA:
        raise HTTPException(status_code=409, detail="Partida nao pode iniciar neste status")

    partida.status = PartidaStatusEnum.EM_ANDAMENTO
    partida.inicio_at = partida.inicio_at or datetime.now(timezone.utc)
    partida.fim_at = None
    db.commit()
    current_version = partidas_service.calcular_version_atual(db, evento)
    return CommandOkOut(status="ok", version=current_version)


@router.post("/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start", response_model=CommandOkOut)
def iniciar_partida_post(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    return iniciar_partida(data_iso=data_iso, evento_id=evento_id, partida_id=partida_id, db=db)


@router.put("/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end", response_model=CommandOkOut)
def encerrar_partida(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    partida = _obter_partida_na_evento_or_404(db, evento.id, partida_id)

    if partida.status != PartidaStatusEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Partida nao pode encerrar neste status")
    if evento.status not in {StatusEventoEnum.EM_ANDAMENTO, StatusEventoEnum.ENCERRADO}:
        raise HTTPException(
            status_code=409,
            detail="Partida so pode ser encerrada com evento EM_ANDAMENTO ou ENCERRADO",
        )
    if evento.status == StatusEventoEnum.EM_ANDAMENTO:
        dias_service.assert_evento_editavel(evento)

    partida.status = PartidaStatusEnum.ENCERRADA
    partida.fim_at = datetime.now(timezone.utc)
    db.commit()
    current_version = partidas_service.calcular_version_atual(db, evento)
    return CommandOkOut(status="ok", version=current_version)


@router.post("/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end", response_model=CommandOkOut)
def encerrar_partida_post(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    return encerrar_partida(data_iso=data_iso, evento_id=evento_id, partida_id=partida_id, db=db)
