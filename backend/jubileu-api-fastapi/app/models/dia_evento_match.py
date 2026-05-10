from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.dia_evento_enums import PartidaStatusEnum


class Partida(Base):
    __tablename__ = "partidas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    evento_id: Mapped[int] = mapped_column(ForeignKey("eventos.id"), nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[PartidaStatusEnum] = mapped_column(
        SAEnum(PartidaStatusEnum),
        nullable=False,
        default=PartidaStatusEnum.PLANEJADA,
        server_default=PartidaStatusEnum.PLANEJADA.value,
    )
    inicio_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fim_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    time_a_id: Mapped[int] = mapped_column(Integer, ForeignKey("times_evento.id"), nullable=False)
    time_b_id: Mapped[int] = mapped_column(Integer, ForeignKey("times_evento.id"), nullable=False)
    gols_time_a: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    gols_time_b: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    evento: Mapped["Evento"] = relationship("Evento", back_populates="partidas")
    estatisticas: Mapped[List["EstatisticaJogadorPartida"]] = relationship(
        "EstatisticaJogadorPartida",
        back_populates="partida",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    lances: Mapped[List["Lance"]] = relationship(
        "Lance",
        back_populates="partida",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class EstatisticaJogadorPartida(Base):
    __tablename__ = "estatisticas_jogador_partida"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    partida_id: Mapped[int] = mapped_column(ForeignKey("partidas.id"), nullable=False)
    jogador_evento_id: Mapped[int] = mapped_column(ForeignKey("jogadores_evento.id"), nullable=False)
    gols: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assistencias: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chiliques: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    faltas: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nota: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    partida: Mapped["Partida"] = relationship("Partida", back_populates="estatisticas")
    jogador_evento: Mapped["JogadorEvento"] = relationship("JogadorEvento")
