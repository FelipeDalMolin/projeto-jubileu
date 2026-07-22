"""Times, presencas administrativas e snapshots de equipes de Evento."""

from __future__ import annotations

from datetime import datetime, timezone
import re
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.dia_evento import (
    Evento as EventoModel,
    JogadorEvento as JogadorEventoModel,
    StatusEventoEnum,
    StatusPresencaEnum,
    TeamConfig as TeamConfigModel,
    TimeEvento as TimeEventoModel,
)
from app.schemas.dia_evento import (
    AtualizarStatusJogadorIn,
    CommandOkOut,
    ConfirmarPresencasIn,
    EstadoEquipesEventoIn,
    EstadoEquipesEventoOut,
    MoverJogadorTimeIn,
    PresencaJogadorDiaOut,
    TimeEventoCreate,
    TimeEventoOut,
)


def _next_team_config_version(db: Session, evento_id: int) -> int:
    last_version = (
        db.query(func.max(TeamConfigModel.version))
        .filter(TeamConfigModel.evento_id == evento_id)
        .scalar()
    )
    return int(last_version or 0) + 1


def _deactivate_team_configs(db: Session, evento_id: int) -> None:
    (
        db.query(TeamConfigModel)
        .filter(TeamConfigModel.evento_id == evento_id)
        .filter(TeamConfigModel.is_active.is_(True))
        .update({TeamConfigModel.is_active: False})
    )


def create_team_config(
    db: Session,
    evento: EventoModel,
    estado: dict,
) -> TeamConfigModel:
    version = _next_team_config_version(db, evento.id)
    _deactivate_team_configs(db, evento.id)

    config = TeamConfigModel(
        evento_id=evento.id,
        estado=estado,
        version=version,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(config)
    return config


def rebuild_estado_equipes(db: Session, evento: EventoModel) -> TeamConfigModel:
    """
    Reconstrói o snapshot de equipes a partir do estado atual de jogadores e times.
    Incrementa a versão sempre que reconstruído e atualiza o updated_at.
    """
    # Snapshot de jogadores
    jogadores_snapshot = []
    for jog in evento.jogadores:
        jogadores_snapshot.append(
            {
                "jogadorId": jog.id,
                "nome": jog.nome,
                "status": jog.status,
                "atributos": {
                    "gols": getattr(jog, "gols", 0),
                    "assistencias": getattr(jog, "assistencias", 0),
                    "chiliques": getattr(jog, "chiliques", 0),
                    "faltas": getattr(jog, "faltas", 0),
                },
                "timeId": str(jog.time_id) if jog.time_id is not None else None,
            }
        )

    # Snapshot de times
    times_snapshot = []
    for t in evento.times:
        jogadores_ids = [j.id for j in evento.jogadores if j.time_id == t.id]
        times_snapshot.append(
            {
                "id": str(t.id),
                "nome": t.nome,
                "jogadoresIds": jogadores_ids,
                "caracteristica": t.caracteristica,
                "corCamisa": t.cor_camisa,
            }
        )

    estado = {"jogadores": jogadores_snapshot, "times": times_snapshot}

    return create_team_config(db, evento, estado)


def _lock_evento_for_command(db: Session, evento_id: int) -> None:
    db.query(EventoModel.id).filter(EventoModel.id == evento_id).with_for_update().one()


def _prepare_evento_for_mutation(db: Session, evento: EventoModel) -> None:
    _lock_evento_for_command(db, evento.id)
    db.refresh(evento)
    if evento.status == StatusEventoEnum.ENCERRADO:
        raise HTTPException(status_code=409, detail="Evento encerrado: alteracoes nao permitidas")


def _version_conflict(resource: str, expected: int | None, current: int | None) -> HTTPException:
    return HTTPException(
        status_code=409,
        detail={
            "code": "version_conflict",
            "resource": resource,
            "expected_version": expected,
            "current_version": current,
            "message": "Estado alterado no servidor. Recarregue antes de salvar novamente.",
        },
    )


def _nome_unico_time(db: Session, evento_id: int, nome_sugerido: str) -> str:
    base = (nome_sugerido or "").strip() or "Time"
    existentes = {
        str(row.nome)
        for row in db.query(TimeEventoModel.nome).filter(TimeEventoModel.evento_id == evento_id).all()
    }
    if base not in existentes:
        return base

    if re.fullmatch(r"Time(?:\s+\d+)?", base, flags=re.IGNORECASE):
        maior_idx = 0
        for nome in existentes:
            match = re.fullmatch(r"Time\s+(\d+)", nome.strip(), flags=re.IGNORECASE)
            if match:
                maior_idx = max(maior_idx, int(match.group(1)))
        while True:
            maior_idx += 1
            candidato = f"Time {maior_idx}"
            if candidato not in existentes:
                return candidato

    suffix = 2
    while True:
        candidato = f"{base} {suffix}"
        if candidato not in existentes:
            return candidato
        suffix += 1


def get_active_team_config(db: Session, evento_id: int) -> TeamConfigModel | None:
    return (
        db.query(TeamConfigModel)
        .filter(TeamConfigModel.evento_id == evento_id, TeamConfigModel.is_active.is_(True))
        .order_by(TeamConfigModel.version.desc(), TeamConfigModel.id.desc())
        .first()
    )


def ensure_active_team_config(db: Session, evento: EventoModel) -> TeamConfigModel | None:
    team_config = get_active_team_config(db, evento.id)
    if team_config:
        return team_config

    db.refresh(evento, attribute_names=["jogadores", "times"])
    team_config = rebuild_estado_equipes(db, evento)
    db.commit()
    db.refresh(team_config)
    return team_config


def confirmar_presencas_flow(
    db: Session,
    evento: EventoModel,
    payload: ConfirmarPresencasIn,
) -> CommandOkOut:
    _prepare_evento_for_mutation(db, evento)
    if evento.status != StatusEventoEnum.PLANEJADO:
        raise HTTPException(status_code=400, detail="Presencas so podem ser confirmadas com evento planejado")

    presentes_ids = set(payload.presentes_ids or [])
    jogadores = db.query(JogadorEventoModel).filter(JogadorEventoModel.evento_id == evento.id).all()
    for jogador in jogadores:
        jogador.status = (
            StatusPresencaEnum.presente if jogador.id in presentes_ids else StatusPresencaEnum.faltou
        )

    db.flush()
    team_config = rebuild_estado_equipes(db, evento)
    db.commit()
    version = int(team_config.version) if team_config.version is not None else None
    return CommandOkOut(status="ok", version=version)


def criar_time_flow(db: Session, evento: EventoModel, payload: TimeEventoCreate) -> TimeEventoOut:
    _prepare_evento_for_mutation(db, evento)
    novo_time = TimeEventoModel(
        evento_id=evento.id,
        nome=_nome_unico_time(db, evento.id, payload.nome),
        caracteristica=payload.caracteristica,
        cor_camisa=payload.cor_camisa,
    )
    try:
        with db.begin_nested():
            db.add(novo_time)
            db.flush()
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Nome de time ja existe neste evento. Recarregue e tente novamente.",
        ) from exc

    db.refresh(evento, attribute_names=["times", "jogadores"])
    rebuild_estado_equipes(db, evento)
    db.commit()
    db.refresh(novo_time)
    return TimeEventoOut(
        id=str(novo_time.id),
        nome=novo_time.nome,
        jogadoresIds=[],
        caracteristica=novo_time.caracteristica,
        corCamisa=novo_time.cor_camisa,
    )


def mover_jogador_flow(
    db: Session,
    evento: EventoModel,
    jogador_evento_id: int,
    payload: MoverJogadorTimeIn,
) -> CommandOkOut:
    _prepare_evento_for_mutation(db, evento)
    jogador = db.query(JogadorEventoModel).filter(
        JogadorEventoModel.id == jogador_evento_id,
        JogadorEventoModel.evento_id == evento.id,
    ).first()
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador nao encontrado na evento")

    if payload.time_id is not None:
        time = db.query(TimeEventoModel).filter(
            TimeEventoModel.id == payload.time_id,
            TimeEventoModel.evento_id == evento.id,
        ).first()
        if not time:
            raise HTTPException(status_code=400, detail="Time informado nao pertence a evento")

    jogador.time_id = payload.time_id
    db.flush()
    db.refresh(evento, attribute_names=["times", "jogadores"])
    team_config = rebuild_estado_equipes(db, evento)
    db.commit()
    db.refresh(team_config, attribute_names=["version"])
    return CommandOkOut(status="ok", version=int(team_config.version))


def atualizar_status_jogador_flow(
    db: Session,
    evento: EventoModel,
    jogador_evento_id: int,
    payload: AtualizarStatusJogadorIn,
) -> CommandOkOut:
    _prepare_evento_for_mutation(db, evento)
    jogador = db.query(JogadorEventoModel).filter(
        JogadorEventoModel.id == jogador_evento_id,
        JogadorEventoModel.evento_id == evento.id,
    ).first()
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador nao encontrado na evento")

    jogador.status = payload.status
    db.flush()
    db.refresh(evento, attribute_names=["times", "jogadores"])
    team_config = rebuild_estado_equipes(db, evento)
    db.commit()
    db.refresh(team_config, attribute_names=["version"])
    return CommandOkOut(status="ok", version=int(team_config.version))


def deletar_time_flow(db: Session, evento: EventoModel, time_id: int) -> None:
    _prepare_evento_for_mutation(db, evento)
    time = db.query(TimeEventoModel).filter(
        TimeEventoModel.id == time_id,
        TimeEventoModel.evento_id == evento.id,
    ).first()
    if not time:
        raise HTTPException(status_code=404, detail="Time nao encontrado")

    db.query(JogadorEventoModel).filter(
        JogadorEventoModel.evento_id == evento.id,
        JogadorEventoModel.time_id == time.id,
    ).update({JogadorEventoModel.time_id: None})
    db.delete(time)
    db.flush()
    db.refresh(evento, attribute_names=["times", "jogadores"])
    rebuild_estado_equipes(db, evento)
    db.commit()


def obter_estado_equipes_flow(db: Session, evento: EventoModel) -> EstadoEquipesEventoOut:
    team_config = ensure_active_team_config(db, evento)
    if not team_config:
        return EstadoEquipesEventoOut(evento_id=evento.id, jogadores=[], times=[], version=None)

    estado_dict: dict[str, Any] = team_config.estado or {}
    jogadores = [PresencaJogadorDiaOut.model_validate(item) for item in estado_dict.get("jogadores", []) or []]
    times = [TimeEventoOut.model_validate(item) for item in estado_dict.get("times", []) or []]
    version = int(team_config.version) if team_config.version is not None else None
    return EstadoEquipesEventoOut(evento_id=evento.id, jogadores=jogadores, times=times, version=version)


def salvar_estado_equipes_flow(
    db: Session,
    evento: EventoModel,
    payload: EstadoEquipesEventoIn,
) -> EstadoEquipesEventoOut:
    _prepare_evento_for_mutation(db, evento)
    current_config = get_active_team_config(db, evento.id)
    current_version = int(current_config.version) if current_config and current_config.version is not None else None
    if payload.expected_version is not None and payload.expected_version != current_version:
        raise _version_conflict("estado-equipes", payload.expected_version, current_version)

    estado_dict: dict[str, Any] = {
        "jogadores": [j.model_dump() for j in payload.jogadores],
        "times": [t.model_dump() for t in payload.times],
    }
    team_config = create_team_config(db, evento, estado_dict)
    db.commit()
    db.refresh(team_config)
    return EstadoEquipesEventoOut(
        evento_id=evento.id,
        jogadores=[PresencaJogadorDiaOut.model_validate(item) for item in estado_dict["jogadores"]],
        times=[TimeEventoOut.model_validate(item) for item in estado_dict["times"]],
        version=int(team_config.version) if team_config.version is not None else None,
    )
