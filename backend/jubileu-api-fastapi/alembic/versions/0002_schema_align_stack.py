"""Alinha schema legado ao stack novo (app.models.*)."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = "0002_schema_align_stack"
down_revision = "6026b3ac976e"
branch_labels = None
depends_on = None


def _table_exists(inspector: Inspector, table: str) -> bool:
    return table in inspector.get_table_names()


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # ==========================================================
    # dias
    # ==========================================================
    if _table_exists(inspector, "dias"):
        cols = {c["name"]: c for c in inspector.get_columns("dias")}

        if "data_iso" not in cols:
            op.add_column("dias", sa.Column("data_iso", sa.String(), nullable=True))

        # Preenche data_iso a partir de data (legado), somente se a coluna existir
        op.execute(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'dias'
                      AND column_name = 'data'
                ) THEN
                    UPDATE dias
                    SET data_iso = COALESCE(data_iso, to_char(data, 'YYYY-MM-DD'))
                    WHERE data_iso IS NULL;
                END IF;
            END$$;
            """
        )

        # Garante que coluna data legado não seja NOT NULL (se existir)
        op.execute(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'dias'
                      AND column_name = 'data'
                ) THEN
                    BEGIN
                        ALTER TABLE dias ALTER COLUMN data DROP NOT NULL;
                    EXCEPTION WHEN others THEN
                        NULL;
                    END;
                END IF;
            END$$;
            """
        )

        # Fail-fast: não permitir NULL antes de impor NOT NULL
        op.execute(
            """
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM dias WHERE data_iso IS NULL) THEN
                    RAISE EXCEPTION
                      'Migracao 0002: existe dias.data_iso NULL. Corrija os dados antes de aplicar NOT NULL.';
                END IF;
            END$$;
            """
        )

        # NOT NULL + UNIQUE
        op.execute("ALTER TABLE dias ALTER COLUMN data_iso SET NOT NULL;")

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
                    CREATE UNIQUE INDEX uq_dias_data_iso ON dias (data_iso);
                END IF;
            END$$;
            """
        )

        for col_name in ("feriado_nome", "feriado_tipo"):
            if col_name not in cols:
                op.add_column("dias", sa.Column(col_name, sa.String(), nullable=True))

    # ==========================================================
    # aulas
    # ==========================================================
    if _table_exists(inspector, "aulas"):
        cols = {c["name"]: c for c in inspector.get_columns("aulas")}

        if "turma_nome" not in cols:
            op.add_column("aulas", sa.Column("turma_nome", sa.String(), nullable=True))
            op.execute("UPDATE aulas SET turma_nome = COALESCE(turma_nome, turma_id::text)")
            op.execute("ALTER TABLE aulas ALTER COLUMN turma_nome SET NOT NULL")

        if "numero_aula_na_turma" not in cols:
            op.add_column(
                "aulas",
                sa.Column(
                    "numero_aula_na_turma",
                    sa.Integer(),
                    server_default="1",
                    nullable=False,
                ),
            )

        # Enums
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

        # tipo -> enum
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
                    ALTER TABLE aulas
                    ALTER COLUMN tipo DROP DEFAULT,
                    ALTER COLUMN tipo TYPE tipoeventoaulaenum
                        USING UPPER(COALESCE(tipo, 'AULA'))::tipoeventoaulaenum,
                    ALTER COLUMN tipo SET DEFAULT 'AULA',
                    ALTER COLUMN tipo SET NOT NULL;
                END IF;
            END$$;
            """
        )

        # status -> enum
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
                    ALTER TABLE aulas
                    ALTER COLUMN status DROP DEFAULT,
                    ALTER COLUMN status TYPE statusaulaenum
                        USING CASE LOWER(status)
                            WHEN 'planejada' THEN 'PLANEJADA'
                            WHEN 'em_andamento' THEN 'EM_ANDAMENTO'
                            WHEN 'concluida' THEN 'CONCLUIDA'
                            WHEN 'cancelada' THEN 'CANCELADA'
                            ELSE 'PLANEJADA'
                        END::statusaulaenum,
                    ALTER COLUMN status SET DEFAULT 'PLANEJADA',
                    ALTER COLUMN status SET NOT NULL;
                END IF;
            END$$;
            """
        )

        # Horários: time -> varchar
        for col in ("horario_inicio", "horario_fim"):
            op.execute(
                f"""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'aulas'
                          AND column_name = '{col}'
                          AND data_type = 'time without time zone'
                    ) THEN
                        ALTER TABLE aulas
                        ALTER COLUMN {col} TYPE varchar
                            USING to_char({col}, 'HH24:MI');
                    END IF;
                    ALTER TABLE aulas ALTER COLUMN {col} SET NOT NULL;
                END$$;
                """
            )

        # turma_id NOT NULL
        op.execute(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'aulas'
                      AND column_name = 'turma_id'
                ) THEN
                    ALTER TABLE aulas ALTER COLUMN turma_id SET NOT NULL;
                END IF;
            END$$;
            """
        )

    # ==========================================================
    # times_aula
    # ==========================================================
    if not _table_exists(inspector, "times_aula"):
        op.create_table(
            "times_aula",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False),
            sa.Column("nome", sa.String(), nullable=False),
            sa.Column("caracteristica", sa.String(), nullable=True),
            sa.Column("cor_camisa", sa.String(), nullable=True),
        )

    # ==========================================================
    # aula_equipes_estado
    # ==========================================================
    if not _table_exists(inspector, "aula_equipes_estado"):
        op.create_table(
            "aula_equipes_estado",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column(
                "aula_id",
                sa.Integer(),
                sa.ForeignKey("aulas.id"),
                nullable=False,
                unique=True,
            ),
            sa.Column("estado", sa.JSON(), nullable=False),
        )

    # ==========================================================
    # jogadores_aula
    # ==========================================================
    if not _table_exists(inspector, "jogadores_aula"):
        op.create_table(
            "jogadores_aula",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False),
            sa.Column(
                "jogador_id",
                sa.Integer(),
                sa.ForeignKey("jogadores.id"),
                nullable=True,
            ),
            sa.Column("nome", sa.String(), nullable=False),
            sa.Column(
                "status",
                sa.Enum(
                    "presente",
                    "faltou",
                    "atestado",
                    "coringa",
                    "so_treino",
                    name="statuspresencaenum",
                ),
                nullable=False,
                server_default="so_treino",
            ),
            sa.Column("gols", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("assistencias", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("defesas", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("chiliques", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("faltas", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("time_id", sa.Integer(), sa.ForeignKey("times_aula.id"), nullable=True),
        )

    # ==========================================================
    # partidas
    # ==========================================================
    if not _table_exists(inspector, "partidas"):
        op.create_table(
            "partidas",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False),
            sa.Column("ordem", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("time_a_id", sa.Integer(), sa.ForeignKey("times_aula.id"), nullable=False),
            sa.Column("time_b_id", sa.Integer(), sa.ForeignKey("times_aula.id"), nullable=False),
            sa.Column("gols_time_a", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("gols_time_b", sa.Integer(), nullable=False, server_default="0"),
        )

    # ==========================================================
    # estatisticas_jogador_partida
    # ==========================================================
    if not _table_exists(inspector, "estatisticas_jogador_partida"):
        op.create_table(
            "estatisticas_jogador_partida",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column(
                "partida_id",
                sa.Integer(),
                sa.ForeignKey("partidas.id"),
                nullable=False,
            ),
            sa.Column(
                "jogador_aula_id",
                sa.Integer(),
                sa.ForeignKey("jogadores_aula.id"),
                nullable=False,
            ),
            sa.Column("gols", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("assistencias", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("defesas", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("chiliques", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("faltas", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("nota", sa.Integer(), nullable=True),
        )


def downgrade() -> None:
    op.drop_table("estatisticas_jogador_partida")
    op.drop_table("partidas")
    op.drop_table("jogadores_aula")
    op.drop_table("aula_equipes_estado")
    op.drop_table("times_aula")

    op.execute(
        """
        ALTER TABLE aulas ALTER COLUMN horario_inicio DROP NOT NULL;
        ALTER TABLE aulas ALTER COLUMN horario_fim DROP NOT NULL;
        ALTER TABLE aulas ALTER COLUMN turma_id DROP NOT NULL;
        ALTER TABLE aulas ALTER COLUMN turma_nome DROP NOT NULL;
        ALTER TABLE aulas ALTER COLUMN numero_aula_na_turma DROP DEFAULT;
        ALTER TABLE aulas ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE aulas ALTER COLUMN tipo DROP DEFAULT;
        """
    )

    op.execute("DROP INDEX IF EXISTS uq_dias_data_iso")
    op.execute("ALTER TABLE dias ALTER COLUMN data_iso DROP NOT NULL")
