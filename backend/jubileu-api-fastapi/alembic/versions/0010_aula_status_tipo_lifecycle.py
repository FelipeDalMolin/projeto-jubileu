"""Cria TeamConfig e migra snapshots atuais de equipes."""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0010_aula_status_tipo_lifecycle"
down_revision = "e4f71ddd9d18"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "aulas" not in inspector.get_table_names():
        return

    op.create_table(
        "team_configs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False),
        sa.Column("estado", sa.JSON(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_team_configs_aula_id", "team_configs", ["aula_id"])
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_team_configs_active "
        "ON team_configs (aula_id) WHERE is_active"
    )

    if "aula_equipes_estado" in inspector.get_table_names():
        op.execute(
            """
            INSERT INTO team_configs (aula_id, estado, version, created_at, is_active)
            SELECT aes.aula_id,
                   aes.estado,
                   1,
                   COALESCE(aes.updated_at, now()),
                   true
            FROM aula_equipes_estado aes
            WHERE NOT EXISTS (
                SELECT 1
                FROM team_configs tc
                WHERE tc.aula_id = aes.aula_id
            );
            """
        )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_team_configs_active")
    op.drop_index("ix_team_configs_aula_id", table_name="team_configs")
    op.drop_table("team_configs")
