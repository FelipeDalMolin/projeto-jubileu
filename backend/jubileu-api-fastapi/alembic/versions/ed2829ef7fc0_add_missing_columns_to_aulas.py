"""add missing columns to aulas

Revision ID: ed2829ef7fc0
Revises: 74f968db7e45
Create Date: 2025-12-12 02:05:22.088317

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ed2829ef7fc0'
down_revision: Union[str, None] = '74f968db7e45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS turma_nome varchar(120)")
    op.execute("ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS numero_aula_na_turma integer")
    op.execute("ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS tipo varchar(50)")

def downgrade() -> None:
    op.execute("ALTER TABLE public.aulas DROP COLUMN IF EXISTS tipo")
    op.execute("ALTER TABLE public.aulas DROP COLUMN IF EXISTS numero_aula_na_turma")
    op.execute("ALTER TABLE public.aulas DROP COLUMN IF EXISTS turma_nome")