"""Remove colunas legadas de dias que quebram inserts."""

from alembic import op


# revision identifiers, used by Alembic.
revision = "0004_drop_treino_cancelado"
down_revision = "0003_drop_dias_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='dias' AND column_name='treino_cancelado'
            ) THEN
                ALTER TABLE dias DROP COLUMN treino_cancelado;
            END IF;
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='dias' AND column_name='observacoes'
            ) THEN
                ALTER TABLE dias DROP COLUMN observacoes;
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE dias ADD COLUMN treino_cancelado boolean DEFAULT false")
    op.execute("ALTER TABLE dias ADD COLUMN observacoes varchar(255)")
