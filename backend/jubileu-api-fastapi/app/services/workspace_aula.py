from __future__ import annotations

import json
import zlib
from typing import Any, List, Optional, Tuple

from sqlalchemy.orm import Session, selectinload

from app.models.dia_aula import (
    Aula as AulaModel,
    AulaEquipesEstado as AulaEquipesEstadoModel,
    Dia as DiaModel,
    JogadorAula as JogadorAulaModel,
    Partida as PartidaModel,
    StatusPresencaEnum,
)
from app.schemas.dia_aula import PartidaEstadoOut, PresencaJogadorDiaOut, TimeAulaOut
from app.schemas.workspace import (
    WorkspaceAulaEquipesOut,
    WorkspaceAulaHeaderOut,
    WorkspaceAulaKpisOut,
    WorkspaceAulaMetaOut,
    WorkspaceAulaOut,
)
from app.services.estado_equipes import rebuild_estado_equipes


def _carregar_snapshot_equipes(
    db: Session,
    aula: AulaModel,
) -> tuple[List[PresencaJogadorDiaOut], List[TimeAulaOut], int]:
    estado_row = (
        db.query(AulaEquipesEstadoModel)
        .filter(AulaEquipesEstadoModel.aula_id == aula.id)
        .first()
    )

    if not estado_row:
        db.refresh(aula, attribute_names=["jogadores", "times"])
        estado_row = rebuild_estado_equipes(db, aula)
        db.commit()
        db.refresh(estado_row)

    base_version = int(estado_row.version) if estado_row and estado_row.version is not None else 0

    if estado_row:
        estado_dict: dict[str, Any] = estado_row.estado or {}
        jogadores_raw = estado_dict.get("jogadores", []) or []
        times_raw = estado_dict.get("times", []) or []
        jogadores = [PresencaJogadorDiaOut.model_validate(j) for j in jogadores_raw]
        times = [TimeAulaOut.model_validate(t) for t in times_raw]
    else:
        jogadores = []
        times = []

    return jogadores, times, base_version


def _carregar_partidas(
    db: Session,
    aula: AulaModel,
) -> tuple[List[PartidaEstadoOut], int]:
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

    partidas_out: List[PartidaEstadoOut] = []
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

        partidas_out.append(
            PartidaEstadoOut(
                id=partida.id,
                ordem=partida.ordem,
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

    return partidas_out, partidas_crc32


def _montar_header(aula: AulaModel) -> WorkspaceAulaHeaderOut:
    titulo = f"Aula #{aula.numero_aula_na_turma} - {aula.turma_nome}"
    return WorkspaceAulaHeaderOut(
        titulo=titulo,
        horario_inicio=aula.horario_inicio,
        horario_fim=aula.horario_fim,
    )


def _montar_kpis(
    jogadores: List[PresencaJogadorDiaOut],
    partidas: List[PartidaEstadoOut],
) -> WorkspaceAulaKpisOut:
    presentes = sum(1 for j in jogadores if j.status == StatusPresencaEnum.presente)
    gols_total = sum(p.golsTimeA + p.golsTimeB for p in partidas)
    return WorkspaceAulaKpisOut(
        presentes=presentes,
        total_jogadores=len(jogadores),
        gols_total=gols_total,
    )


def build_workspace_aula(db: Session, aula: AulaModel) -> WorkspaceAulaOut:
    dia = (
        db.query(DiaModel)
        .filter(DiaModel.id == aula.dia_id)
        .first()
    )
    data_iso = dia.data_iso if dia else ""

    jogadores, times, base_version = _carregar_snapshot_equipes(db, aula)
    partidas_out, partidas_crc32 = _carregar_partidas(db, aula)
    current_version = (base_version << 32) | partidas_crc32

    meta = WorkspaceAulaMetaOut(
        id=aula.id,
        data_iso=data_iso,
        turma_id=aula.turma_id,
        status=aula.status,
        tipo=aula.tipo,
        version=current_version,
    )

    return WorkspaceAulaOut(
        meta=meta,
        header=_montar_header(aula),
        kpis=_montar_kpis(jogadores, partidas_out),
        equipes=WorkspaceAulaEquipesOut(
            jogadores=jogadores,
            times=times,
        ),
        partidas=partidas_out,
        eventos=[],
        warnings=[],
    )
