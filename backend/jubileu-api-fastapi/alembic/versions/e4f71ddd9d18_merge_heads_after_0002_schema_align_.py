"""merge heads after 0002_schema_align_stack

Revision ID: e4f71ddd9d18
Revises: 0003_remove_defesas, 0009_aula_equipes_version
Create Date: 2026-01-13 22:35:38.445279

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4f71ddd9d18'
down_revision: Union[str, None] = ('0003_remove_defesas', '0009_aula_equipes_version')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
