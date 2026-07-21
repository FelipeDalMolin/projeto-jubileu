from __future__ import annotations

from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, selectinload

from app.deps import get_db
from app.models.jogador_turma import (
    Jogador as JogadorModel,
    Turma as TurmaModel,
    TurmaJogador as TurmaJogadorModel,
)
from app.models.dia_evento import (
    Evento as EventoModel,
    Dia as DiaModel,
    JogadorEvento as JogadorEventoModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusEventoEnum,
    StatusPresencaEnum,
    TimeEvento as TimeEventoModel,
    TipoEventoEnum,
)
from app.modules.dias import service as dias_service
from app.schemas.dia_evento import (
    AtualizarStatusJogadorIn,
    EventoCreate,
    EventoEstadoOut,
    EventoDiaOut,
    CommandOkOut,
    ConfirmarPresencasIn,
    DiaOut,
    EstadoEquipesEventoIn,
    EstadoEquipesEventoOut,
    MoverJogadorTimeIn,
    PresencaJogadorDiaOut,
    TimeEventoCreate,
    TimeEventoOut,
)
from app.schemas.workspace import WorkspaceEventoOut
from app.services.estado_equipes import create_team_config, rebuild_estado_equipes
from app.services.workspace_evento import build_workspace_evento

router = APIRouter(prefix="/dias", tags=["Dias"])


@router.get("/", response_model=List[DiaOut])
def listar_dias(db: Session = Depends(get_db)) -> List[DiaOut]:
    return (
        db.query(DiaModel)
        .options(selectinload(DiaModel.eventos).selectinload(EventoModel.jogadores))
        .order_by(DiaModel.data_iso.asc())
        .all()
    )


@router.get("/{data_iso}", response_model=DiaOut)
def obter_dia_por_data(data_iso: str, db: Session = Depends(get_db)) -> DiaOut:
    dia = (
        db.query(DiaModel)
        .options(selectinload(DiaModel.eventos).selectinload(EventoModel.jogadores))
        .filter(DiaModel.data_iso == data_iso)
        .first()
    )
    if not dia:
        dia = DiaModel(data_iso=data_iso)
        db.add(dia)
        db.commit()
        db.refresh(dia)
    return dia


@router.post(
    "/{data_iso}/eventos",
    response_model=EventoDiaOut,
    status_code=status.HTTP_201_CREATED,
)
def criar_evento_no_dia(
    data_iso: str,
    payload: EventoCreate,
    db: Session = Depends(get_db),
) -> EventoDiaOut:
    dia = dias_service.get_or_create_dia(db, data_iso)

    turma = None
    novo_numero = None
    if payload.tipo == TipoEventoEnum.AULA:
        if payload.turma_id is None:
            raise HTTPException(status_code=422, detail="turma_id e obrigatorio para evento do tipo AULA")
        turma = db.query(TurmaModel).filter(TurmaModel.id == payload.turma_id).first()
        if not turma:
            raise HTTPException(status_code=404, detail="Turma nao encontrada")

        ultima_evento = (
            db.query(EventoModel)
            .filter(EventoModel.turma_id == payload.turma_id)
            .order_by(EventoModel.numero_evento_na_turma.desc())
            .first()
        )
        novo_numero = (ultima_evento.numero_evento_na_turma or 0) + 1 if ultima_evento else 1
    elif payload.turma_id is not None:
        raise HTTPException(status_code=422, detail="turma_id so e aceito para evento do tipo AULA")

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=payload.turma_id if turma else None,
        turma_nome=turma.nome if turma else None,
        numero_evento_na_turma=novo_numero,
        tipo=payload.tipo,
        horario_inicio=payload.horario_inicio,
        horario_fim=payload.horario_fim,
        status=payload.status,
    )
    db.add(evento)
    db.flush()

    if turma:
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
            db.add(
                JogadorEventoModel(
                    evento_id=evento.id,
                    jogador_id=jogador_id,
                    nome=jogador_nome or f"Jogador {jogador_id}",
                    status=StatusPresencaEnum.so_treino,
                )
            )

    db.commit()
    db.refresh(evento, attribute_names=["jogadores"])
    return evento


@router.get("/{data_iso}/eventos/{evento_id}", response_model=EventoDiaOut)
def obter_evento_no_dia(
    data_iso: str,
    evento_id: int,
    db: Session = Depends(get_db),
) -> EventoDiaOut:
    return dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id, eager_jogadores=True)


@router.put("/{data_iso}/eventos/{evento_id}/start", response_model=EventoDiaOut)
def iniciar_evento(
    data_iso: str,
    evento_id: int,
    db: Session = Depends(get_db),
) -> EventoDiaOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id, eager_jogadores=True)

    if evento.status != StatusEventoEnum.PLANEJADO:
        raise HTTPException(
            status_code=400,
            detail="Evento nao pode ser iniciado: status atual diferente de PLANEJADO",
        )

    db.query(JogadorEventoModel).filter(
        JogadorEventoModel.evento_id == evento.id,
        JogadorEventoModel.status != StatusPresencaEnum.presente,
    ).update({JogadorEventoModel.status: StatusPresencaEnum.faltou})

    evento.status = StatusEventoEnum.EM_ANDAMENTO
    db.add(evento)
    db.flush()
    rebuild_estado_equipes(db, evento)
    db.commit()
    db.refresh(evento, attribute_names=["jogadores"])
    return evento


@router.post("/{data_iso}/eventos/{evento_id}/start", response_model=EventoDiaOut)
def iniciar_evento_post(
    data_iso: str,
    evento_id: int,
    db: Session = Depends(get_db),
) -> EventoDiaOut:
    return iniciar_evento(data_iso=data_iso, evento_id=evento_id, db=db)


@router.put("/{data_iso}/eventos/{evento_id}/finish", response_model=EventoDiaOut)
def finalizar_evento(
    data_iso: str,
    evento_id: int,
    db: Session = Depends(get_db),
) -> EventoDiaOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id, eager_jogadores=True)

    if evento.status != StatusEventoEnum.EM_ANDAMENTO:
        raise HTTPException(
            status_code=400,
            detail="Evento nao pode ser finalizado: status atual diferente de EM_ANDAMENTO",
        )

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
            detail="Encerre a partida em andamento antes de encerrar o evento",
        )

    evento.status = StatusEventoEnum.ENCERRADO
    db.add(evento)
    db.commit()
    db.refresh(evento, attribute_names=["jogadores"])
    return evento


@router.post("/{data_iso}/eventos/{evento_id}/finish", response_model=EventoDiaOut)
def finalizar_evento_post(
    data_iso: str,
    evento_id: int,
    db: Session = Depends(get_db),
) -> EventoDiaOut:
    return finalizar_evento(data_iso=data_iso, evento_id=evento_id, db=db)


@router.put("/{data_iso}/eventos/{evento_id}/confirmar-presencas", response_model=CommandOkOut)
def confirmar_presencas(
    data_iso: str,
    evento_id: int,
    payload: ConfirmarPresencasIn,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)
    if evento.status != StatusEventoEnum.PLANEJADO:
        raise HTTPException(
            status_code=400,
            detail="Presencas so podem ser confirmadas com evento planejado",
        )

    presentes_ids = set(payload.presentes_ids or [])
    jogadores = db.query(JogadorEventoModel).filter(JogadorEventoModel.evento_id == evento.id).all()

    for jogador in jogadores:
        jogador.status = (
            StatusPresencaEnum.presente
            if jogador.id in presentes_ids
            else StatusPresencaEnum.faltou
        )

    db.flush()
    team_config = rebuild_estado_equipes(db, evento)
    db.commit()

    version = int(team_config.version) if team_config.version is not None else None
    return CommandOkOut(status="ok", version=version)


@router.delete("/{data_iso}/eventos/{evento_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_evento_no_dia(
    data_iso: str,
    evento_id: int,
    db: Session = Depends(get_db),
) -> Response:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    db.delete(evento)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{data_iso}/eventos/{evento_id}/times",
    response_model=TimeEventoOut,
    status_code=status.HTTP_201_CREATED,
)
def criar_time_na_evento(
    data_iso: str,
    evento_id: int,
    payload: TimeEventoCreate,
    db: Session = Depends(get_db),
) -> TimeEventoOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)

    novo_time = TimeEventoModel(
        evento_id=evento.id,
        nome=payload.nome,
        caracteristica=payload.caracteristica,
        cor_camisa=payload.cor_camisa,
    )
    db.add(novo_time)
    db.commit()
    db.refresh(novo_time)

    db.refresh(evento, attribute_names=["times", "jogadores"])
    rebuild_estado_equipes(db, evento)
    db.commit()

    return TimeEventoOut(
        id=str(novo_time.id),
        nome=novo_time.nome,
        jogadoresIds=[],
        caracteristica=novo_time.caracteristica,
        corCamisa=novo_time.cor_camisa,
    )


@router.put(
    "/{data_iso}/eventos/{evento_id}/jogadores/{jogador_evento_id}/time",
    response_model=CommandOkOut,
)
def mover_jogador_para_time(
    data_iso: str,
    evento_id: int,
    jogador_evento_id: int,
    payload: MoverJogadorTimeIn,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)

    jogador = (
        db.query(JogadorEventoModel)
        .filter(JogadorEventoModel.id == jogador_evento_id, JogadorEventoModel.evento_id == evento.id)
        .first()
    )
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador nao encontrado na evento")

    novo_time_id = payload.time_id
    if novo_time_id is not None:
        time = (
            db.query(TimeEventoModel)
            .filter(TimeEventoModel.id == novo_time_id, TimeEventoModel.evento_id == evento.id)
            .first()
        )
        if not time:
            raise HTTPException(status_code=400, detail="Time informado nao pertence a evento")

    jogador.time_id = novo_time_id
    db.commit()

    db.refresh(evento, attribute_names=["times", "jogadores"])
    team_config = rebuild_estado_equipes(db, evento)
    db.commit()
    db.refresh(team_config, attribute_names=["version"])

    version = int(team_config.version) if team_config.version is not None else None
    return CommandOkOut(status="ok", version=version)


@router.put(
    "/{data_iso}/eventos/{evento_id}/jogadores/{jogador_evento_id}/status",
    response_model=CommandOkOut,
)
def atualizar_status_jogador(
    data_iso: str,
    evento_id: int,
    jogador_evento_id: int,
    payload: AtualizarStatusJogadorIn,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)

    jogador = (
        db.query(JogadorEventoModel)
        .filter(JogadorEventoModel.id == jogador_evento_id, JogadorEventoModel.evento_id == evento.id)
        .first()
    )
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador nao encontrado na evento")

    jogador.status = payload.status
    db.commit()

    db.refresh(evento, attribute_names=["times", "jogadores"])
    team_config = rebuild_estado_equipes(db, evento)
    db.commit()
    db.refresh(team_config, attribute_names=["version"])

    version = int(team_config.version) if team_config.version is not None else None
    return CommandOkOut(status="ok", version=version)


@router.delete("/{data_iso}/eventos/{evento_id}/times/{time_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_time(
    data_iso: str,
    evento_id: int,
    time_id: int,
    db: Session = Depends(get_db),
) -> Response:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)

    time = (
        db.query(TimeEventoModel)
        .filter(TimeEventoModel.id == time_id, TimeEventoModel.evento_id == evento.id)
        .first()
    )
    if not time:
        raise HTTPException(status_code=404, detail="Time nao encontrado")

    db.query(JogadorEventoModel).filter(
        JogadorEventoModel.evento_id == evento.id,
        JogadorEventoModel.time_id == time.id,
    ).update({JogadorEventoModel.time_id: None})

    db.delete(time)
    db.commit()

    db.refresh(evento, attribute_names=["times", "jogadores"])
    rebuild_estado_equipes(db, evento)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{data_iso}/eventos/{evento_id}/estado-equipes", response_model=EstadoEquipesEventoOut)
def obter_estado_equipes_evento(
    data_iso: str,
    evento_id: int,
    db: Session = Depends(get_db),
) -> EstadoEquipesEventoOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    team_config = dias_service.ensure_active_team_config(db, evento)

    if not team_config:
        return EstadoEquipesEventoOut(evento_id=evento.id, jogadores=[], times=[])

    estado_dict: dict[str, Any] = team_config.estado or {}
    jogadores_raw = estado_dict.get("jogadores", []) or []
    times_raw = estado_dict.get("times", []) or []

    jogadores = [PresencaJogadorDiaOut.model_validate(j) for j in jogadores_raw]
    times = [TimeEventoOut.model_validate(t) for t in times_raw]

    return EstadoEquipesEventoOut(evento_id=evento.id, jogadores=jogadores, times=times)


@router.put("/{data_iso}/eventos/{evento_id}/estado-equipes", response_model=EstadoEquipesEventoOut)
def salvar_estado_equipes_evento(
    data_iso: str,
    evento_id: int,
    payload: EstadoEquipesEventoIn,
    db: Session = Depends(get_db),
) -> EstadoEquipesEventoOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    dias_service.assert_evento_editavel(evento)

    estado_dict: dict[str, Any] = {
        "jogadores": [j.model_dump() for j in payload.jogadores],
        "times": [t.model_dump() for t in payload.times],
    }

    team_config = create_team_config(db, evento, estado_dict)
    db.commit()
    db.refresh(team_config)

    jogadores = [PresencaJogadorDiaOut.model_validate(j) for j in estado_dict["jogadores"]]
    times = [TimeEventoOut.model_validate(t) for t in estado_dict["times"]]

    return EstadoEquipesEventoOut(evento_id=evento.id, jogadores=jogadores, times=times)


@router.get("/{data_iso}/eventos/{evento_id}/estado", response_model=EventoEstadoOut)
def obter_estado_evento(
    data_iso: str,
    evento_id: int,
    since_version: int | None = None,
    include_stats: bool = False,
    db: Session = Depends(get_db),
) -> EventoEstadoOut | Response:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    return dias_service.build_estado_evento_response(
        db,
        data_iso,
        evento,
        since_version=since_version,
        include_stats=include_stats,
    )


@router.get("/{data_iso}/eventos/{evento_id}/workspace", response_model=WorkspaceEventoOut)
def obter_workspace_evento(
    data_iso: str,
    evento_id: int,
    since_version: int | None = None,
    db: Session = Depends(get_db),
) -> WorkspaceEventoOut | Response:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    workspace = build_workspace_evento(db, evento)
    if since_version is not None and since_version == workspace.meta.version:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return workspace
