"""Add evento rotation state and audit draw tables

Revision ID: 0012_evento_rotacao_manual
Revises: 0011_evento_participantes_lances
Create Date: 2026-05-02 11:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0012_evento_rotacao_manual"
down_revision = "0011_evento_participantes_lances"
branch_labels = None
depends_on = None

rotacao_sorteio_status_enum = postgresql.ENUM(
    "PREVIEWED",
    "CONFIRMED",
    "CANCELED",
    "EXPIRED",
    name="rotacaosorteiostatusenum",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    rotacao_sorteio_status_enum.create(bind, checkfirst=True)

    if "evento_rotacao_estado" not in inspector.get_table_names():
        op.create_table(
            "evento_rotacao_estado",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False, unique=True),
            sa.Column("team_size_ref", sa.Integer(), nullable=False, server_default="8"),
            sa.Column("duracao_partida_segundos", sa.Integer(), nullable=False, server_default="600"),
            sa.Column("fila_jogadores_ids", sa.JSON(), nullable=False),
            sa.Column("proximos_times", sa.JSON(), nullable=False),
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("updated_by_user_id", sa.String(), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_evento_rotacao_estado_aula_id", "evento_rotacao_estado", ["aula_id"])

    if "evento_rotacao_sorteio" not in inspector.get_table_names():
        op.create_table(
            "evento_rotacao_sorteio",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("token", sa.String(), nullable=False),
            sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False),
            sa.Column("partida_origem_id", sa.Integer(), sa.ForeignKey("partidas.id"), nullable=True),
            sa.Column("grupo_alvo_id", sa.String(), nullable=False),
            sa.Column("needed_count", sa.Integer(), nullable=False),
            sa.Column("candidatos_ids", sa.JSON(), nullable=False),
            sa.Column("sorteados_ids", sa.JSON(), nullable=False),
            sa.Column("nao_sorteados_ids", sa.JSON(), nullable=False),
            sa.Column("status", rotacao_sorteio_status_enum, nullable=False, server_default="PREVIEWED"),
            sa.Column("created_by_user_id", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.UniqueConstraint("token", name="uq_evento_rotacao_sorteio_token"),
        )
        op.create_index("ix_evento_rotacao_sorteio_token", "evento_rotacao_sorteio", ["token"])
        op.create_index("ix_evento_rotacao_sorteio_aula_id", "evento_rotacao_sorteio", ["aula_id"])
        op.create_index("ix_evento_rotacao_sorteio_partida_origem_id", "evento_rotacao_sorteio", ["partida_origem_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "evento_rotacao_sorteio" in inspector.get_table_names():
        op.drop_index("ix_evento_rotacao_sorteio_partida_origem_id", table_name="evento_rotacao_sorteio")
        op.drop_index("ix_evento_rotacao_sorteio_aula_id", table_name="evento_rotacao_sorteio")
        op.drop_index("ix_evento_rotacao_sorteio_token", table_name="evento_rotacao_sorteio")
        op.drop_table("evento_rotacao_sorteio")

    if "evento_rotacao_estado" in inspector.get_table_names():
        op.drop_index("ix_evento_rotacao_estado_aula_id", table_name="evento_rotacao_estado")
        op.drop_table("evento_rotacao_estado")

    rotacao_sorteio_status_enum.drop(bind, checkfirst=True)
