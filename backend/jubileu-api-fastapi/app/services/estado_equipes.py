from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.dia_aula import (
    Aula as AulaModel,
    JogadorAula as JogadorAulaModel,
    TeamConfig as TeamConfigModel,
    TimeAula as TimeAulaModel,
)


def _next_team_config_version(db: Session, aula_id: int) -> int:
    last_version = (
        db.query(func.max(TeamConfigModel.version))
        .filter(TeamConfigModel.aula_id == aula_id)
        .scalar()
    )
    return int(last_version or 0) + 1


def _deactivate_team_configs(db: Session, aula_id: int) -> None:
    (
        db.query(TeamConfigModel)
        .filter(TeamConfigModel.aula_id == aula_id)
        .filter(TeamConfigModel.is_active.is_(True))
        .update({TeamConfigModel.is_active: False})
    )


def create_team_config(
    db: Session,
    aula: AulaModel,
    estado: dict,
) -> TeamConfigModel:
    version = _next_team_config_version(db, aula.id)
    _deactivate_team_configs(db, aula.id)

    config = TeamConfigModel(
        aula_id=aula.id,
        estado=estado,
        version=version,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(config)
    return config


def rebuild_estado_equipes(db: Session, aula: AulaModel) -> TeamConfigModel:
    """
    Reconstrói o snapshot de equipes a partir do estado atual de jogadores e times.
    Incrementa a versão sempre que reconstruído e atualiza o updated_at.
    """
    # Snapshot de jogadores
    jogadores_snapshot = []
    for jog in aula.jogadores:
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
    for t in aula.times:
        jogadores_ids = [j.id for j in aula.jogadores if j.time_id == t.id]
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

    return create_team_config(db, aula, estado)
