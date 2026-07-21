"""Add idempotent next-match command safety.

Revision ID: 0019_proxima_partida_idempotente
Revises: 0018_usuario_jogador_exclusivo
Create Date: 2026-07-20
"""

from alembic import op
import sqlalchemy as sa


revision = "0019_proxima_partida_idempotente"
down_revision = "0018_usuario_jogador_exclusivo"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("partidas") as batch_op:
        batch_op.add_column(sa.Column("client_command_id", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("client_command_payload_hash", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("partida_origem_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("command_rotation_version", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("command_result_queue", sa.JSON(), nullable=True))
        batch_op.create_foreign_key(
            "fk_partidas_partida_origem_id",
            "partidas",
            ["partida_origem_id"],
            ["id"],
        )
        batch_op.create_unique_constraint(
            "uq_partidas_evento_client_command",
            ["evento_id", "client_command_id"],
        )

    if op.get_bind().dialect.name == "postgresql":
        op.execute(
            """
            WITH ranked AS (
                SELECT id, ROW_NUMBER() OVER (
                    PARTITION BY evento_id ORDER BY ordem DESC, id DESC
                ) AS rn
                FROM partidas
                WHERE status = 'EM_ANDAMENTO'
            )
            UPDATE partidas
            SET status = 'ENCERRADA', fim_at = COALESCE(fim_at, NOW())
            WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
            """
        )
        op.create_index(
            "uq_partidas_evento_em_andamento",
            "partidas",
            ["evento_id"],
            unique=True,
            postgresql_where=sa.text("status = 'EM_ANDAMENTO'"),
        )
    else:
        op.create_index(
            "uq_partidas_evento_em_andamento",
            "partidas",
            ["evento_id"],
            unique=True,
            sqlite_where=sa.text("status = 'EM_ANDAMENTO'"),
        )


def downgrade() -> None:
    op.drop_index("uq_partidas_evento_em_andamento", table_name="partidas")
    with op.batch_alter_table("partidas") as batch_op:
        batch_op.drop_constraint("uq_partidas_evento_client_command", type_="unique")
        batch_op.drop_constraint("fk_partidas_partida_origem_id", type_="foreignkey")
        batch_op.drop_column("command_result_queue")
        batch_op.drop_column("command_rotation_version")
        batch_op.drop_column("partida_origem_id")
        batch_op.drop_column("client_command_payload_hash")
        batch_op.drop_column("client_command_id")
