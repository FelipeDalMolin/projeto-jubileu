"""Add evento participantes, partida status and lances

Revision ID: 0011_evento_participantes_lances
Revises: 0010_aula_status_tipo_lifecycle
Create Date: 2026-03-01 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0011_evento_participantes_lances"
down_revision = "0010_aula_status_tipo_lifecycle"
branch_labels = None
depends_on = None


# IMPORTANT: create_type=False evita o SQLAlchemy tentar CREATE TYPE novamente
partida_status_enum = postgresql.ENUM(
    "PLANEJADA",
    "EM_ANDAMENTO",
    "ENCERRADA",
    name="partidastatusenum",
    create_type=False,
)

participante_status_enum = postgresql.ENUM(
    "RSVP",
    "CHECKED_IN",
    "CHECKED_OUT",
    "CANCELED",
    "NO_SHOW",
    name="eventoparticipantestatusenum",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1) cria os tipos explicitamente (idempotente)
    partida_status_enum.create(bind, checkfirst=True)
    participante_status_enum.create(bind, checkfirst=True)

    # 2) altera partidas (se existir)
    if "partidas" in inspector.get_table_names():
        op.add_column(
            "partidas",
            sa.Column(
                "status",
                partida_status_enum,
                nullable=False,
                server_default="PLANEJADA",
            ),
        )
        op.add_column("partidas", sa.Column("inicio_at", sa.DateTime(timezone=True), nullable=True))
        op.add_column("partidas", sa.Column("fim_at", sa.DateTime(timezone=True), nullable=True))

        # opcional: remove o default do schema
        op.alter_column("partidas", "status", server_default=None)

    # 3) cria evento_participantes
    op.create_table(
        "evento_participantes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False),
        sa.Column("jogador_id", sa.Integer(), sa.ForeignKey("jogadores.id"), nullable=False),
        sa.Column("status", participante_status_enum, nullable=False, server_default="RSVP"),
        sa.Column("rsvp_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("checkin_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("checkout_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("arrival_seq", sa.Integer(), nullable=True),
        sa.Column("created_by_user_id", sa.String(), nullable=True),
        sa.Column("updated_by_user_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("aula_id", "jogador_id", name="uq_evento_participante"),
    )
    op.create_index("ix_evento_participantes_aula_id", "evento_participantes", ["aula_id"])
    op.create_index("ix_evento_participantes_jogador_id", "evento_participantes", ["jogador_id"])

    # opcional: remove default do schema
    op.alter_column("evento_participantes", "status", server_default=None)

    # 4) cria lances
    op.create_table(
        "lances",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("partida_id", sa.Integer(), sa.ForeignKey("partidas.id"), nullable=False),
        sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False),
        sa.Column("jogador_id", sa.Integer(), sa.ForeignKey("jogadores.id"), nullable=True),
        sa.Column("tipo", sa.String(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("client_event_id", sa.String(), nullable=True),
        sa.Column("created_by_user_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("corrected_by_user_id", sa.String(), nullable=True),
        sa.Column("corrected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_by_user_id", sa.String(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_lances_partida_id", "lances", ["partida_id"])
    op.create_index("ix_lances_aula_id", "lances", ["aula_id"])
    op.create_index("ix_lances_jogador_id", "lances", ["jogador_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "lances" in inspector.get_table_names():
        op.drop_index("ix_lances_jogador_id", table_name="lances")
        op.drop_index("ix_lances_aula_id", table_name="lances")
        op.drop_index("ix_lances_partida_id", table_name="lances")
        op.drop_table("lances")

    if "evento_participantes" in inspector.get_table_names():
        op.drop_index("ix_evento_participantes_jogador_id", table_name="evento_participantes")
        op.drop_index("ix_evento_participantes_aula_id", table_name="evento_participantes")
        op.drop_table("evento_participantes")

    if "partidas" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("partidas")}
        if "fim_at" in cols:
            op.drop_column("partidas", "fim_at")
        if "inicio_at" in cols:
            op.drop_column("partidas", "inicio_at")
        if "status" in cols:
            op.drop_column("partidas", "status")

    # derruba tipos por último
    participante_status_enum.drop(bind, checkfirst=True)
    partida_status_enum.drop(bind, checkfirst=True)