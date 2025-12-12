"""add turma_nome to aulas

Revision ID: bd2912289ab8
Revises: 9414d30cb3f6
Create Date: 2025-12-12 01:15:23.125445

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bd2912289ab8'
down_revision: Union[str, None] = '9414d30cb3f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('aulas', sa.Column('turma_nome', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("aulas", "turma_nome")