from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, func, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.dia_evento_enums import EventoParticipanteStatusEnum


class EventoParticipante(Base):
    __tablename__ = "evento_participantes"
    __table_args__ = (UniqueConstraint("evento_id", "jogador_id", name="uq_evento_participante"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    evento_id: Mapped[int] = mapped_column(ForeignKey("eventos.id"), nullable=False, index=True)
    jogador_id: Mapped[int] = mapped_column(ForeignKey("jogadores.id"), nullable=False, index=True)
    status: Mapped[EventoParticipanteStatusEnum] = mapped_column(
        SAEnum(EventoParticipanteStatusEnum),
        nullable=False,
        default=EventoParticipanteStatusEnum.RSVP,
        server_default=EventoParticipanteStatusEnum.RSVP.value,
    )
    rsvp_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    checkin_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    checkout_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    arrival_seq: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_by_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    updated_by_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    evento: Mapped["Evento"] = relationship("Evento", back_populates="participantes")


class Lance(Base):
    __tablename__ = "lances"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    partida_id: Mapped[int] = mapped_column(ForeignKey("partidas.id"), nullable=False, index=True)
    evento_id: Mapped[int] = mapped_column(ForeignKey("eventos.id"), nullable=False, index=True)
    jogador_id: Mapped[Optional[int]] = mapped_column(ForeignKey("jogadores.id"), nullable=True, index=True)
    tipo: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    client_event_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_by_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    corrected_by_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    corrected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )
    deleted_by_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    partida: Mapped["Partida"] = relationship("Partida", back_populates="lances")
    evento: Mapped["Evento"] = relationship("Evento", back_populates="lances")
