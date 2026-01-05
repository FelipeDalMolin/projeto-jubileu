"""Remove coluna defesas das estatisticas."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = "0003_remove_defesas"
down_revision = "0002_schema_align_stack"
branch_labels = None
depends_on = None


def _table_exists(inspector: Inspector, table: str) -> bool:
    return table in inspector.get_table_names()


def _column_exists(inspector: Inspector, table: str, column: str) -> bool:
    if not _table_exists(inspector, table):
        return False
    cols = inspector.get_columns(table)
    return any(c["name"] == column for c in cols)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _column_exists(inspector, "jogadores_aula", "defesas"):
        op.drop_column("jogadores_aula", "defesas")

    if _column_exists(inspector, "estatisticas_jogador_partida", "defesas"):
        op.drop_column("estatisticas_jogador_partida", "defesas")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, "jogadores_aula") and not _column_exists(inspector, "jogadores_aula", "defesas"):
        op.add_column(
            "jogadores_aula",
            sa.Column("defesas", sa.Integer(), nullable=False, server_default="0"),
        )

    if _table_exists(inspector, "estatisticas_jogador_partida") and not _column_exists(
        inspector, "estatisticas_jogador_partida", "defesas"
    ):
        op.add_column(
            "estatisticas_jogador_partida",
            sa.Column("defesas", sa.Integer(), nullable=False, server_default="0"),
        )
