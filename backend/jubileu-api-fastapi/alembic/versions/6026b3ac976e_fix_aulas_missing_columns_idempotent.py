from alembic import op

# revision identifiers, used by Alembic.
revision = "6026b3ac976e"
down_revision = "ed2829ef7fc0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS turma_nome varchar(120)")
    op.execute("ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS numero_aula_na_turma integer")
    op.execute("ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS tipo varchar(50)")


def downgrade() -> None:
    op.execute("ALTER TABLE public.aulas DROP COLUMN IF EXISTS tipo")
    op.execute("ALTER TABLE public.aulas DROP COLUMN IF EXISTS numero_aula_na_turma")
    op.execute("ALTER TABLE public.aulas DROP COLUMN IF EXISTS turma_nome")
