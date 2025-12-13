"""Garante colunas 'apelido' e 'status' em jogadores."""

from alembic import op


# revision identifiers, used by Alembic.
revision = "0006_fix_jogadores_columns"
down_revision = "0005_fix_aulas_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            -- coluna apelido (nullable)
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='jogadores' AND column_name='apelido'
            ) THEN
                ALTER TABLE jogadores ADD COLUMN apelido varchar NULL;
            END IF;

            -- coluna status (not null, default 'ativo')
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='jogadores' AND column_name='status'
            ) THEN
                ALTER TABLE jogadores ADD COLUMN status varchar NOT NULL DEFAULT 'ativo';
            END IF;

            -- garante valores default e not null
            UPDATE jogadores SET status = COALESCE(status, 'ativo');
            ALTER TABLE jogadores ALTER COLUMN status SET DEFAULT 'ativo';
            ALTER TABLE jogadores ALTER COLUMN status SET NOT NULL;
        END$$;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE jogadores DROP COLUMN IF EXISTS status;
        ALTER TABLE jogadores DROP COLUMN IF EXISTS apelido;
        """
    )
