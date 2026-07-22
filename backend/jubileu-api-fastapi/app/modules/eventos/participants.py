"""RSVP, presenca e consultas de participantes de Evento."""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.deps_auth import AuthUser, require_roles
from app.models.dia_evento import (
    EventoParticipante as EventoParticipanteModel,
    EventoParticipanteStatusEnum,
    JogadorEvento as JogadorEventoModel,
    StatusEventoEnum,
    StatusPresencaEnum,
)
from app.models.jogador_turma import Jogador as JogadorModel
from app.modules.eventos.core import (
    assert_evento_em_andamento,
    assert_evento_tipo_jogo_livre,
    assert_jogador_na_evento,
    get_evento_or_404,
    lock_evento_for_command,
)
from app.schemas.eventos import EventoParticipanteOut, EventoParticipantesListOut


def participante_out(participante: EventoParticipanteModel) -> EventoParticipanteOut:
    return EventoParticipanteOut(
        id=participante.id,
        evento_id=participante.evento_id,
        jogador_id=participante.jogador_id,
        status=participante.status,
        rsvp_at=participante.rsvp_at,
        checkin_at=participante.checkin_at,
        checkout_at=participante.checkout_at,
        arrival_seq=participante.arrival_seq,
    )


def ensure_jogador_no_jogo_livre(
    db: Session,
    evento_id: int,
    jogador_id: int,
) -> JogadorEventoModel:
    """Materializa o snapshot do jogador quando ele entra no JOGO_LIVRE."""
    lock_evento_for_command(db, evento_id)
    snapshot = (
        db.query(JogadorEventoModel)
        .filter(
            JogadorEventoModel.evento_id == evento_id,
            JogadorEventoModel.jogador_id == jogador_id,
        )
        .first()
    )
    if snapshot:
        return snapshot

    jogador = (
        db.query(JogadorModel)
        .filter(
            JogadorModel.id == jogador_id,
            JogadorModel.ativo.is_(True),
        )
        .first()
    )
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador vinculado nao encontrado ou inativo")

    snapshot = JogadorEventoModel(
        evento_id=evento_id,
        jogador_id=jogador.id,
        nome=jogador.nome,
        status=StatusPresencaEnum.so_treino,
    )
    db.add(snapshot)
    db.flush()
    return snapshot


def get_or_create_participante(
    db: Session,
    evento_id: int,
    jogador_id: int,
    user_id: str,
) -> EventoParticipanteModel:
    participante = (
        db.query(EventoParticipanteModel)
        .filter(
            EventoParticipanteModel.evento_id == evento_id,
            EventoParticipanteModel.jogador_id == jogador_id,
        )
        .first()
    )
    if participante:
        return participante

    participante = EventoParticipanteModel(
        evento_id=evento_id,
        jogador_id=jogador_id,
        status=EventoParticipanteStatusEnum.RSVP,
        created_by_user_id=user_id,
        updated_by_user_id=user_id,
        rsvp_at=datetime.now(timezone.utc),
    )
    db.add(participante)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        participante = (
            db.query(EventoParticipanteModel)
            .filter(
                EventoParticipanteModel.evento_id == evento_id,
                EventoParticipanteModel.jogador_id == jogador_id,
            )
            .first()
        )
        if participante:
            return participante
        raise
    return participante


def next_arrival_seq(db: Session, evento_id: int) -> int:
    lock_evento_for_command(db, evento_id)
    max_seq = (
        db.query(func.max(EventoParticipanteModel.arrival_seq))
        .filter(EventoParticipanteModel.evento_id == evento_id)
        .scalar()
    )
    return int(max_seq or 0) + 1


def rsvp_self_flow(db: Session, evento_id: int, user: AuthUser) -> dict[str, EventoParticipanteOut]:
    evento = get_evento_or_404(db, evento_id)
    assert_evento_tipo_jogo_livre(evento)
    if evento.status not in {StatusEventoEnum.PLANEJADO, StatusEventoEnum.EM_ANDAMENTO}:
        raise HTTPException(status_code=409, detail="RSVP nao permitido para este status")
    if user.jogador_id is None:
        raise HTTPException(status_code=403, detail="User sem jogador associado")

    ensure_jogador_no_jogo_livre(db, evento.id, user.jogador_id)
    participante = get_or_create_participante(db, evento.id, user.jogador_id, user.user_id)
    if participante.status == EventoParticipanteStatusEnum.CHECKED_IN:
        db.commit()
        return {"participante": participante_out(participante)}

    participante.status = EventoParticipanteStatusEnum.RSVP
    participante.rsvp_at = participante.rsvp_at or datetime.now(timezone.utc)
    participante.updated_by_user_id = user.user_id
    db.commit()
    db.refresh(participante)
    return {"participante": participante_out(participante)}


def rsvp_self_cancel_flow(db: Session, evento_id: int, user: AuthUser) -> dict[str, EventoParticipanteOut]:
    evento = get_evento_or_404(db, evento_id)
    assert_evento_tipo_jogo_livre(evento)
    if user.jogador_id is None:
        raise HTTPException(status_code=403, detail="User sem jogador associado")

    participante = (
        db.query(EventoParticipanteModel)
        .filter(
            EventoParticipanteModel.evento_id == evento.id,
            EventoParticipanteModel.jogador_id == user.jogador_id,
        )
        .first()
    )
    if not participante:
        raise HTTPException(status_code=404, detail="Participacao nao encontrada")
    if participante.status == EventoParticipanteStatusEnum.CHECKED_IN:
        raise HTTPException(status_code=409, detail="Use desfazer check-in antes de cancelar RSVP")

    participante.status = EventoParticipanteStatusEnum.CANCELED
    participante.updated_by_user_id = user.user_id
    db.commit()
    db.refresh(participante)
    return {"participante": participante_out(participante)}


def checkin_self_flow(db: Session, evento_id: int, user: AuthUser) -> dict[str, EventoParticipanteOut]:
    evento = get_evento_or_404(db, evento_id)
    assert_evento_tipo_jogo_livre(evento)
    assert_evento_em_andamento(evento)
    if user.jogador_id is None:
        raise HTTPException(status_code=403, detail="User sem jogador associado")

    ensure_jogador_no_jogo_livre(db, evento.id, user.jogador_id)
    participante = get_or_create_participante(db, evento.id, user.jogador_id, user.user_id)
    if participante.status != EventoParticipanteStatusEnum.CHECKED_IN:
        participante.status = EventoParticipanteStatusEnum.CHECKED_IN
        participante.checkin_at = participante.checkin_at or datetime.now(timezone.utc)
        if participante.arrival_seq is None:
            participante.arrival_seq = next_arrival_seq(db, evento.id)
        participante.updated_by_user_id = user.user_id
    db.commit()
    db.refresh(participante)
    return {"participante": participante_out(participante)}


def checkin_self_cancel_flow(db: Session, evento_id: int, user: AuthUser) -> dict[str, EventoParticipanteOut]:
    evento = get_evento_or_404(db, evento_id)
    assert_evento_em_andamento(evento)
    if user.jogador_id is None:
        raise HTTPException(status_code=403, detail="User sem jogador associado")

    participante = (
        db.query(EventoParticipanteModel)
        .filter(
            EventoParticipanteModel.evento_id == evento.id,
            EventoParticipanteModel.jogador_id == user.jogador_id,
        )
        .first()
    )
    if not participante:
        raise HTTPException(status_code=404, detail="Participacao nao encontrada")
    if participante.status != EventoParticipanteStatusEnum.CHECKED_IN:
        raise HTTPException(status_code=409, detail="Participante nao esta CHECKED_IN")

    participante.status = EventoParticipanteStatusEnum.CHECKED_OUT
    participante.checkout_at = datetime.now(timezone.utc)
    participante.updated_by_user_id = user.user_id
    db.commit()
    db.refresh(participante)
    return {"participante": participante_out(participante)}


def checkin_manual_flow(
    db: Session,
    evento_id: int,
    jogador_id: int,
    user: AuthUser,
) -> dict[str, EventoParticipanteOut]:
    require_roles(user, "admin", "treinador", "auxiliar")
    evento = get_evento_or_404(db, evento_id)
    assert_evento_em_andamento(evento)
    assert_jogador_na_evento(db, evento.id, jogador_id)

    participante = get_or_create_participante(db, evento.id, jogador_id, user.user_id)
    if participante.status != EventoParticipanteStatusEnum.CHECKED_IN:
        participante.status = EventoParticipanteStatusEnum.CHECKED_IN
        participante.checkin_at = participante.checkin_at or datetime.now(timezone.utc)
        if participante.arrival_seq is None:
            participante.arrival_seq = next_arrival_seq(db, evento.id)
        participante.updated_by_user_id = user.user_id
    db.commit()
    db.refresh(participante)
    return {"participante": participante_out(participante)}


def list_participants_flow(db: Session, evento_id: int) -> EventoParticipantesListOut:
    get_evento_or_404(db, evento_id)
    items = (
        db.query(EventoParticipanteModel)
        .filter(EventoParticipanteModel.evento_id == evento_id)
        .order_by(EventoParticipanteModel.id.asc())
        .all()
    )
    return EventoParticipantesListOut(items=[participante_out(item) for item in items])


def list_presentes_flow(db: Session, evento_id: int, order: str) -> EventoParticipantesListOut:
    get_evento_or_404(db, evento_id)
    query = db.query(EventoParticipanteModel).filter(
        EventoParticipanteModel.evento_id == evento_id,
        EventoParticipanteModel.status == EventoParticipanteStatusEnum.CHECKED_IN,
    )
    if order == "arrival":
        query = query.order_by(EventoParticipanteModel.arrival_seq.asc(), EventoParticipanteModel.id.asc())
    else:
        query = query.order_by(EventoParticipanteModel.id.asc())

    items = query.all()
    return EventoParticipantesListOut(items=[participante_out(item) for item in items])
