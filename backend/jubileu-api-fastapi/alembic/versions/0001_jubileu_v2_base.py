"""Baseline da stack nova (app.models.*)."""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_jubileu_v2_base"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    status_aula_enum = sa.Enum(
        "PLANEJADA",
        "EM_ANDAMENTO",
        "CONCLUIDA",
        "CANCELADA",
        name="statusaulaenum",
    )
    tipo_evento_enum = sa.Enum(
        "AULA",
        "JOGO",
        "OUTRO",
        name="tipoeventoaulaenum",
    )
    status_presenca_enum = sa.Enum(
        "presente",
        "faltou",
        "atestado",
        "coringa",
        "so_treino",
        name="statuspresencaenum",
    )

    op.create_table(
        "jogadores",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("apelido", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="ativo"),
    )

    op.create_table(
        "turmas",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("nome", sa.String(), nullable=False),
    )

    op.create_table(
        "dias",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("data_iso", sa.String(), nullable=False),
        sa.Column("feriado_nome", sa.String(), nullable=True),
        sa.Column("feriado_tipo", sa.String(), nullable=True),
        sa.UniqueConstraint("data_iso"),
    )

    op.create_table(
        "turmas_jogadores",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "turma_id",
            sa.Integer(),
            sa.ForeignKey("turmas.id"),
            nullable=False,
        ),
        sa.Column(
            "jogador_id",
            sa.Integer(),
            sa.ForeignKey("jogadores.id"),
            nullable=False,
        ),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.UniqueConstraint("turma_id", "jogador_id", name="uq_turma_jogador"),
    )

    op.create_table(
        "aulas",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("dia_id", sa.Integer(), sa.ForeignKey("dias.id"), nullable=False),
        sa.Column("turma_id", sa.String(), nullable=False),
        sa.Column("turma_nome", sa.String(), nullable=False),
        sa.Column(
            "numero_aula_na_turma",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "tipo",
            tipo_evento_enum,
            nullable=False,
            server_default="AULA",
        ),
        sa.Column("horario_inicio", sa.String(), nullable=False),
        sa.Column("horario_fim", sa.String(), nullable=False),
        sa.Column(
            "status",
            status_aula_enum,
            nullable=False,
            server_default="PLANEJADA",
        ),
    )

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

    op.create_table(
        "times_aula",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("caracteristica", sa.String(), nullable=True),
        sa.Column("cor_camisa", sa.String(), nullable=True),
    )

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
            status_presenca_enum,
            nullable=False,
            server_default="so_treino",
        ),
        sa.Column("gols", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("assistencias", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("defesas", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("chiliques", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("faltas", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "time_id",
            sa.Integer(),
            sa.ForeignKey("times_aula.id"),
            nullable=True,
        ),
    )

    op.create_table(
        "partidas",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False),
        sa.Column("ordem", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "time_a_id",
            sa.Integer(),
            sa.ForeignKey("times_aula.id"),
            nullable=False,
        ),
        sa.Column(
            "time_b_id",
            sa.Integer(),
            sa.ForeignKey("times_aula.id"),
            nullable=False,
        ),
        sa.Column("gols_time_a", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("gols_time_b", sa.Integer(), nullable=False, server_default="0"),
    )

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
    op.drop_table("times_aula")
    op.drop_table("aula_equipes_estado")
    op.drop_table("aulas")
    op.drop_table("turmas_jogadores")
    op.drop_table("dias")
    op.drop_table("turmas")
    op.drop_table("jogadores")

    op.execute("DROP TYPE IF EXISTS statusaulaenum")
    op.execute("DROP TYPE IF EXISTS tipoeventoaulaenum")
    op.execute("DROP TYPE IF EXISTS statuspresencaenum")
