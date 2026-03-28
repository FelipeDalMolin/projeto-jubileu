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
from app.models.dia_aula import (
    Aula as AulaModel,
    Dia as DiaModel,
    JogadorAula as JogadorAulaModel,
    StatusAulaEnum,
    StatusPresencaEnum,
    TimeAula as TimeAulaModel,
)
from app.modules.dias import service as dias_service
from app.schemas.dia_aula import (
    AtualizarStatusJogadorIn,
    AulaCreate,
    AulaEstadoOut,
    AulaOut,
    CommandOkOut,
    ConfirmarPresencasIn,
    DiaListOut,
    DiaOut,
    EstadoEquipesAulaIn,
    EstadoEquipesAulaOut,
    MoverJogadorTimeIn,
    PresencaJogadorDiaOut,
    TimeAulaCreate,
    TimeAulaOut,
)
from app.schemas.workspace import WorkspaceAulaOut
from app.services.estado_equipes import create_team_config, rebuild_estado_equipes
from app.services.workspace_aula import build_workspace_aula

router = APIRouter(prefix="/dias", tags=["Dias"])


@router.get("/", response_model=List[DiaListOut])
def listar_dias(db: Session = Depends(get_db)) -> List[DiaListOut]:
    dias = db.query(DiaModel).order_by(DiaModel.data_iso.asc()).all()
    return [DiaListOut.model_validate(d, from_attributes=True) for d in dias]


@router.get("/{data_iso}", response_model=DiaOut)
def obter_dia_por_data(data_iso: str, db: Session = Depends(get_db)) -> DiaOut:
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
    dia = dias_service.get_or_create_dia(db, data_iso)

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
        db.add(
            JogadorAulaModel(
                aula_id=aula.id,
                jogador_id=jogador_id,
                nome=jogador_nome or f"Jogador {jogador_id}",
                status=StatusPresencaEnum.faltou,
            )
        )

    db.commit()
    db.refresh(aula, attribute_names=["jogadores"])
    return aula


@router.get("/{data_iso}/aulas/{aula_id}", response_model=AulaOut)
def obter_aula_no_dia(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> AulaOut:
    return dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id, eager_jogadores=True)


@router.put("/{data_iso}/aulas/{aula_id}/start", response_model=AulaOut)
def iniciar_aula(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> AulaOut:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id, eager_jogadores=True)

    if aula.status != StatusAulaEnum.PLANEJADA:
        raise HTTPException(
            status_code=400,
            detail="Aula nao pode ser iniciada: status atual diferente de PLANEJADA",
        )

    presentes_count = (
        db.query(JogadorAulaModel)
        .filter(JogadorAulaModel.aula_id == aula.id)
        .filter(JogadorAulaModel.status == StatusPresencaEnum.presente)
        .count()
    )
    if presentes_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Aula nao pode ser iniciada sem jogadores presentes",
        )

    db.query(JogadorAulaModel).filter(
        JogadorAulaModel.aula_id == aula.id,
        JogadorAulaModel.status != StatusPresencaEnum.presente,
    ).update({JogadorAulaModel.status: StatusPresencaEnum.faltou})

    aula.status = StatusAulaEnum.EM_ANDAMENTO
    db.add(aula)
    db.flush()
    rebuild_estado_equipes(db, aula)
    db.commit()
    db.refresh(aula, attribute_names=["jogadores"])
    return aula


@router.post("/{data_iso}/aulas/{aula_id}/start", response_model=AulaOut)
def iniciar_aula_post(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> AulaOut:
    return iniciar_aula(data_iso=data_iso, aula_id=aula_id, db=db)


@router.put("/{data_iso}/aulas/{aula_id}/finish", response_model=AulaOut)
def finalizar_aula(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> AulaOut:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id, eager_jogadores=True)

    if aula.status != StatusAulaEnum.EM_ANDAMENTO:
        raise HTTPException(
            status_code=400,
            detail="Aula nao pode ser finalizada: status atual diferente de EM_ANDAMENTO",
        )

    aula.status = StatusAulaEnum.CONCLUIDA
    db.add(aula)
    db.commit()
    db.refresh(aula, attribute_names=["jogadores"])
    return aula


@router.post("/{data_iso}/aulas/{aula_id}/finish", response_model=AulaOut)
def finalizar_aula_post(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> AulaOut:
    return finalizar_aula(data_iso=data_iso, aula_id=aula_id, db=db)


@router.put("/{data_iso}/aulas/{aula_id}/confirmar-presencas", response_model=CommandOkOut)
def confirmar_presencas(
    data_iso: str,
    aula_id: int,
    payload: ConfirmarPresencasIn,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    dias_service.assert_aula_editavel(aula)
    if aula.status != StatusAulaEnum.PLANEJADA:
        raise HTTPException(
            status_code=400,
            detail="Presencas so podem ser confirmadas com aula planejada",
        )

    presentes_ids = set(payload.presentes_ids or [])
    jogadores = db.query(JogadorAulaModel).filter(JogadorAulaModel.aula_id == aula.id).all()

    for jogador in jogadores:
        jogador.status = (
            StatusPresencaEnum.presente
            if jogador.id in presentes_ids
            else StatusPresencaEnum.faltou
        )

    db.flush()
    team_config = rebuild_estado_equipes(db, aula)
    db.commit()

    version = int(team_config.version) if team_config.version is not None else None
    return CommandOkOut(status="ok", version=version)


@router.delete("/{data_iso}/aulas/{aula_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_aula_no_dia(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> Response:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    db.delete(aula)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    dias_service.assert_aula_editavel(aula)

    novo_time = TimeAulaModel(
        aula_id=aula.id,
        nome=payload.nome,
        caracteristica=payload.caracteristica,
        cor_camisa=payload.cor_camisa,
    )
    db.add(novo_time)
    db.commit()
    db.refresh(novo_time)

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
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    dias_service.assert_aula_editavel(aula)

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
    team_config = rebuild_estado_equipes(db, aula)
    db.commit()
    db.refresh(team_config, attribute_names=["version"])

    version = int(team_config.version) if team_config.version is not None else None
    return CommandOkOut(status="ok", version=version)


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
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    dias_service.assert_aula_editavel(aula)

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
    team_config = rebuild_estado_equipes(db, aula)
    db.commit()
    db.refresh(team_config, attribute_names=["version"])

    version = int(team_config.version) if team_config.version is not None else None
    return CommandOkOut(status="ok", version=version)


@router.delete("/{data_iso}/aulas/{aula_id}/times/{time_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_time(
    data_iso: str,
    aula_id: int,
    time_id: int,
    db: Session = Depends(get_db),
) -> Response:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    dias_service.assert_aula_editavel(aula)

    time = (
        db.query(TimeAulaModel)
        .filter(TimeAulaModel.id == time_id, TimeAulaModel.aula_id == aula.id)
        .first()
    )
    if not time:
        raise HTTPException(status_code=404, detail="Time nao encontrado")

    db.query(JogadorAulaModel).filter(
        JogadorAulaModel.aula_id == aula.id,
        JogadorAulaModel.time_id == time.id,
    ).update({JogadorAulaModel.time_id: None})

    db.delete(time)
    db.commit()

    db.refresh(aula, attribute_names=["times", "jogadores"])
    rebuild_estado_equipes(db, aula)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{data_iso}/aulas/{aula_id}/estado-equipes", response_model=EstadoEquipesAulaOut)
def obter_estado_equipes_aula(
    data_iso: str,
    aula_id: int,
    db: Session = Depends(get_db),
) -> EstadoEquipesAulaOut:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    team_config = dias_service.ensure_active_team_config(db, aula)

    if not team_config:
        return EstadoEquipesAulaOut(aula_id=aula.id, jogadores=[], times=[])

    estado_dict: dict[str, Any] = team_config.estado or {}
    jogadores_raw = estado_dict.get("jogadores", []) or []
    times_raw = estado_dict.get("times", []) or []

    jogadores = [PresencaJogadorDiaOut.model_validate(j) for j in jogadores_raw]
    times = [TimeAulaOut.model_validate(t) for t in times_raw]

    return EstadoEquipesAulaOut(aula_id=aula.id, jogadores=jogadores, times=times)


@router.put("/{data_iso}/aulas/{aula_id}/estado-equipes", response_model=EstadoEquipesAulaOut)
def salvar_estado_equipes_aula(
    data_iso: str,
    aula_id: int,
    payload: EstadoEquipesAulaIn,
    db: Session = Depends(get_db),
) -> EstadoEquipesAulaOut:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    dias_service.assert_aula_editavel(aula)

    estado_dict: dict[str, Any] = {
        "jogadores": [j.model_dump() for j in payload.jogadores],
        "times": [t.model_dump() for t in payload.times],
    }

    team_config = create_team_config(db, aula, estado_dict)
    db.commit()
    db.refresh(team_config)

    jogadores = [PresencaJogadorDiaOut.model_validate(j) for j in estado_dict["jogadores"]]
    times = [TimeAulaOut.model_validate(t) for t in estado_dict["times"]]

    return EstadoEquipesAulaOut(aula_id=aula.id, jogadores=jogadores, times=times)


@router.get("/{data_iso}/aulas/{aula_id}/estado", response_model=AulaEstadoOut)
def obter_estado_aula(
    data_iso: str,
    aula_id: int,
    since_version: int | None = None,
    include_stats: bool = False,
    db: Session = Depends(get_db),
) -> AulaEstadoOut | Response:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    return dias_service.build_estado_aula_response(
        db,
        data_iso,
        aula,
        since_version=since_version,
        include_stats=include_stats,
    )


@router.get("/{data_iso}/aulas/{aula_id}/workspace", response_model=WorkspaceAulaOut)
def obter_workspace_aula(
    data_iso: str,
    aula_id: int,
    since_version: int | None = None,
    db: Session = Depends(get_db),
) -> WorkspaceAulaOut | Response:
    aula = dias_service.get_aula_no_dia_or_404(db, data_iso, aula_id)
    workspace = build_workspace_aula(db, aula)
    if since_version is not None and since_version == workspace.meta.version:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return workspace
