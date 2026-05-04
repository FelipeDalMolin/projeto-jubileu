from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, func, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.dia_aula_enums import RotacaoSorteioStatusEnum


class EventoRotacaoEstado(Base):
    __tablename__ = "evento_rotacao_estado"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    aula_id: Mapped[int] = mapped_column(
        ForeignKey("aulas.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    team_size_ref: Mapped[int] = mapped_column(Integer, nullable=False, default=8, server_default=text("8"))
    duracao_partida_segundos: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=600,
        server_default=text("600"),
    )
    fila_jogadores_ids: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    proximos_times: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=text("1"))
    updated_by_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    aula: Mapped["Aula"] = relationship("Aula", back_populates="rotacao_estado")


class EventoRotacaoSorteio(Base):
    __tablename__ = "evento_rotacao_sorteio"
    __table_args__ = (UniqueConstraint("token", name="uq_evento_rotacao_sorteio_token"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    token: Mapped[str] = mapped_column(String, nullable=False, index=True)
    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id"), nullable=False, index=True)
    partida_origem_id: Mapped[Optional[int]] = mapped_column(ForeignKey("partidas.id"), nullable=True, index=True)
    grupo_alvo_id: Mapped[str] = mapped_column(String, nullable=False)
    needed_count: Mapped[int] = mapped_column(Integer, nullable=False)
    candidatos_ids: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    sorteados_ids: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    nao_sorteados_ids: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[RotacaoSorteioStatusEnum] = mapped_column(
        SAEnum(RotacaoSorteioStatusEnum),
        nullable=False,
        default=RotacaoSorteioStatusEnum.PREVIEWED,
        server_default=RotacaoSorteioStatusEnum.PREVIEWED.value,
    )
    created_by_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    aula: Mapped["Aula"] = relationship("Aula", back_populates="rotacao_sorteios")
    partida_origem: Mapped[Optional["Partida"]] = relationship("Partida")
