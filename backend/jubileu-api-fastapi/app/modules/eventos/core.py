"""Primitivas compartilhadas do aggregate Evento."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.dia_evento import (
    Evento as EventoModel,
    JogadorEvento as JogadorEventoModel,
    StatusEventoEnum,
    TipoEventoEnum,
)
from app.schemas.eventos import EventoOut


def evento_tipo_canonical(evento: EventoModel) -> str:
    if evento.tipo == TipoEventoEnum.JOGO_LIVRE:
        return "JOGO_LIVRE"
    return "AULA"


def evento_out(evento: EventoModel) -> EventoOut:
    if evento.status == StatusEventoEnum.PLANEJADO:
        canonical_status = "PLANEJADO"
    elif evento.status == StatusEventoEnum.EM_ANDAMENTO:
        canonical_status = "EM_ANDAMENTO"
    elif evento.status == StatusEventoEnum.ENCERRADO:
        canonical_status = "ENCERRADO"
    else:
        canonical_status = "CANCELADO"

    return EventoOut(
        id=evento.id,
        dia_id=evento.dia_id,
        tipo=evento_tipo_canonical(evento),
        status=canonical_status,
        horario_inicio=evento.horario_inicio,
        horario_fim=evento.horario_fim,
        inicio_at=None,
        fim_at=None,
    )


def get_evento_or_404(db: Session, evento_id: int) -> EventoModel:
    evento = db.query(EventoModel).filter(EventoModel.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado")
    return evento


def assert_evento_tipo_jogo_livre(evento: EventoModel) -> None:
    if evento_tipo_canonical(evento) != "JOGO_LIVRE":
        raise HTTPException(
            status_code=409,
            detail="RSVP/check-in self so e permitido para JOGO_LIVRE",
        )


def assert_evento_em_andamento(evento: EventoModel) -> None:
    if evento.status != StatusEventoEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Evento nao esta EM_ANDAMENTO")


def assert_jogador_na_evento(db: Session, evento_id: int, jogador_id: int) -> None:
    found = (
        db.query(JogadorEventoModel.id)
        .filter(
            JogadorEventoModel.evento_id == evento_id,
            JogadorEventoModel.jogador_id == jogador_id,
        )
        .first()
    )
    if not found:
        raise HTTPException(status_code=404, detail="Jogador nao pertence ao evento")


def lock_evento_for_command(db: Session, evento_id: int) -> None:
    db.query(EventoModel.id).filter(EventoModel.id == evento_id).with_for_update().one()
