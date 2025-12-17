# app/models/jogador_turma.py
from sqlalchemy import Integer, String, Boolean, ForeignKey, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Jogador(Base):
    __tablename__ = "jogadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    apelido: Mapped[str | None] = mapped_column(String, nullable=True)

    # status: mantenha default no nível do banco também, pra não depender só do Python
    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        server_default=text("'ativo'"),
    )

    # >>> ESTA É A COLUNA QUE ESTÁ FALTANDO NO MODEL <<<
    ativo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("true"),
    )

    turmas_rel: Mapped[list["TurmaJogador"]] = relationship(
        "TurmaJogador",
        back_populates="jogador",
        cascade="all, delete-orphan",
    )


class Turma(Base):
    __tablename__ = "turmas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)

    jogadores_rel: Mapped[list["TurmaJogador"]] = relationship(
        "TurmaJogador",
        back_populates="turma",
        cascade="all, delete-orphan",
    )


class TurmaJogador(Base):
    __tablename__ = "turmas_jogadores"
    __table_args__ = (
        UniqueConstraint("turma_id", "jogador_id", name="uq_turma_jogador"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    turma_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("turmas.id"),
        nullable=False,
    )
    jogador_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("jogadores.id"),
        nullable=False,
    )

    ativo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("true"),
    )

    turma: Mapped["Turma"] = relationship("Turma", back_populates="jogadores_rel")
    jogador: Mapped["Jogador"] = relationship("Jogador", back_populates="turmas_rel")
