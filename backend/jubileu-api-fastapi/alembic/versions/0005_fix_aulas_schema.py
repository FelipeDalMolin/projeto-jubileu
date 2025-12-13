"""Alinha tabela aulas ao modelo atual (tipos e colunas)."""

from alembic import op


# revision identifiers, used by Alembic.
revision = "0005_fix_aulas_schema"
down_revision = "0004_drop_treino_cancelado"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # turma_id -> varchar, not null (remove FK legado antes de converter tipo)
    op.execute("ALTER TABLE aulas DROP CONSTRAINT IF EXISTS aulas_turma_id_fkey")
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='aulas' AND column_name='turma_id'
                  AND data_type <> 'character varying'
            ) THEN
                ALTER TABLE aulas
                ALTER COLUMN turma_id TYPE varchar USING turma_id::varchar;
            END IF;
            ALTER TABLE aulas ALTER COLUMN turma_id SET NOT NULL;
        END$$;
        """
    )

    # turma_nome not null
    op.execute(
        """
        UPDATE aulas
           SET turma_nome = COALESCE(turma_nome, turma_id::text, '')
         WHERE turma_nome IS NULL;
        ALTER TABLE aulas ALTER COLUMN turma_nome SET NOT NULL;
        """
    )

    # numero_aula_na_turma not null + default 1
    op.execute(
        """
        UPDATE aulas
           SET numero_aula_na_turma = COALESCE(numero_aula_na_turma, 1)
         WHERE numero_aula_na_turma IS NULL;
        ALTER TABLE aulas ALTER COLUMN numero_aula_na_turma SET NOT NULL;
        ALTER TABLE aulas ALTER COLUMN numero_aula_na_turma SET DEFAULT 1;
        """
    )

    # remove colunas legadas não usadas pelo modelo atual
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='aulas' AND column_name='titulo'
            ) THEN
                ALTER TABLE aulas DROP COLUMN titulo;
            END IF;
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='aulas' AND column_name='observacoes'
            ) THEN
                ALTER TABLE aulas DROP COLUMN observacoes;
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    # Recria colunas antigas como nullable e remove ajustes de default (não reverte tipos).
    op.execute("ALTER TABLE aulas ADD COLUMN titulo varchar(120)")
    op.execute("ALTER TABLE aulas ADD COLUMN observacoes varchar(255)")
    op.execute("ALTER TABLE aulas ALTER COLUMN numero_aula_na_turma DROP DEFAULT")
    op.execute("ALTER TABLE aulas ALTER COLUMN numero_aula_na_turma DROP NOT NULL")
    op.execute("ALTER TABLE aulas ALTER COLUMN turma_nome DROP NOT NULL")
    op.execute("ALTER TABLE aulas ALTER COLUMN turma_id DROP NOT NULL")
    # restauraria FK antiga apenas se necessário (não recriado aqui)
