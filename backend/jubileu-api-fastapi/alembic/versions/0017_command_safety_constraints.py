"""Add command safety uniqueness constraints

Revision ID: 0017_command_safety_constraints
Revises: 0016_usuarios_legacy_nullable
Create Date: 2026-07-04 18:00:00
"""

from alembic import op
import sqlalchemy as sa

revision = "0017_command_safety_constraints"
down_revision = "0016_usuarios_legacy_nullable"
branch_labels = None
depends_on = None


def _tables() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _unique_constraints(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table_name not in inspector.get_table_names():
        return set()
    return {item["name"] for item in inspector.get_unique_constraints(table_name) if item.get("name")}


def _create_unique_constraint_if_missing(name: str, table_name: str, columns: list[str]) -> None:
    if table_name not in _tables() or name in _unique_constraints(table_name):
        return

    if op.get_bind().dialect.name == "postgresql":
        quoted_columns = ", ".join(columns)
        op.execute(
            sa.text(
                f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = '{name}'
                    ) THEN
                        ALTER TABLE {table_name}
                        ADD CONSTRAINT {name} UNIQUE ({quoted_columns});
                    END IF;
                END
                $$;
                """
            )
        )
        return

    with op.batch_alter_table(table_name) as batch_op:
        batch_op.create_unique_constraint(name, columns)


def _drop_constraint_if_exists(name: str, table_name: str) -> None:
    if table_name not in _tables() or name not in _unique_constraints(table_name):
        return

    if op.get_bind().dialect.name == "postgresql":
        op.execute(f"ALTER TABLE {table_name} DROP CONSTRAINT IF EXISTS {name}")
        return

    with op.batch_alter_table(table_name) as batch_op:
        batch_op.drop_constraint(name, type_="unique")


def _dedupe_times_evento() -> None:
    if "times_evento" not in _tables():
        return
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (PARTITION BY evento_id, nome ORDER BY id) AS rn
            FROM times_evento
        )
        UPDATE times_evento
        SET nome = nome || ' (dup ' || id || ')'
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
        """
    )


def _dedupe_lances_client_event_id() -> None:
    if "lances" not in _tables():
        return
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY partida_id, client_event_id
                    ORDER BY id
                ) AS rn
            FROM lances
            WHERE client_event_id IS NOT NULL
        )
        UPDATE lances
        SET client_event_id = client_event_id || ':dup:' || id
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
        """
    )


def _normalize_partida_ordem() -> None:
    if "partidas" not in _tables():
        return
    op.execute(
        """
        WITH ordered AS (
            SELECT
                id,
                ROW_NUMBER() OVER (PARTITION BY evento_id ORDER BY ordem, id) AS new_ordem
            FROM partidas
        )
        UPDATE partidas
        SET ordem = (
            SELECT ordered.new_ordem
            FROM ordered
            WHERE ordered.id = partidas.id
        )
        WHERE id IN (SELECT id FROM ordered)
        """
    )


def _dedupe_estatisticas() -> None:
    if "estatisticas_jogador_partida" not in _tables():
        return
    op.execute(
        """
        WITH dedup AS (
            SELECT
                MIN(id) AS keep_id,
                partida_id,
                jogador_evento_id,
                MAX(gols) AS gols,
                MAX(assistencias) AS assistencias,
                MAX(chiliques) AS chiliques,
                MAX(faltas) AS faltas,
                MAX(nota) AS nota
            FROM estatisticas_jogador_partida
            GROUP BY partida_id, jogador_evento_id
        )
        UPDATE estatisticas_jogador_partida
        SET
            gols = (SELECT d.gols FROM dedup d WHERE d.keep_id = estatisticas_jogador_partida.id),
            assistencias = (SELECT d.assistencias FROM dedup d WHERE d.keep_id = estatisticas_jogador_partida.id),
            chiliques = (SELECT d.chiliques FROM dedup d WHERE d.keep_id = estatisticas_jogador_partida.id),
            faltas = (SELECT d.faltas FROM dedup d WHERE d.keep_id = estatisticas_jogador_partida.id),
            nota = (SELECT d.nota FROM dedup d WHERE d.keep_id = estatisticas_jogador_partida.id)
        WHERE id IN (SELECT keep_id FROM dedup)
        """
    )
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY partida_id, jogador_evento_id
                    ORDER BY id
                ) AS rn
            FROM estatisticas_jogador_partida
        )
        DELETE FROM estatisticas_jogador_partida
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
        """
    )


def upgrade() -> None:
    _dedupe_times_evento()
    _dedupe_lances_client_event_id()
    _normalize_partida_ordem()
    _dedupe_estatisticas()

    _create_unique_constraint_if_missing(
        "uq_times_evento_evento_nome",
        "times_evento",
        ["evento_id", "nome"],
    )
    _create_unique_constraint_if_missing(
        "uq_lances_partida_client_event_id",
        "lances",
        ["partida_id", "client_event_id"],
    )
    _create_unique_constraint_if_missing(
        "uq_partidas_evento_ordem",
        "partidas",
        ["evento_id", "ordem"],
    )
    _create_unique_constraint_if_missing(
        "uq_estatisticas_partida_jogador",
        "estatisticas_jogador_partida",
        ["partida_id", "jogador_evento_id"],
    )


def downgrade() -> None:
    _drop_constraint_if_exists("uq_estatisticas_partida_jogador", "estatisticas_jogador_partida")
    _drop_constraint_if_exists("uq_partidas_evento_ordem", "partidas")
    _drop_constraint_if_exists("uq_lances_partida_client_event_id", "lances")
    _drop_constraint_if_exists("uq_times_evento_evento_nome", "times_evento")
