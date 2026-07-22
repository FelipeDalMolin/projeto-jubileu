"""Capacidade de Partidas: lifecycle, estatisticas, placar e versao."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import zlib
from typing import Iterable, Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.dia_evento import (
    Evento as EventoModel,
    EstatisticaJogadorPartida as EstatisticaModel,
    JogadorEvento as JogadorEventoModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusEventoEnum,
    TeamConfig as TeamConfigModel,
    TimeEvento as TimeEventoModel,
)
from app.modules.eventos.core import lock_evento_for_command
from app.schemas.dia_evento import (
    CommandOkOut,
    EstatisticaJogadorPartidaBase,
    PartidaCreate,
    PartidaOut,
    PartidaUpdate,
    StatsJogadorIn,
)


def validar_times_na_evento(db: Session, evento_id: int, time_a_id: int, time_b_id: int) -> None:
    if time_a_id == time_b_id:
        raise HTTPException(status_code=400, detail="time_a_id e time_b_id devem ser diferentes")

    times = (
        db.query(TimeEventoModel)
        .filter(
            TimeEventoModel.evento_id == evento_id,
            TimeEventoModel.id.in_([time_a_id, time_b_id]),
        )
        .all()
    )
    if len(times) != 2:
        raise HTTPException(status_code=400, detail="Times informados nao pertencem a evento")


def mapear_jogadores_da_evento(
    db: Session,
    evento_id: int,
    jogador_ids: list[int],
) -> dict[int, JogadorEventoModel]:
    if not jogador_ids:
        return {}

    jogadores = (
        db.query(JogadorEventoModel)
        .filter(
            JogadorEventoModel.evento_id == evento_id,
            JogadorEventoModel.id.in_(jogador_ids),
        )
        .all()
    )

    encontrados = {j.id for j in jogadores}
    faltantes = set(jogador_ids) - encontrados
    if faltantes:
        faltantes_str = ", ".join(str(jid) for jid in sorted(faltantes))
        raise HTTPException(
            status_code=400,
            detail=f"Jogador(es) nao encontrado(s) na evento: {faltantes_str}",
        )

    return {j.id: j for j in jogadores}


def calcular_placar(
    estatisticas: Iterable[EstatisticaModel | EstatisticaJogadorPartidaBase],
    jogadores_por_id: dict[int, JogadorEventoModel],
    time_a_id: int,
    time_b_id: int,
) -> tuple[int, int]:
    gols_a = 0
    gols_b = 0

    for estat in estatisticas:
        jogador = jogadores_por_id.get(estat.jogador_evento_id)
        if not jogador:
            raise HTTPException(
                status_code=400,
                detail=f"Jogador {estat.jogador_evento_id} nao pertence a evento",
            )

        if jogador.time_id is None:
            raise HTTPException(
                status_code=400,
                detail=f"Jogador {jogador.id} nao possui time na evento",
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


def calcular_version_atual(db: Session, evento: EventoModel) -> Optional[int]:
    team_config = (
        db.query(TeamConfigModel)
        .filter(TeamConfigModel.evento_id == evento.id, TeamConfigModel.is_active.is_(True))
        .order_by(TeamConfigModel.version.desc(), TeamConfigModel.id.desc())
        .first()
    )
    base_version = int(team_config.version) if team_config and team_config.version is not None else 0

    partidas_db = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.estatisticas))
        .filter(PartidaModel.evento_id == evento.id)
        .order_by(PartidaModel.ordem.asc(), PartidaModel.id.asc())
        .all()
    )

    partidas_version_payload: list = []
    for partida in partidas_db:
        partidas_version_payload.append(
            [
                partida.id,
                partida.ordem,
                partida.time_a_id,
                partida.time_b_id,
                [
                    [
                        estat.jogador_evento_id,
                        estat.gols,
                        estat.assistencias,
                        estat.chiliques,
                        estat.faltas,
                    ]
                    for estat in sorted(
                        partida.estatisticas,
                        key=lambda e: (e.id or 0, e.jogador_evento_id),
                    )
                ],
            ]
        )

    if partidas_version_payload:
        partidas_crc32 = zlib.crc32(
            json.dumps(partidas_version_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ) & 0xFFFFFFFF
    else:
        partidas_crc32 = 0

    return (base_version << 32) | partidas_crc32


def _to_partida_out(partida: PartidaModel) -> PartidaOut:
    return PartidaOut.model_validate(partida, from_attributes=True)


def _obter_partida_na_evento_or_404(
    db: Session,
    evento_id: int,
    partida_id: int,
    *,
    for_update: bool = False,
) -> PartidaModel:
    query = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.estatisticas))
        .filter(PartidaModel.id == partida_id, PartidaModel.evento_id == evento_id)
    )
    if for_update:
        query = query.with_for_update()
    partida = query.first()
    if not partida:
        raise HTTPException(status_code=404, detail="Partida nao encontrada para esta evento")
    return partida


def _prepare_evento_for_mutation(db: Session, evento: EventoModel) -> None:
    lock_evento_for_command(db, evento.id)
    db.refresh(evento)
    if evento.status == StatusEventoEnum.ENCERRADO:
        raise HTTPException(status_code=409, detail="Evento encerrado: alteracoes nao permitidas")


def _validate_unique_stats(estatisticas: Iterable[EstatisticaJogadorPartidaBase]) -> list[int]:
    jogador_ids = [int(item.jogador_evento_id) for item in estatisticas]
    if len(jogador_ids) != len(set(jogador_ids)):
        raise HTTPException(status_code=400, detail="Jogador duplicado nas estatisticas da partida")
    return jogador_ids


def _apply_stat_values(
    estatistica: EstatisticaModel,
    payload: EstatisticaJogadorPartidaBase | StatsJogadorIn,
) -> None:
    estatistica.gols = payload.gols
    estatistica.assistencias = payload.assistencias
    estatistica.chiliques = payload.chiliques
    estatistica.faltas = payload.faltas
    if isinstance(payload, EstatisticaJogadorPartidaBase):
        estatistica.nota = payload.nota


def _replace_estatisticas(
    db: Session,
    partida: PartidaModel,
    estatisticas: list[EstatisticaJogadorPartidaBase],
) -> None:
    atuais = {item.jogador_evento_id: item for item in partida.estatisticas}
    recebidos = {item.jogador_evento_id for item in estatisticas}
    for jogador_evento_id, estatistica in list(atuais.items()):
        if jogador_evento_id not in recebidos:
            db.delete(estatistica)
    db.flush()

    for payload in estatisticas:
        estatistica = atuais.get(payload.jogador_evento_id)
        if estatistica is None:
            estatistica = EstatisticaModel(
                partida_id=partida.id,
                jogador_evento_id=payload.jogador_evento_id,
            )
            db.add(estatistica)
        _apply_stat_values(estatistica, payload)
    db.flush()
    db.refresh(partida, attribute_names=["estatisticas"])


def _recalcular_placar(db: Session, evento_id: int, partida: PartidaModel) -> None:
    jogador_ids = [item.jogador_evento_id for item in partida.estatisticas]
    jogadores_por_id = mapear_jogadores_da_evento(db, evento_id, jogador_ids)
    gols_a, gols_b = calcular_placar(
        partida.estatisticas,
        jogadores_por_id,
        partida.time_a_id,
        partida.time_b_id,
    )
    partida.gols_time_a = gols_a
    partida.gols_time_b = gols_b


def listar_partidas_flow(db: Session, evento: EventoModel) -> list[PartidaOut]:
    partidas = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.estatisticas))
        .filter(PartidaModel.evento_id == evento.id)
        .order_by(PartidaModel.ordem.asc(), PartidaModel.id.asc())
        .all()
    )
    jogador_ids = [item.jogador_evento_id for partida in partidas for item in partida.estatisticas]
    jogadores_por_id = mapear_jogadores_da_evento(db, evento.id, jogador_ids)
    for partida in partidas:
        gols_a, gols_b = calcular_placar(
            partida.estatisticas,
            jogadores_por_id,
            partida.time_a_id,
            partida.time_b_id,
        )
        partida.gols_time_a = gols_a
        partida.gols_time_b = gols_b
    return [_to_partida_out(partida) for partida in partidas]


def criar_partida_flow(db: Session, evento: EventoModel, payload: PartidaCreate) -> PartidaOut:
    _prepare_evento_for_mutation(db, evento)
    validar_times_na_evento(db, evento.id, payload.time_a_id, payload.time_b_id)
    jogador_ids = _validate_unique_stats(payload.estatisticas)
    jogadores_por_id = mapear_jogadores_da_evento(db, evento.id, jogador_ids)
    gols_a, gols_b = calcular_placar(
        payload.estatisticas,
        jogadores_por_id,
        payload.time_a_id,
        payload.time_b_id,
    )

    ordem = payload.ordem
    if ordem is None:
        ultima_ordem = (
            db.query(func.max(PartidaModel.ordem))
            .filter(PartidaModel.evento_id == evento.id)
            .scalar()
        )
        ordem = int(ultima_ordem or 0) + 1

    partida = PartidaModel(
        evento_id=evento.id,
        ordem=ordem,
        time_a_id=payload.time_a_id,
        time_b_id=payload.time_b_id,
        gols_time_a=gols_a,
        gols_time_b=gols_b,
    )
    try:
        with db.begin_nested():
            db.add(partida)
            db.flush()
            _replace_estatisticas(db, partida, payload.estatisticas)
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Ordem de partida mudou no servidor. Recarregue e tente novamente.",
        ) from exc

    db.commit()
    db.refresh(partida, attribute_names=["estatisticas"])
    return _to_partida_out(partida)


def atualizar_partida_flow(
    db: Session,
    evento: EventoModel,
    partida_id: int,
    payload: PartidaUpdate,
) -> PartidaOut:
    _prepare_evento_for_mutation(db, evento)
    partida = _obter_partida_na_evento_or_404(db, evento.id, partida_id, for_update=True)
    novo_time_a_id = payload.time_a_id if payload.time_a_id is not None else partida.time_a_id
    novo_time_b_id = payload.time_b_id if payload.time_b_id is not None else partida.time_b_id
    validar_times_na_evento(db, evento.id, novo_time_a_id, novo_time_b_id)

    if payload.estatisticas is not None:
        jogador_ids = _validate_unique_stats(payload.estatisticas)
        mapear_jogadores_da_evento(db, evento.id, jogador_ids)

    try:
        with db.begin_nested():
            if payload.ordem is not None:
                partida.ordem = payload.ordem
            partida.time_a_id = novo_time_a_id
            partida.time_b_id = novo_time_b_id
            if payload.estatisticas is not None:
                _replace_estatisticas(db, partida, payload.estatisticas)
            _recalcular_placar(db, evento.id, partida)
            db.flush()
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Partida ou estatisticas mudaram no servidor. Recarregue e tente novamente.",
        ) from exc

    db.commit()
    db.refresh(partida, attribute_names=["estatisticas"])
    return _to_partida_out(partida)


def atualizar_stats_jogador_flow(
    db: Session,
    evento: EventoModel,
    partida_id: int,
    jogador_evento_id: int,
    payload: StatsJogadorIn,
) -> CommandOkOut:
    _prepare_evento_for_mutation(db, evento)
    partida = _obter_partida_na_evento_or_404(db, evento.id, partida_id, for_update=True)
    jogador = (
        db.query(JogadorEventoModel)
        .filter(
            JogadorEventoModel.id == jogador_evento_id,
            JogadorEventoModel.evento_id == evento.id,
        )
        .first()
    )
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador nao encontrado na evento")
    if jogador.time_id not in {partida.time_a_id, partida.time_b_id}:
        raise HTTPException(status_code=400, detail="Jogador nao pertence a nenhum time da partida")

    try:
        with db.begin_nested():
            estatistica = (
                db.query(EstatisticaModel)
                .filter(
                    EstatisticaModel.partida_id == partida.id,
                    EstatisticaModel.jogador_evento_id == jogador.id,
                )
                .first()
            )
            if estatistica is None:
                estatistica = EstatisticaModel(
                    partida_id=partida.id,
                    jogador_evento_id=jogador.id,
                )
                db.add(estatistica)
            _apply_stat_values(estatistica, payload)
            db.flush()
            db.refresh(partida, attribute_names=["estatisticas"])
            _recalcular_placar(db, evento.id, partida)
            db.flush()
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Estatisticas mudaram no servidor. Recarregue e tente novamente.",
        ) from exc

    db.commit()
    return CommandOkOut(status="ok", version=calcular_version_atual(db, evento))


def deletar_partida_flow(db: Session, evento: EventoModel, partida_id: int) -> None:
    _prepare_evento_for_mutation(db, evento)
    partida = _obter_partida_na_evento_or_404(db, evento.id, partida_id, for_update=True)
    db.delete(partida)
    db.commit()


def iniciar_partida_flow(db: Session, evento: EventoModel, partida_id: int) -> CommandOkOut:
    _prepare_evento_for_mutation(db, evento)
    partida = _obter_partida_na_evento_or_404(db, evento.id, partida_id, for_update=True)
    if evento.status != StatusEventoEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Evento precisa estar EM_ANDAMENTO para iniciar partida")
    if partida.status != PartidaStatusEnum.PLANEJADA:
        raise HTTPException(status_code=409, detail="Partida nao pode iniciar neste status")

    partida_ativa = (
        db.query(PartidaModel.id)
        .filter(
            PartidaModel.evento_id == evento.id,
            PartidaModel.status == PartidaStatusEnum.EM_ANDAMENTO,
        )
        .first()
    )
    if partida_ativa:
        raise HTTPException(
            status_code=409,
            detail={"code": "active_match_conflict", "message": "Ja existe partida em andamento."},
        )

    try:
        with db.begin_nested():
            partida.status = PartidaStatusEnum.EM_ANDAMENTO
            partida.inicio_at = partida.inicio_at or datetime.now(timezone.utc)
            partida.fim_at = None
            db.flush()
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail={"code": "active_match_conflict", "message": "Outra partida foi iniciada."},
        ) from exc

    db.commit()
    return CommandOkOut(status="ok", version=calcular_version_atual(db, evento))


def encerrar_partida_flow(db: Session, evento: EventoModel, partida_id: int) -> CommandOkOut:
    lock_evento_for_command(db, evento.id)
    db.refresh(evento)
    partida = _obter_partida_na_evento_or_404(db, evento.id, partida_id, for_update=True)
    if partida.status != PartidaStatusEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Partida nao pode encerrar neste status")
    if evento.status not in {StatusEventoEnum.EM_ANDAMENTO, StatusEventoEnum.ENCERRADO}:
        raise HTTPException(
            status_code=409,
            detail="Partida so pode ser encerrada com evento EM_ANDAMENTO ou ENCERRADO",
        )

    partida.status = PartidaStatusEnum.ENCERRADA
    partida.fim_at = datetime.now(timezone.utc)
    db.commit()
    return CommandOkOut(status="ok", version=calcular_version_atual(db, evento))
