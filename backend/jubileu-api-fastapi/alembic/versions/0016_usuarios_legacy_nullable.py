"""Relax legacy usuarios columns after canonical auth migration

Revision ID: 0016_usuarios_legacy_nullable
Revises: 0015_usuarios_schema_align
Create Date: 2026-05-10 19:55:00
"""

from alembic import op
import sqlalchemy as sa

revision = "0016_usuarios_legacy_nullable"
down_revision = "0015_usuarios_schema_align"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table_name not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(table_name)}


def upgrade() -> None:
    columns = _columns("usuarios")
    with op.batch_alter_table("usuarios") as batch_op:
        if "nome" in columns:
            batch_op.alter_column("nome", existing_type=sa.String(length=100), nullable=True)
        if "senha_hash" in columns:
            batch_op.alter_column("senha_hash", existing_type=sa.String(length=255), nullable=True)
        if "papel" in columns:
            batch_op.alter_column("papel", existing_type=sa.String(length=20), nullable=True)
        if "ativo" in columns:
            batch_op.alter_column("ativo", existing_type=sa.Boolean(), nullable=True)


def downgrade() -> None:
    columns = _columns("usuarios")
    op.execute("UPDATE usuarios SET nome = COALESCE(nome, display_name, username, 'Usuario ' || id::text)")
    op.execute("UPDATE usuarios SET senha_hash = COALESCE(senha_hash, password_hash, '')")
    op.execute("UPDATE usuarios SET papel = COALESCE(papel, role, 'user')")
    op.execute("UPDATE usuarios SET ativo = TRUE WHERE ativo IS NULL")

    with op.batch_alter_table("usuarios") as batch_op:
        if "ativo" in columns:
            batch_op.alter_column("ativo", existing_type=sa.Boolean(), nullable=False)
        if "papel" in columns:
            batch_op.alter_column("papel", existing_type=sa.String(length=20), nullable=False)
        if "senha_hash" in columns:
            batch_op.alter_column("senha_hash", existing_type=sa.String(length=255), nullable=False)
        if "nome" in columns:
            batch_op.alter_column("nome", existing_type=sa.String(length=100), nullable=False)
