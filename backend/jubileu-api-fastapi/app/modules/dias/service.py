from __future__ import annotations

import json
import zlib
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import HTTPException, Response, status
from sqlalchemy.orm import Session, selectinload

from app.models.dia_aula import (
    Aula as AulaModel,
    Dia as DiaModel,
    JogadorAula as JogadorAulaModel,
    Partida as PartidaModel,
    StatusAulaEnum,
    TeamConfig as TeamConfigModel,
)
from app.schemas.dia_aula import (
    AulaEstadoOut,
    EquipesEstadoOut,
    EstatisticaJogadorPartidaOut,
    PartidaEstadoOut,
    PresencaJogadorDiaOut,
    TimeAulaOut,
)
from app.services.estado_equipes import rebuild_estado_equipes


def assert_aula_editavel(aula: AulaModel) -> None:
    if aula.status == StatusAulaEnum.CONCLUIDA:
        raise HTTPException(
            status_code=409,
            detail="Aula concluida: alteracoes nao permitidas",
        )


def get_dia_or_404(db: Session, data_iso: str) -> DiaModel:
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")
    return dia


def get_or_create_dia(db: Session, data_iso: str) -> DiaModel:
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if dia:
        return dia

    dia = DiaModel(data_iso=data_iso)
    db.add(dia)
    db.commit()
    db.refresh(dia)
    return dia


def get_aula_no_dia_or_404(
    db: Session,
    data_iso: str,
    aula_id: int,
    *,
    eager_jogadores: bool = False,
) -> AulaModel:
    dia = get_dia_or_404(db, data_iso)

    query = db.query(AulaModel)
    if eager_jogadores:
        query = query.options(selectinload(AulaModel.jogadores))

    aula = query.filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula nao encontrada para este dia")
    return aula


def get_active_team_config(db: Session, aula_id: int) -> TeamConfigModel | None:
    return (
        db.query(TeamConfigModel)
        .filter(TeamConfigModel.aula_id == aula_id, TeamConfigModel.is_active.is_(True))
        .order_by(TeamConfigModel.version.desc(), TeamConfigModel.id.desc())
        .first()
    )


def ensure_active_team_config(db: Session, aula: AulaModel) -> TeamConfigModel | None:
    team_config = get_active_team_config(db, aula.id)
    if team_config:
        return team_config

    db.refresh(aula, attribute_names=["jogadores", "times"])
    team_config = rebuild_estado_equipes(db, aula)
    db.commit()
    if team_config:
        db.refresh(team_config)
    return team_config


def build_estado_aula_response(
    db: Session,
    data_iso: str,
    aula: AulaModel,
    *,
    since_version: int | None,
    include_stats: bool,
) -> AulaEstadoOut | Response:
    team_config = ensure_active_team_config(db, aula)
    base_version = int(team_config.version) if team_config and team_config.version is not None else 0

    if team_config:
        estado_dict: dict[str, Any] = team_config.estado or {}
        jogadores_raw = estado_dict.get("jogadores", []) or []
        times_raw = estado_dict.get("times", []) or []
        jogadores = [PresencaJogadorDiaOut.model_validate(j) for j in jogadores_raw]
        times = [TimeAulaOut.model_validate(t) for t in times_raw]
        updated_at = team_config.created_at or datetime.fromtimestamp(0, timezone.utc)
    else:
        jogadores = []
        times = []
        updated_at = datetime.fromtimestamp(0, timezone.utc)

    partidas_db = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.estatisticas))
        .filter(PartidaModel.aula_id == aula.id)
        .order_by(PartidaModel.ordem.asc(), PartidaModel.id.asc())
        .all()
    )

    estat_ids = [
        estat.jogador_aula_id
        for partida in partidas_db
        for estat in partida.estatisticas
    ]

    jogadores_time_map: dict[int, Optional[int]] = {}
    if estat_ids:
        rows = (
            db.query(JogadorAulaModel.id, JogadorAulaModel.time_id)
            .filter(JogadorAulaModel.aula_id == aula.id)
            .filter(JogadorAulaModel.id.in_(estat_ids))
            .all()
        )
        jogadores_time_map = {row.id: row.time_id for row in rows}

    partidas_out: list[PartidaEstadoOut] = []
    partidas_version_payload: list = []

    for partida in partidas_db:
        gols_a = 0
        gols_b = 0
        for estat in partida.estatisticas:
            time_id = jogadores_time_map.get(estat.jogador_aula_id)
            if time_id == partida.time_a_id:
                gols_a += estat.gols
            elif time_id == partida.time_b_id:
                gols_b += estat.gols

        estat_out = (
            [EstatisticaJogadorPartidaOut.model_validate(estat) for estat in partida.estatisticas]
            if include_stats
            else None
        )

        partidas_out.append(
            PartidaEstadoOut(
                id=partida.id,
                ordem=partida.ordem,
                timeAId=str(partida.time_a_id),
                timeBId=str(partida.time_b_id),
                golsTimeA=gols_a,
                golsTimeB=gols_b,
                estatisticas=estat_out,
            )
        )

        partidas_version_payload.append(
            [
                partida.id,
                partida.ordem,
                partida.time_a_id,
                partida.time_b_id,
                gols_a,
                gols_b,
                [
                    [
                        estat.jogador_aula_id,
                        estat.gols,
                        estat.assistencias,
                        estat.chiliques,
                        estat.faltas,
                    ]
                    for estat in sorted(
                        partida.estatisticas,
                        key=lambda e: (e.id or 0, e.jogador_aula_id),
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

    current_version = (base_version << 32) | partidas_crc32
    if since_version is not None and since_version == current_version:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    dia = get_dia_or_404(db, data_iso)
    return AulaEstadoOut(
        aula_id=aula.id,
        data_iso=dia.data_iso,
        version=current_version,
        updated_at=updated_at,
        equipes=EquipesEstadoOut(jogadores=jogadores, times=times),
        partidas=partidas_out,
    )
