"""Garante status/tipo na tabela aulas com defaults seguros."""

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

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statusaulaenum') THEN
                CREATE TYPE statusaulaenum AS ENUM ('PLANEJADA','EM_ANDAMENTO','CONCLUIDA','CANCELADA');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipoeventoaulaenum') THEN
                CREATE TYPE tipoeventoaulaenum AS ENUM ('AULA','JOGO','OUTRO');
            END IF;
        END$$;
        """
    )

    op.execute("ALTER TABLE aulas ADD COLUMN IF NOT EXISTS status statusaulaenum")
    op.execute("ALTER TABLE aulas ADD COLUMN IF NOT EXISTS tipo tipoeventoaulaenum")

    op.execute("UPDATE aulas SET status = COALESCE(status, 'PLANEJADA')")
    op.execute("UPDATE aulas SET tipo = COALESCE(tipo, 'AULA')")

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'aulas'
                  AND column_name = 'status'
                  AND udt_name <> 'statusaulaenum'
            ) THEN
                ALTER TABLE aulas ALTER COLUMN status DROP DEFAULT,
                    ALTER COLUMN status TYPE statusaulaenum
                        USING UPPER(COALESCE(status, 'PLANEJADA'))::statusaulaenum,
                    ALTER COLUMN status SET DEFAULT 'PLANEJADA',
                    ALTER COLUMN status SET NOT NULL;
            ELSE
                ALTER TABLE aulas ALTER COLUMN status SET DEFAULT 'PLANEJADA';
                ALTER TABLE aulas ALTER COLUMN status SET NOT NULL;
            END IF;
        END$$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'aulas'
                  AND column_name = 'tipo'
                  AND udt_name <> 'tipoeventoaulaenum'
            ) THEN
                ALTER TABLE aulas ALTER COLUMN tipo DROP DEFAULT,
                    ALTER COLUMN tipo TYPE tipoeventoaulaenum
                        USING UPPER(COALESCE(tipo, 'AULA'))::tipoeventoaulaenum,
                    ALTER COLUMN tipo SET DEFAULT 'AULA',
                    ALTER COLUMN tipo SET NOT NULL;
            ELSE
                ALTER TABLE aulas ALTER COLUMN tipo SET DEFAULT 'AULA';
                ALTER TABLE aulas ALTER COLUMN tipo SET NOT NULL;
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    pass
