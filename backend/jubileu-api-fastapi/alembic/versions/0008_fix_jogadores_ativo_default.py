from alembic import op
import sqlalchemy as sa

revision = "0008_fix_jogadores_ativo_default"
down_revision = "0007_aulasturmafkint_and_uniques"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) preencher nulos existentes (se houver)
    op.execute("UPDATE jogadores SET ativo = TRUE WHERE ativo IS NULL;")

    # 2) garantir not null (se ainda não estiver) + default
    op.alter_column(
        "jogadores",
        "ativo",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=sa.text("true"),
    )


def downgrade() -> None:
    op.alter_column(
        "jogadores",
        "ativo",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=None,
    )
