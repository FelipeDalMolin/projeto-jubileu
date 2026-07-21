"""Add rollback-safe Argon2 hashes and rotating auth sessions.

Revision ID: 0020_auth_sessions_rollback_safe
Revises: 0019_proxima_partida_idempotente
"""

from alembic import op
import sqlalchemy as sa

revision = "0020_auth_sessions_rollback_safe"
down_revision = "0019_proxima_partida_idempotente"
branch_labels = None
depends_on = None

DEFAULT_USER_IDS = ("u-admin", "u-coach", "u-aux", "u-user")


def upgrade() -> None:
    with op.batch_alter_table("usuarios") as batch_op:
        batch_op.add_column(sa.Column("password_hash_argon2", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))

    quoted = ", ".join(f"'{value}'" for value in DEFAULT_USER_IDS)
    op.execute(sa.text(f"UPDATE usuarios SET is_active = false WHERE user_id IN ({quoted})"))

    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("sid", sa.String(36), nullable=False),
        sa.Column("family_id", sa.String(36), nullable=False),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("refresh_digest", sa.String(64), nullable=False),
        sa.Column("replaced_by_sid", sa.String(36), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("absolute_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rotated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_auth_sessions_sid", "auth_sessions", ["sid"], unique=True)
    op.create_index("ix_auth_sessions_family_id", "auth_sessions", ["family_id"])
    op.create_index("ix_auth_sessions_usuario_id", "auth_sessions", ["usuario_id"])
    op.create_index("ix_auth_sessions_refresh_digest", "auth_sessions", ["refresh_digest"], unique=True)


def downgrade() -> None:
    op.drop_table("auth_sessions")
    with op.batch_alter_table("usuarios") as batch_op:
        batch_op.drop_column("is_active")
        batch_op.drop_column("password_hash_argon2")
