"""add missing columns to aulas

Revision ID: 74f968db7e45
Revises: bd2912289ab8
Create Date: 2025-12-12 01:26:44.810940

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74f968db7e45'
down_revision: Union[str, None] = 'bd2912289ab8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    q = sa.text("""
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name=:t AND column_name=:c
        LIMIT 1
    """)
    return bind.execute(q, {"t": table, "c": column}).first() is not None

def upgrade():
    if not _has_column("aulas", "turma_nome"):
        op.add_column("aulas", sa.Column("turma_nome", sa.String(length=120), nullable=True))

    if not _has_column("aulas", "numero_aula_na_turma"):
        op.add_column("aulas", sa.Column("numero_aula_na_turma", sa.Integer(), nullable=True))

    if not _has_column("aulas", "tipo"):
        op.add_column("aulas", sa.Column("tipo", sa.String(length=50), nullable=True))

    if not _has_column("aulas", "horario_inicio"):
        op.add_column("aulas", sa.Column("horario_inicio", sa.String(length=10), nullable=True))

    if not _has_column("aulas", "horario_fim"):
        op.add_column("aulas", sa.Column("horario_fim", sa.String(length=10), nullable=True))

    if not _has_column("aulas", "status"):
        op.add_column("aulas", sa.Column("status", sa.String(length=30), nullable=True))

def downgrade():
    # Remove columns if needed during downgrade
    if _has_column("aulas", "turma_nome"):
        op.drop_column("aulas", "turma_nome")

    if _has_column("aulas", "numero_aula_na_turma"):
        op.drop_column("aulas", "numero_aula_na_turma")

    if _has_column("aulas", "tipo"):
        op.drop_column("aulas", "tipo")

    if _has_column("aulas", "horario_inicio"):
        op.drop_column("aulas", "horario_inicio")

    if _has_column("aulas", "horario_fim"):
        op.drop_column("aulas", "horario_fim")

    if _has_column("aulas", "status"):
        op.drop_column("aulas", "status")