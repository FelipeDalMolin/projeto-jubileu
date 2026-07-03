---
name: jubileu-backend-feature
description: Local launcher for the versioned Projeto Jubileu backend/API skill. Use when Codex changes or analyzes FastAPI, SQLAlchemy, Alembic, PostgreSQL, routes, services, tests, docs sync, or frontend/API convergence across jogadores, dias, eventos, times, partidas, and estatisticas.
---

# Jubileu Backend Feature

This local `.codex` skill delegates to the versioned skill in the repository to avoid drift.

Before backend/API work, read:

- [`../../../skills/jubileu-backend-feature/SKILL.md`](../../../skills/jubileu-backend-feature/SKILL.md)
- [`../../../AGENTS.md`](../../../AGENTS.md)
- [`../../../docs/current/CHAT_CONTEXT.md`](../../../docs/current/CHAT_CONTEXT.md)

Then follow the versioned skill references under `skills/jubileu-backend-feature/references/`.

Important local rule: `.codex/` is ignored by Git, so durable project instructions belong in
`AGENTS.md`, `docs/current/`, and `skills/`.
