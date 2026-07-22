from __future__ import annotations

import json
import zlib
from typing import Any, List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models.dia_evento import (
    Evento as EventoModel,
    Dia as DiaModel,
    JogadorEvento as JogadorEventoModel,
    Lance as LanceModel,
    Partida as PartidaModel,
    StatusPresencaEnum,
    TeamConfig as TeamConfigModel,
)
from app.schemas.dia_evento import PartidaEstadoOut, PresencaJogadorDiaOut, TimeEventoOut
from app.schemas.workspace import (
    WorkspaceEventoEquipesOut,
    WorkspaceEventoHeaderOut,
    WorkspaceEventoKpisOut,
    WorkspaceEventoMetaOut,
    WorkspaceEventoOut,
    WorkspaceEventoWarningOut,
)
from app.modules.eventos.teams import rebuild_estado_equipes


def _carregar_snapshot_equipes(
    db: Session,
    evento: EventoModel,
) -> tuple[List[PresencaJogadorDiaOut], List[TimeEventoOut], int]:
    team_config = (
        db.query(TeamConfigModel)
        .filter(TeamConfigModel.evento_id == evento.id, TeamConfigModel.is_active.is_(True))
        .order_by(TeamConfigModel.version.desc(), TeamConfigModel.id.desc())
        .first()
    )

    if not team_config:
        db.refresh(evento, attribute_names=["jogadores", "times"])
        team_config = rebuild_estado_equipes(db, evento)
        db.flush()

    base_version = int(team_config.version) if team_config and team_config.version is not None else 0

    if team_config:
        estado_dict: dict[str, Any] = team_config.estado or {}
        jogadores_raw = estado_dict.get("jogadores", []) or []
        times_raw = estado_dict.get("times", []) or []
        jogadores = [PresencaJogadorDiaOut.model_validate(j) for j in jogadores_raw]
        times = [TimeEventoOut.model_validate(t) for t in times_raw]
    else:
        jogadores = []
        times = []

    return jogadores, times, base_version


def _carregar_partidas(
    db: Session,
    evento: EventoModel,
) -> tuple[List[PartidaEstadoOut], int]:
    partidas_db = (
        db.query(PartidaModel)
        .options(
            selectinload(PartidaModel.estatisticas),
            selectinload(PartidaModel.lances),
        )
        .filter(PartidaModel.evento_id == evento.id)
        .order_by(PartidaModel.ordem.asc(), PartidaModel.id.asc())
        .all()
    )

    estat_ids = [
        estat.jogador_evento_id
        for partida in partidas_db
        for estat in partida.estatisticas
    ]

    jogador_evento_rows = (
        db.query(JogadorEventoModel.id, JogadorEventoModel.jogador_id, JogadorEventoModel.time_id)
        .filter(JogadorEventoModel.evento_id == evento.id)
        .all()
    )
    jogadores_time_map: dict[int, Optional[int]] = {
        int(row.id): row.time_id for row in jogador_evento_rows
    }
    jogadores_global_time_map: dict[int, Optional[int]] = {
        int(row.jogador_id): row.time_id
        for row in jogador_evento_rows
        if row.jogador_id is not None
    }

    partidas_out: List[PartidaEstadoOut] = []
    partidas_version_payload: list = []

    for partida in partidas_db:
        gols_a_stats = 0
        gols_b_stats = 0
        for estat in partida.estatisticas:
            time_id = jogadores_time_map.get(estat.jogador_evento_id)
            if time_id == partida.time_a_id:
                gols_a_stats += estat.gols
            elif time_id == partida.time_b_id:
                gols_b_stats += estat.gols

        gols_a_lances = 0
        gols_b_lances = 0
        for lance in partida.lances:
            if lance.is_deleted:
                continue
            if (lance.tipo or "").upper() != "GOL":
                continue

            time_id: int | None = None
            if isinstance(lance.payload, dict):
                raw_time_id = lance.payload.get("time_id")
                if raw_time_id is not None:
                    try:
                        time_id = int(raw_time_id)
                    except (TypeError, ValueError):
                        time_id = None

            if time_id is None and lance.jogador_id is not None:
                time_id = jogadores_global_time_map.get(int(lance.jogador_id))

            if time_id == partida.time_a_id:
                gols_a_lances += 1
            elif time_id == partida.time_b_id:
                gols_b_lances += 1

        if gols_a_lances > 0 or gols_b_lances > 0:
            gols_a = gols_a_lances
            gols_b = gols_b_lances
        else:
            gols_a = gols_a_stats
            gols_b = gols_b_stats

        partidas_out.append(
            PartidaEstadoOut(
                id=partida.id,
                ordem=partida.ordem,
                status=partida.status,
                inicio_at=partida.inicio_at,
                fim_at=partida.fim_at,
                timeAId=str(partida.time_a_id),
                timeBId=str(partida.time_b_id),
                golsTimeA=gols_a,
                golsTimeB=gols_b,
                estatisticas=None,
            )
        )

        partidas_version_payload.append(
            [
                partida.id,
                partida.ordem,
                partida.status.value if hasattr(partida.status, "value") else str(partida.status),
                partida.time_a_id,
                partida.time_b_id,
                gols_a,
                gols_b,
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
                [
                    [
                        lance.id,
                        lance.tipo,
                        lance.jogador_id,
                        lance.payload,
                        lance.is_deleted,
                    ]
                    for lance in sorted(
                        partida.lances,
                        key=lambda l: (l.created_at or 0, l.id or 0),
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

    return partidas_out, partidas_crc32


def _montar_header(evento: EventoModel) -> WorkspaceEventoHeaderOut:
    if evento.turma_nome:
        titulo = f"Evento #{evento.numero_evento_na_turma} - {evento.turma_nome}"
    else:
        tipo = evento.tipo.value if hasattr(evento.tipo, "value") else str(evento.tipo)
        titulo = f"Evento #{evento.id} - {tipo.replace('_', ' ').title()}"
    return WorkspaceEventoHeaderOut(
        titulo=titulo,
        horario_inicio=evento.horario_inicio,
        horario_fim=evento.horario_fim,
    )


def _calcular_kpis(db: Session, evento: EventoModel) -> WorkspaceEventoKpisOut:
    total_jogadores = (
        db.query(func.count(JogadorEventoModel.id))
        .filter(JogadorEventoModel.evento_id == evento.id)
        .scalar()
    )

    presentes = (
        db.query(func.count(JogadorEventoModel.id))
        .filter(JogadorEventoModel.evento_id == evento.id)
        .filter(JogadorEventoModel.status == StatusPresencaEnum.presente)
        .scalar()
    )

    gols_total = (
        db.query(func.coalesce(func.sum(PartidaModel.gols_time_a + PartidaModel.gols_time_b), 0))
        .filter(PartidaModel.evento_id == evento.id)
        .scalar()
    )

    return WorkspaceEventoKpisOut(
        presentes=int(presentes or 0),
        total_jogadores=int(total_jogadores or 0),
        gols_total=int(gols_total or 0),
    )


def _montar_warnings(
    jogadores: List[PresencaJogadorDiaOut],
    times: List[TimeEventoOut],
    partidas: List[PartidaEstadoOut],
) -> List[WorkspaceEventoWarningOut]:
    warnings: List[WorkspaceEventoWarningOut] = []

    presentes = [j for j in jogadores if j.status == StatusPresencaEnum.presente]

    if any(j.timeId is None for j in presentes):
        warnings.append(
            WorkspaceEventoWarningOut(
                code="PLAYER_WITHOUT_TEAM",
                message="Ha jogadores presentes sem time.",
                severity="warning",
            )
        )

    if len(times) >= 2:
        tamanhos = [len(t.jogadoresIds) for t in times]
        if tamanhos:
            if max(tamanhos) - min(tamanhos) > 1:
                warnings.append(
                    WorkspaceEventoWarningOut(
                        code="UNBALANCED_TEAMS",
                        message="Times desbalanceados.",
                        severity="warning",
                    )
                )

    if not presentes:
        warnings.append(
            WorkspaceEventoWarningOut(
                code="NO_PLAYERS_PRESENT",
                message="Nenhum jogador presente.",
                severity="info",
            )
        )

    if not partidas:
        warnings.append(
            WorkspaceEventoWarningOut(
                code="NO_MATCHES",
                message="Evento sem partidas.",
                severity="info",
            )
        )

    return warnings


def build_workspace_evento(db: Session, evento: EventoModel) -> WorkspaceEventoOut:
    dia = (
        db.query(DiaModel)
        .filter(DiaModel.id == evento.dia_id)
        .first()
    )
    data_iso = dia.data_iso if dia else ""

    jogadores, times, base_version = _carregar_snapshot_equipes(db, evento)
    partidas_out, partidas_crc32 = _carregar_partidas(db, evento)
    event_meta_payload = [
        evento.status.value if hasattr(evento.status, "value") else str(evento.status),
        evento.tipo.value if hasattr(evento.tipo, "value") else str(evento.tipo),
        evento.horario_inicio,
        evento.horario_fim,
    ]
    event_meta_crc32 = zlib.crc32(
        json.dumps(event_meta_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ) & 0xFFFFFFFF
    content_crc32 = zlib.crc32(
        json.dumps([partidas_crc32, event_meta_crc32], separators=(",", ":")).encode("utf-8")
    ) & 0xFFFFFFFF
    current_version = (base_version << 32) | content_crc32

    meta = WorkspaceEventoMetaOut(
        id=evento.id,
        data_iso=data_iso,
        turma_id=evento.turma_id,
        status=evento.status,
        tipo=evento.tipo,
        version=current_version,
    )

    return WorkspaceEventoOut(
        meta=meta,
        header=_montar_header(evento),
        kpis=_calcular_kpis(db, evento),
        equipes=WorkspaceEventoEquipesOut(
            jogadores=jogadores,
            times=times,
        ),
        partidas=partidas_out,
        eventos=[],
        warnings=_montar_warnings(jogadores, times, partidas_out),
    )
