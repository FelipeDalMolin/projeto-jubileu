"""Comandos canonicos de lifecycle de Evento."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.deps_auth import AuthUser, require_roles
from app.models.dia_evento import (
    EventoParticipante as EventoParticipanteModel,
    EventoParticipanteStatusEnum,
    JogadorEvento as JogadorEventoModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusEventoEnum,
    StatusPresencaEnum,
)
from app.modules.eventos.core import evento_out, get_evento_or_404
from app.schemas.eventos import EventoActionOut
from app.modules.eventos.teams import rebuild_estado_equipes


def start_evento_flow(db: Session, evento_id: int, user: AuthUser) -> EventoActionOut:
    require_roles(user, "admin", "treinador", "auxiliar")
    evento = get_evento_or_404(db, evento_id)
    if evento.status != StatusEventoEnum.PLANEJADO:
        raise HTTPException(status_code=409, detail="Evento nao pode iniciar neste status")

    db.query(JogadorEventoModel).filter(
        JogadorEventoModel.evento_id == evento.id,
        JogadorEventoModel.status != StatusPresencaEnum.presente,
    ).update({JogadorEventoModel.status: StatusPresencaEnum.faltou})

    evento.status = StatusEventoEnum.EM_ANDAMENTO
    db.add(evento)
    db.flush()
    rebuild_estado_equipes(db, evento)
    db.commit()
    db.refresh(evento)
    return EventoActionOut(evento=evento_out(evento))


def end_evento_flow(db: Session, evento_id: int, user: AuthUser) -> EventoActionOut:
    require_roles(user, "admin", "treinador", "auxiliar")
    evento = get_evento_or_404(db, evento_id)
    if evento.status != StatusEventoEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Evento nao pode ser encerrado neste status")

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
    no_show_updated = (
        db.query(EventoParticipanteModel)
        .filter(EventoParticipanteModel.evento_id == evento.id)
        .filter(EventoParticipanteModel.status == EventoParticipanteStatusEnum.RSVP)
        .update({EventoParticipanteModel.status: EventoParticipanteStatusEnum.NO_SHOW})
    )
    db.commit()
    db.refresh(evento)
    return EventoActionOut(evento=evento_out(evento), summary={"no_show_updated": int(no_show_updated or 0)})


def cancel_evento_flow(db: Session, evento_id: int, user: AuthUser) -> EventoActionOut:
    require_roles(user, "admin", "treinador", "auxiliar")
    evento = get_evento_or_404(db, evento_id)
    if evento.status != StatusEventoEnum.PLANEJADO:
        raise HTTPException(status_code=409, detail="Cancelamento permitido apenas em PLANEJADO")
    evento.status = StatusEventoEnum.CANCELADO
    db.commit()
    db.refresh(evento)
    return EventoActionOut(evento=evento_out(evento))
