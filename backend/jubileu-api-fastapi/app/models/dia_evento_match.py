from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, UniqueConstraint, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.dia_evento_enums import PartidaStatusEnum


class Partida(Base):
    __tablename__ = "partidas"
    __table_args__ = (
        UniqueConstraint("evento_id", "ordem", name="uq_partidas_evento_ordem"),
        UniqueConstraint("evento_id", "client_command_id", name="uq_partidas_evento_client_command"),
        Index(
            "uq_partidas_evento_em_andamento",
            "evento_id",
            unique=True,
            postgresql_where=text("status = 'EM_ANDAMENTO'"),
            sqlite_where=text("status = 'EM_ANDAMENTO'"),
        ),
    )

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
    client_command_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    client_command_payload_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    partida_origem_id: Mapped[Optional[int]] = mapped_column(ForeignKey("partidas.id"), nullable=True)
    command_rotation_version: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    command_result_queue: Mapped[Optional[list[dict]]] = mapped_column(JSON, nullable=True)

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
    __table_args__ = (
        UniqueConstraint("partida_id", "jogador_evento_id", name="uq_estatisticas_partida_jogador"),
    )

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
