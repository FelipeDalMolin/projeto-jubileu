from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.dia_aula import (
    Aula as AulaModel,
    AulaEquipesEstado as AulaEquipesEstadoModel,
    JogadorAula as JogadorAulaModel,
    TimeAula as TimeAulaModel,
)


def rebuild_estado_equipes(db: Session, aula: AulaModel) -> AulaEquipesEstadoModel:
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

    estado_row = (
        db.query(AulaEquipesEstadoModel)
        .filter(AulaEquipesEstadoModel.aula_id == aula.id)
        .first()
    )

    now = datetime.now(timezone.utc)

    if estado_row is None:
        estado_row = AulaEquipesEstadoModel(
            aula_id=aula.id,
            estado=estado,
            version=1,
            updated_at=now,
        )
        db.add(estado_row)
    else:
        estado_row.estado = estado
        estado_row.version = (estado_row.version or 0) + 1
        estado_row.updated_at = now

    return estado_row
