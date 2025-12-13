"""Remove coluna legacy 'data' de dias (evita NOT NULL)."""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0003_drop_dias_data"
down_revision = "0002_schema_align_stack"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='dias' AND column_name='data'
            ) THEN
                ALTER TABLE dias DROP COLUMN data;
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    op.add_column("dias", sa.Column("data", sa.Date(), nullable=True))
