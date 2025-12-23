"""fix jogadores ativo default

Revision ID: 0008_fix_jogadores_ativo_default
Revises: 0007_aulasturmafkint_and_uniques
Create Date: 2025-xx-xx xx:xx:xx.xxxxxx
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0008_fix_jogadores_ativo_default"
down_revision = "0007_aulasturmafkint_and_uniques"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name='jogadores' AND column_name='ativo'
        ) THEN
            ALTER TABLE jogadores ADD COLUMN ativo BOOLEAN;
        END IF;
    END $$;
    """)

    op.execute("UPDATE jogadores SET ativo = TRUE WHERE ativo IS NULL;")
    op.alter_column("jogadores", "ativo", server_default=sa.text("TRUE"), nullable=False)


def downgrade() -> None:
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name='jogadores' AND column_name='ativo'
        ) THEN
            ALTER TABLE jogadores DROP COLUMN ativo;
        END IF;
    END $$;
    """)
