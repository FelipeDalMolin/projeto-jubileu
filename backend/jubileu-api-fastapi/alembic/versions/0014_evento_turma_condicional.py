"""Allow Evento without turma for non-AULA modes

Revision ID: 0014_evento_turma_condicional
Revises: 0013_eventos_canonicos_usuarios
Create Date: 2026-05-09 15:00:00
"""

from alembic import op
import sqlalchemy as sa

revision = "0014_evento_turma_condicional"
down_revision = "0013_eventos_canonicos_usuarios"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table_name not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(table_name)}


def upgrade() -> None:
    columns = _columns("eventos")
    if {"turma_id", "turma_nome", "numero_evento_na_turma"}.issubset(columns):
        with op.batch_alter_table("eventos") as batch_op:
            batch_op.alter_column("turma_id", existing_type=sa.Integer(), nullable=True)
            batch_op.alter_column("turma_nome", existing_type=sa.String(), nullable=True)
            batch_op.alter_column("numero_evento_na_turma", existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    columns = _columns("eventos")
    if {"turma_id", "turma_nome", "numero_evento_na_turma"}.issubset(columns):
        op.execute(
            "DELETE FROM eventos "
            "WHERE turma_id IS NULL OR turma_nome IS NULL OR numero_evento_na_turma IS NULL"
        )
        with op.batch_alter_table("eventos") as batch_op:
            batch_op.alter_column("numero_evento_na_turma", existing_type=sa.Integer(), nullable=False)
            batch_op.alter_column("turma_nome", existing_type=sa.String(), nullable=False)
            batch_op.alter_column("turma_id", existing_type=sa.Integer(), nullable=False)
