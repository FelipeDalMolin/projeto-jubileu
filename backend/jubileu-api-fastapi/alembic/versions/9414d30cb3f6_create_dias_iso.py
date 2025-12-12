"""create dias iso

Revision ID: 9414d30cb3f6
Revises: b708ce6766e2
Create Date: 2025-12-12 00:41:15.778184

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
# from sqlalchemy.dialects import postgresql  # não precisamos aqui, pode remover se quiser

# revision identifiers, used by Alembic.
revision: str = "9414d30cb3f6"
down_revision: Union[str, None] = "b708ce6766e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) adiciona as novas colunas em dias
    op.add_column(
        "dias",
        sa.Column("data_iso", sa.String(length=10), nullable=True),
    )
    op.add_column(
        "dias",
        sa.Column("feriado_nome", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "dias",
        sa.Column("feriado_tipo", sa.String(length=50), nullable=True),
    )

    # 2) preenche data_iso a partir da coluna data já existente
    # TO_CHAR(data, 'YYYY-MM-DD') converte date -> string ISO
    op.execute("UPDATE dias SET data_iso = TO_CHAR(data, 'YYYY-MM-DD') WHERE data IS NOT NULL")

    # 3) agora podemos exigir NOT NULL em data_iso
    op.alter_column(
        "dias",
        "data_iso",
        existing_type=sa.String(length=10),
        nullable=False,
    )

    # 4) opcional: índice unique em data_iso, pra não ter dois dias com a mesma data
    op.create_index(
        "ix_dias_data_iso",
        "dias",
        ["data_iso"],
        unique=True,
    )


def downgrade() -> None:
    # reverte o que fizemos no upgrade
    op.drop_index("ix_dias_data_iso", table_name="dias")
    op.drop_column("dias", "feriado_tipo")
    op.drop_column("dias", "feriado_nome")
    op.drop_column("dias", "data_iso")
