from __future__ import annotations

import json
import zlib
from typing import Iterable, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload

from app.models.dia_evento import (
    Evento as EventoModel,
    EstatisticaJogadorPartida as EstatisticaModel,
    JogadorEvento as JogadorEventoModel,
    Partida as PartidaModel,
    TeamConfig as TeamConfigModel,
    TimeEvento as TimeEventoModel,
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
    estatisticas: Iterable[EstatisticaModel],
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
