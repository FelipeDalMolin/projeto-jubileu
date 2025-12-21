"""Add version and updated_at to aula_equipes_estado."""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0009_aula_equipes_version"
down_revision = "0008_fix_jogadores_ativo_default"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "aula_equipes_estado",
        sa.Column(
            "version",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )
    op.add_column(
        "aula_equipes_estado",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', now())"),
        ),
    )

    # garante valores para linhas existentes
    op.execute(
        """
        UPDATE aula_equipes_estado
        SET version = COALESCE(version, 1),
            updated_at = COALESCE(updated_at, TIMEZONE('utc', now()))
        """
    )


def downgrade() -> None:
    op.drop_column("aula_equipes_estado", "updated_at")
    op.drop_column("aula_equipes_estado", "version")
