"""Canonical Evento persistence and persisted users

Revision ID: 0013_eventos_canonicos_usuarios
Revises: 0012_evento_rotacao_manual
Create Date: 2026-05-09 12:00:00
"""

from alembic import op
import sqlalchemy as sa

revision = "0013_eventos_canonicos_usuarios"
down_revision = "0012_evento_rotacao_manual"
branch_labels = None
depends_on = None


def _tables() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table_name not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(table_name)}


def _rename_table_if_needed(old: str, new: str) -> None:
    tables = _tables()
    if old in tables and new not in tables:
        op.rename_table(old, new)


def _rename_column_if_needed(table_name: str, old: str, new: str) -> None:
    columns = _columns(table_name)
    if old in columns and new not in columns:
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.alter_column(old, new_column_name=new)


def _normalize_postgresql_event_enums() -> bool:
    if op.get_bind().dialect.name != "postgresql" or "eventos" not in _tables():
        return False

    columns = _columns("eventos")
    if "status" in columns:
        op.execute("ALTER TABLE eventos ALTER COLUMN status DROP DEFAULT")
        op.execute("ALTER TABLE eventos ALTER COLUMN status TYPE text USING status::text")
        op.execute("UPDATE eventos SET status = 'PLANEJADO' WHERE status = 'PLANEJADA'")
        op.execute("UPDATE eventos SET status = 'ENCERRADO' WHERE status = 'CONCLUIDA'")
        op.execute("UPDATE eventos SET status = 'CANCELADO' WHERE status = 'CANCELADA'")
        op.execute("DROP TYPE IF EXISTS statusaulaenum")
        op.execute("DROP TYPE IF EXISTS statuseventoenum")
        op.execute(
            "CREATE TYPE statuseventoenum AS ENUM "
            "('PLANEJADO', 'EM_ANDAMENTO', 'ENCERRADO', 'CANCELADO')"
        )
        op.execute(
            "ALTER TABLE eventos ALTER COLUMN status "
            "TYPE statuseventoenum USING status::statuseventoenum"
        )
        op.execute("ALTER TABLE eventos ALTER COLUMN status SET DEFAULT 'PLANEJADO'")

    if "tipo" in columns:
        op.execute("ALTER TABLE eventos ALTER COLUMN tipo DROP DEFAULT")
        op.execute("ALTER TABLE eventos ALTER COLUMN tipo TYPE text USING tipo::text")
        op.execute("UPDATE eventos SET tipo = 'JOGO_LIVRE' WHERE tipo = 'JOGO'")
        op.execute("DROP TYPE IF EXISTS tipoeventoaulaenum")
        op.execute("DROP TYPE IF EXISTS tipoeventoenum")
        op.execute("CREATE TYPE tipoeventoenum AS ENUM ('AULA', 'JOGO_LIVRE', 'OUTRO')")
        op.execute("ALTER TABLE eventos ALTER COLUMN tipo TYPE tipoeventoenum USING tipo::tipoeventoenum")
        op.execute("ALTER TABLE eventos ALTER COLUMN tipo SET DEFAULT 'AULA'")

    return True


def _restore_postgresql_event_enums_for_downgrade() -> bool:
    if op.get_bind().dialect.name != "postgresql" or "eventos" not in _tables():
        return False

    columns = _columns("eventos")
    if "status" in columns:
        op.execute("ALTER TABLE eventos ALTER COLUMN status DROP DEFAULT")
        op.execute("ALTER TABLE eventos ALTER COLUMN status TYPE text USING status::text")
        op.execute("UPDATE eventos SET status = 'PLANEJADA' WHERE status = 'PLANEJADO'")
        op.execute("UPDATE eventos SET status = 'CONCLUIDA' WHERE status = 'ENCERRADO'")
        op.execute("UPDATE eventos SET status = 'CANCELADA' WHERE status = 'CANCELADO'")
        op.execute("DROP TYPE IF EXISTS statuseventoenum")
        op.execute("DROP TYPE IF EXISTS statusaulaenum")
        op.execute(
            "CREATE TYPE statusaulaenum AS ENUM "
            "('PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')"
        )
        op.execute(
            "ALTER TABLE eventos ALTER COLUMN status "
            "TYPE statusaulaenum USING status::statusaulaenum"
        )
        op.execute("ALTER TABLE eventos ALTER COLUMN status SET DEFAULT 'PLANEJADA'")

    if "tipo" in columns:
        op.execute("ALTER TABLE eventos ALTER COLUMN tipo DROP DEFAULT")
        op.execute("ALTER TABLE eventos ALTER COLUMN tipo TYPE text USING tipo::text")
        op.execute("UPDATE eventos SET tipo = 'JOGO' WHERE tipo = 'JOGO_LIVRE'")
        op.execute("DROP TYPE IF EXISTS tipoeventoenum")
        op.execute("DROP TYPE IF EXISTS tipoeventoaulaenum")
        op.execute("CREATE TYPE tipoeventoaulaenum AS ENUM ('AULA', 'JOGO', 'OUTRO')")
        op.execute("ALTER TABLE eventos ALTER COLUMN tipo TYPE tipoeventoaulaenum USING tipo::tipoeventoaulaenum")
        op.execute("ALTER TABLE eventos ALTER COLUMN tipo SET DEFAULT 'AULA'")

    return True


def _create_usuarios_if_needed() -> None:
    if "usuarios" in _tables():
        return
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("display_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("jogador_id", sa.Integer(), sa.ForeignKey("jogadores.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_usuarios_id", "usuarios", ["id"])
    op.create_index("ix_usuarios_user_id", "usuarios", ["user_id"], unique=True)
    op.create_index("ix_usuarios_username", "usuarios", ["username"], unique=True)


def upgrade() -> None:
    _rename_table_if_needed("aulas", "eventos")
    _rename_table_if_needed("aula_equipes_estado", "evento_equipes_estado")
    _rename_table_if_needed("times_aula", "times_evento")
    _rename_table_if_needed("jogadores_aula", "jogadores_evento")

    _rename_column_if_needed("eventos", "numero_aula_na_turma", "numero_evento_na_turma")
    for table_name in (
        "evento_equipes_estado",
        "team_configs",
        "times_evento",
        "jogadores_evento",
        "partidas",
        "evento_participantes",
        "lances",
        "evento_rotacao_estado",
        "evento_rotacao_sorteio",
    ):
        _rename_column_if_needed(table_name, "aula_id", "evento_id")
    _rename_column_if_needed(
        "estatisticas_jogador_partida",
        "jogador_aula_id",
        "jogador_evento_id",
    )

    if not _normalize_postgresql_event_enums() and "eventos" in _tables():
        op.execute("UPDATE eventos SET status = 'PLANEJADO' WHERE status = 'PLANEJADA'")
        op.execute("UPDATE eventos SET status = 'ENCERRADO' WHERE status = 'CONCLUIDA'")
        op.execute("UPDATE eventos SET status = 'CANCELADO' WHERE status = 'CANCELADA'")
        op.execute("UPDATE eventos SET tipo = 'JOGO_LIVRE' WHERE tipo = 'JOGO'")

        with op.batch_alter_table("eventos") as batch_op:
            batch_op.alter_column("status", server_default="PLANEJADO")

    _create_usuarios_if_needed()


def downgrade() -> None:
    if "usuarios" in _tables():
        op.drop_index("ix_usuarios_username", table_name="usuarios")
        op.drop_index("ix_usuarios_user_id", table_name="usuarios")
        op.drop_index("ix_usuarios_id", table_name="usuarios")
        op.drop_table("usuarios")

    if "eventos" in _tables() and not _restore_postgresql_event_enums_for_downgrade():
        op.execute("UPDATE eventos SET status = 'PLANEJADA' WHERE status = 'PLANEJADO'")
        op.execute("UPDATE eventos SET status = 'CONCLUIDA' WHERE status = 'ENCERRADO'")
        op.execute("UPDATE eventos SET status = 'CANCELADA' WHERE status = 'CANCELADO'")
        op.execute("UPDATE eventos SET tipo = 'JOGO' WHERE tipo = 'JOGO_LIVRE'")
        with op.batch_alter_table("eventos") as batch_op:
            batch_op.alter_column("status", server_default="PLANEJADA")

    _rename_column_if_needed(
        "estatisticas_jogador_partida",
        "jogador_evento_id",
        "jogador_aula_id",
    )
    for table_name in (
        "evento_rotacao_sorteio",
        "evento_rotacao_estado",
        "lances",
        "evento_participantes",
        "partidas",
        "jogadores_evento",
        "times_evento",
        "team_configs",
        "evento_equipes_estado",
    ):
        _rename_column_if_needed(table_name, "evento_id", "aula_id")
    _rename_column_if_needed("eventos", "numero_evento_na_turma", "numero_aula_na_turma")

    _rename_table_if_needed("jogadores_evento", "jogadores_aula")
    _rename_table_if_needed("times_evento", "times_aula")
    _rename_table_if_needed("evento_equipes_estado", "aula_equipes_estado")
    _rename_table_if_needed("eventos", "aulas")
