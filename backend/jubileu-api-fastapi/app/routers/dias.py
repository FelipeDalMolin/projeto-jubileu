# app/routers/dias.py

from __future__ import annotations

import json
import zlib
from datetime import datetime, timezone
from typing import Any, List, Optional, Sequence

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
    Partida as PartidaModel,
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
    AulaEstadoOut,
    PartidaEstadoOut,
    EstatisticaJogadorPartidaOut,
    EquipesEstadoOut,
    MoverJogadorTimeIn,
    AtualizarStatusJogadorIn,
    CommandOkOut,
)
from app.services.estado_equipes import rebuild_estado_equipes

router = APIRouter(
    prefix="/dias",
    tags=["Dias"],
)

# ---------------- DIA ----------------


@router.get("/", response_model=List[DiaOut])
def listar_dias(db: Session = Depends(get_db)) -> List[DiaOut]:
    """Lista todos os dias cadastrados (ordenados por data_iso)."""
    dias = (
        db.query(DiaModel)
        .options(selectinload(DiaModel.aulas).selectinload(AulaModel.jogadores))
        .order_by(DiaModel.data_iso.asc())
        .all()
    )
    return [DiaOut.model_validate(d, from_attributes=True) for d in dias]

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
    novo_numero = (ultima_aula.numero_aula_na_turma or 0) + 1 if ultima_aula else 1

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
        raise HTTPException(status_code=404, detail="Aula nao encontrada para este dia")
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
        raise HTTPException(status_code=404, detail="Aula nao encontrada para este dia")

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
        raise HTTPException(status_code=404, detail="Aula nao encontrada para este dia")

    novo_time = TimeAulaModel(
        aula_id=aula.id,
        nome=payload.nome,
        caracteristica=payload.caracteristica,
        cor_camisa=payload.cor_camisa,
    )
    db.add(novo_time)
    db.commit()
    db.refresh(novo_time)

    # Atualiza snapshot/version para refletir o novo time no polling de /estado
    db.refresh(aula, attribute_names=["times", "jogadores"])
    rebuild_estado_equipes(db, aula)
    db.commit()

    return TimeAulaOut(
        id=str(novo_time.id),
        nome=novo_time.nome,
        jogadoresIds=[],
        caracteristica=novo_time.caracteristica,
        corCamisa=novo_time.cor_camisa,
    )


# ---------------- COMANDOS DE EQUIPES / JOGADORES ----------------


@router.put(
    "/{data_iso}/aulas/{aula_id}/jogadores/{jogador_aula_id}/time",
    response_model=CommandOkOut,
)
def mover_jogador_para_time(
    data_iso: str,
    aula_id: int,
    jogador_aula_id: int,
    payload: MoverJogadorTimeIn,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )
    if not aula:
        raise HTTPException(status_code=404, detail="Aula nao encontrada para este dia")

    jogador = (
        db.query(JogadorAulaModel)
        .filter(JogadorAulaModel.id == jogador_aula_id, JogadorAulaModel.aula_id == aula.id)
        .first()
    )
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador nao encontrado na aula")

    novo_time_id = payload.time_id
    if novo_time_id is not None:
        time = (
            db.query(TimeAulaModel)
            .filter(TimeAulaModel.id == novo_time_id, TimeAulaModel.aula_id == aula.id)
            .first()
        )
        if not time:
            raise HTTPException(status_code=400, detail="Time informado nao pertence a aula")

    jogador.time_id = novo_time_id
    db.commit()

    db.refresh(aula, attribute_names=["times", "jogadores"])
    estado_row = rebuild_estado_equipes(db, aula)
    db.commit()
    db.refresh(estado_row, attribute_names=["version"])

    return CommandOkOut(status="ok", version=int(estado_row.version) if estado_row.version is not None else None)


@router.put(
    "/{data_iso}/aulas/{aula_id}/jogadores/{jogador_aula_id}/status",
    response_model=CommandOkOut,
)
def atualizar_status_jogador(
    data_iso: str,
    aula_id: int,
    jogador_aula_id: int,
    payload: AtualizarStatusJogadorIn,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )
    if not aula:
        raise HTTPException(status_code=404, detail="Aula nao encontrada para este dia")

    jogador = (
        db.query(JogadorAulaModel)
        .filter(JogadorAulaModel.id == jogador_aula_id, JogadorAulaModel.aula_id == aula.id)
        .first()
    )
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador nao encontrado na aula")

    jogador.status = payload.status
    db.commit()

    db.refresh(aula, attribute_names=["times", "jogadores"])
    estado_row = rebuild_estado_equipes(db, aula)
    db.commit()
    db.refresh(estado_row, attribute_names=["version"])

    return CommandOkOut(status="ok", version=int(estado_row.version) if estado_row.version is not None else None)


@router.delete(
    "/{data_iso}/aulas/{aula_id}/times/{time_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def deletar_time(
    data_iso: str,
    aula_id: int,
    time_id: int,
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
        raise HTTPException(status_code=404, detail="Aula nao encontrada para este dia")

    time = (
        db.query(TimeAulaModel)
        .filter(TimeAulaModel.id == time_id, TimeAulaModel.aula_id == aula.id)
        .first()
    )
    if not time:
        raise HTTPException(status_code=404, detail="Time nao encontrado")

    db.query(JogadorAulaModel).filter(
        JogadorAulaModel.aula_id == aula.id, JogadorAulaModel.time_id == time.id
    ).update({JogadorAulaModel.time_id: None})

    db.delete(time)
    db.commit()

    db.refresh(aula, attribute_names=["times", "jogadores"])
    rebuild_estado_equipes(db, aula)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )
    if not aula:
        raise HTTPException(status_code=404, detail="Aula nao encontrada para este dia")

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

    if not estado_row:
        return EstadoEquipesAulaOut(aula_id=aula.id, jogadores=[], times=[])

    estado_dict: dict[str, Any] = estado_row.estado or {}
    jogadores_raw = estado_dict.get("jogadores", []) or []
    times_raw = estado_dict.get("times", []) or []

    jogadores = [PresencaJogadorDiaOut.model_validate(j) for j in jogadores_raw]
    times = [TimeAulaOut.model_validate(t) for t in times_raw]

    return EstadoEquipesAulaOut(aula_id=aula.id, jogadores=jogadores, times=times)


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
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )
    if not aula:
        raise HTTPException(status_code=404, detail="Aula nao encontrada para este dia")

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
        estado_row.version = (estado_row.version or 1) + 1
        estado_row.updated_at = datetime.now(timezone.utc)
    else:
        estado_row = AulaEquipesEstadoModel(
            aula_id=aula.id,
            estado=estado_dict,
            version=1,
            updated_at=datetime.now(timezone.utc),
        )
        db.add(estado_row)

    db.commit()
    db.refresh(estado_row)

    jogadores = [PresencaJogadorDiaOut.model_validate(j) for j in estado_dict["jogadores"]]
    times = [TimeAulaOut.model_validate(t) for t in estado_dict["times"]]

    return EstadoEquipesAulaOut(aula_id=aula.id, jogadores=jogadores, times=times)


# ---------------- ESTADO AGREGADO (POLLING) ----------------


@router.get(
    "/{data_iso}/aulas/{aula_id}/estado",
    response_model=AulaEstadoOut,
)
def obter_estado_aula(
    data_iso: str,
    aula_id: int,
    since_version: int | None = None,
    include_stats: bool = False,
    db: Session = Depends(get_db),
) -> AulaEstadoOut | Response:
    dia = db.query(DiaModel).filter(DiaModel.data_iso == data_iso).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia nao encontrado")

    aula = (
        db.query(AulaModel)
        .filter(AulaModel.id == aula_id, AulaModel.dia_id == dia.id)
        .first()
    )
    if not aula:
        raise HTTPException(status_code=404, detail="Aula nao encontrada para este dia")

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
        updated_at = estado_row.updated_at or datetime.fromtimestamp(0, timezone.utc)
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

    # ✅ Versão combinada estável: muda se equipes OU partidas mudarem
    current_version = (base_version << 32) | partidas_crc32

    if since_version is not None and since_version == current_version:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    return AulaEstadoOut(
        aula_id=aula.id,
        data_iso=dia.data_iso,
        version=current_version,
        updated_at=updated_at,
        equipes=EquipesEstadoOut(jogadores=jogadores, times=times),
        partidas=partidas_out,
    )
