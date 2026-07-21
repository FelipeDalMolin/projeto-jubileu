"""Enforce exclusive user to player links.

Revision ID: 0018_usuario_jogador_exclusivo
Revises: 0017_command_safety_constraints
Create Date: 2026-07-20
"""

from alembic import op
import sqlalchemy as sa


revision = "0018_usuario_jogador_exclusivo"
down_revision = "0017_command_safety_constraints"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        WITH ranked AS (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY jogador_id ORDER BY id) AS rn
            FROM usuarios
            WHERE jogador_id IS NOT NULL
        )
        UPDATE usuarios
        SET jogador_id = NULL
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
        """
    )
    with op.batch_alter_table("usuarios") as batch_op:
        batch_op.create_unique_constraint("uq_usuarios_jogador_id", ["jogador_id"])


def downgrade() -> None:
    with op.batch_alter_table("usuarios") as batch_op:
        batch_op.drop_constraint("uq_usuarios_jogador_id", type_="unique")
