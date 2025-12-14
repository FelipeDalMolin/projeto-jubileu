"""Converte aulas.turma_id para integer + FK e cria índices únicos (idempotente).

- Garante UNIQUE em dias.data_iso e turmas.nome (via índices nomeados).
- Valida que aulas.turma_id contém apenas números antes de converter.
- Converte turma_id (varchar -> int) se ainda não for integer.
- Cria FK aulas(turma_id) -> turmas(id) com nome fixo fk_aulas_turma.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0007_aulasturmafkint_and_uniques"
down_revision = "0006_fix_jogadores_columns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) UNIQUE dias.data_iso (via índice nomeado)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname = 'uq_dias_data_iso'
            ) THEN
                CREATE UNIQUE INDEX uq_dias_data_iso ON public.dias (data_iso);
            END IF;
        END$$;
        """
    )

    # 2) UNIQUE turmas.nome (via índice nomeado)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname = 'uq_turmas_nome'
            ) THEN
                CREATE UNIQUE INDEX uq_turmas_nome ON public.turmas (nome);
            END IF;
        END$$;
        """
    )

    # 3) Validar e converter aulas.turma_id -> integer (se necessário) + FK
    # Observação: fazemos tudo via DO $$ ... $$ para conseguir checagens e lógica condicional.
    op.execute(
        """
        DO $$
        DECLARE
            turma_id_type text;
            bad_count bigint;
            has_constraint boolean;
        BEGIN
            -- Qual o tipo atual de aulas.turma_id?
            SELECT data_type INTO turma_id_type
            FROM information_schema.columns
            WHERE table_schema='public'
              AND table_name='aulas'
              AND column_name='turma_id';

            IF turma_id_type IS NULL THEN
                RAISE EXCEPTION 'Tabela public.aulas ou coluna turma_id não encontrada.';
            END IF;

            -- Drop constraints possíveis que apontem para turma_id (antigas ou novo nome)
            ALTER TABLE public.aulas DROP CONSTRAINT IF EXISTS aulas_turma_id_fkey;
            ALTER TABLE public.aulas DROP CONSTRAINT IF EXISTS fk_aulas_turma;

            -- Se ainda não for integer, validar e converter
            IF turma_id_type <> 'integer' THEN
                -- Checa valores não numéricos (usa ::text para funcionar em qualquer tipo)
                SELECT COUNT(*) INTO bad_count
                FROM public.aulas
                WHERE turma_id IS NOT NULL
                  AND btrim(turma_id::text) <> ''
                  AND turma_id::text ~ '[^0-9]';

                IF bad_count > 0 THEN
                    RAISE EXCEPTION
                        'Migration abortada: public.aulas.turma_id contém valores não numéricos (% rows). Corrija antes de prosseguir.',
                        bad_count;
                END IF;

                -- Converte: strings vazias viram NULL, números viram int
                ALTER TABLE public.aulas
                    ALTER COLUMN turma_id TYPE integer
                    USING NULLIF(btrim(turma_id::text), '')::integer;
            END IF;

            -- Agora garantir FK existe (se já existir, não recria)
            SELECT EXISTS (
                SELECT 1
                FROM pg_constraint c
                JOIN pg_class t ON t.oid = c.conrelid
                JOIN pg_namespace n ON n.oid = t.relnamespace
                WHERE n.nspname='public'
                  AND t.relname='aulas'
                  AND c.conname='fk_aulas_turma'
            ) INTO has_constraint;

            IF NOT has_constraint THEN
                ALTER TABLE public.aulas
                    ADD CONSTRAINT fk_aulas_turma
                    FOREIGN KEY (turma_id) REFERENCES public.turmas(id)
                    ON DELETE RESTRICT;
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    # Reverte FK e remove índices únicos (se existirem)
    op.execute("ALTER TABLE public.aulas DROP CONSTRAINT IF EXISTS fk_aulas_turma;")

    # Voltar turma_id para varchar (caso a coluna exista)
    op.execute(
        """
        DO $$
        DECLARE
            turma_id_type text;
        BEGIN
            SELECT data_type INTO turma_id_type
            FROM information_schema.columns
            WHERE table_schema='public'
              AND table_name='aulas'
              AND column_name='turma_id';

            IF turma_id_type IS NULL THEN
                RETURN;
            END IF;

            IF turma_id_type <> 'character varying' THEN
                ALTER TABLE public.aulas
                    ALTER COLUMN turma_id TYPE varchar
                    USING turma_id::varchar;
            END IF;
        END$$;
        """
    )

    op.execute("DROP INDEX IF EXISTS public.uq_dias_data_iso;")
    op.execute("DROP INDEX IF EXISTS public.uq_turmas_nome;")
