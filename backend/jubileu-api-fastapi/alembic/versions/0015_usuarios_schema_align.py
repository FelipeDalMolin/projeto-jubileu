"""Align legacy usuarios table to persisted auth user model

Revision ID: 0015_usuarios_schema_align
Revises: 0014_evento_turma_condicional
Create Date: 2026-05-10 19:40:00
"""

from alembic import op
import sqlalchemy as sa

revision = "0015_usuarios_schema_align"
down_revision = "0014_evento_turma_condicional"
branch_labels = None
depends_on = None


def _tables() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table_name not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(table_name)}


def _indexes(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table_name not in inspector.get_table_names():
        return set()
    return {idx["name"] for idx in inspector.get_indexes(table_name)}


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    if column.name not in _columns(table_name):
        op.add_column(table_name, column)


def _create_usuarios_if_missing() -> None:
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


def _create_index_if_missing(name: str, table_name: str, columns: list[str], *, unique: bool = False) -> None:
    if name not in _indexes(table_name):
        op.create_index(name, table_name, columns, unique=unique)


def upgrade() -> None:
    _create_usuarios_if_missing()

    _add_column_if_missing("usuarios", sa.Column("user_id", sa.String(), nullable=True))
    _add_column_if_missing("usuarios", sa.Column("username", sa.String(), nullable=True))
    _add_column_if_missing("usuarios", sa.Column("password_hash", sa.String(), nullable=True))
    _add_column_if_missing("usuarios", sa.Column("display_name", sa.String(), nullable=True))
    _add_column_if_missing("usuarios", sa.Column("role", sa.String(), nullable=True))
    _add_column_if_missing(
        "usuarios",
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    _add_column_if_missing(
        "usuarios",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )

    columns = _columns("usuarios")
    if "nome" in columns:
        op.execute(
            "UPDATE usuarios "
            "SET display_name = COALESCE(NULLIF(display_name, ''), NULLIF(nome, ''), 'Usuario ' || id::text) "
            "WHERE display_name IS NULL OR display_name = ''"
        )
    else:
        op.execute(
            "UPDATE usuarios "
            "SET display_name = COALESCE(NULLIF(display_name, ''), 'Usuario ' || id::text) "
            "WHERE display_name IS NULL OR display_name = ''"
        )

    if "senha_hash" in columns:
        op.execute(
            "UPDATE usuarios "
            "SET password_hash = COALESCE(NULLIF(password_hash, ''), senha_hash, '') "
            "WHERE password_hash IS NULL OR password_hash = ''"
        )
    else:
        op.execute("UPDATE usuarios SET password_hash = '' WHERE password_hash IS NULL")

    if "papel" in columns:
        op.execute(
            "UPDATE usuarios "
            "SET role = CASE LOWER(COALESCE(NULLIF(role, ''), papel, 'user')) "
            "WHEN 'admin' THEN 'admin' "
            "WHEN 'treinador' THEN 'treinador' "
            "WHEN 'auxiliar' THEN 'auxiliar' "
            "ELSE 'user' END "
            "WHERE role IS NULL OR role = ''"
        )
    else:
        op.execute("UPDATE usuarios SET role = 'user' WHERE role IS NULL OR role = ''")

    op.execute(
        "UPDATE usuarios "
        "SET username = COALESCE(NULLIF(username, ''), 'legacy-user-' || id::text) "
        "WHERE username IS NULL OR username = ''"
    )
    op.execute(
        "UPDATE usuarios "
        "SET user_id = COALESCE(NULLIF(user_id, ''), 'legacy-' || id::text) "
        "WHERE user_id IS NULL OR user_id = ''"
    )
    op.execute("UPDATE usuarios SET created_at = NOW() WHERE created_at IS NULL")
    op.execute("UPDATE usuarios SET updated_at = NOW() WHERE updated_at IS NULL")

    with op.batch_alter_table("usuarios") as batch_op:
        batch_op.alter_column("user_id", existing_type=sa.String(), nullable=False)
        batch_op.alter_column("username", existing_type=sa.String(), nullable=False)
        batch_op.alter_column("password_hash", existing_type=sa.String(), nullable=False)
        batch_op.alter_column("display_name", existing_type=sa.String(), nullable=False)
        batch_op.alter_column("role", existing_type=sa.String(), nullable=False)
        batch_op.alter_column("email", existing_type=sa.String(), nullable=True)
        batch_op.alter_column("created_at", existing_type=sa.DateTime(timezone=True), nullable=False)
        batch_op.alter_column("updated_at", existing_type=sa.DateTime(timezone=True), nullable=False)

    _create_index_if_missing("ix_usuarios_id", "usuarios", ["id"])
    _create_index_if_missing("ix_usuarios_user_id", "usuarios", ["user_id"], unique=True)
    _create_index_if_missing("ix_usuarios_username", "usuarios", ["username"], unique=True)


def downgrade() -> None:
    indexes = _indexes("usuarios")
    for index_name in ("ix_usuarios_username", "ix_usuarios_user_id", "ix_usuarios_id"):
        if index_name in indexes:
            op.drop_index(index_name, table_name="usuarios")

    columns = _columns("usuarios")
    with op.batch_alter_table("usuarios") as batch_op:
        for column_name in (
            "updated_at",
            "created_at",
            "role",
            "display_name",
            "password_hash",
            "username",
            "user_id",
        ):
            if column_name in columns:
                batch_op.drop_column(column_name)
