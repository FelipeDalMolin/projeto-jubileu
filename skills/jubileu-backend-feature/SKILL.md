---
name: jubileu-backend-feature
description: Implement or evolve backend/API features for Projeto Jubileu, a FastAPI, SQLAlchemy, Alembic, and PostgreSQL sports event system. Use when Codex changes or analyzes domain behavior, persistence, routes, services, tests, migrations, or backend/frontend API convergence across jogadores, dias, eventos, times, partidas, and estatisticas.
---

# Jubileu Backend Feature

Use this skill to keep backend work aligned with the current Jubileu domain, docs, and runtime constraints.

Read only the references needed for the task:

- Read [`references/backend-map.md`](./references/backend-map.md) to locate routers, models, schemas, services, tests, migrations, docs sync, and current structure.
- Read [`references/domain-rules.md`](./references/domain-rules.md) before changing Dia, Evento, teams, presence, partidas, lances, statistics, workspace, rotation, or aggregate invariants.
- Read [`references/target-architecture.md`](./references/target-architecture.md) when changing folders, module boundaries, layering, or service extraction.
- Read [`references/refactor-rules.md`](./references/refactor-rules.md) when removing legacy naming, consolidating duplicate surfaces, or moving code toward modules.
- Read [`references/platform-rules.md`](./references/platform-rules.md) when changing auth, users, `/api`, deployment, Docker, NGINX, public exposure, or security.
- Read [`references/delivery.md`](./references/delivery.md) when preparing a PR, Linear/GitHub note, validation checklist, or release-oriented summary.

## Operating Modes

### Maintenance Mode

Use for focused fixes or feature work inside the current structure.

- Preserve current domain semantics.
- Prefer the smallest coherent change set.
- Keep `Evento` naming public and active.
- Avoid structural refactors unless they directly simplify the task.

### Refactor Mode

Use when the task affects module layout, service boundaries, ownership, naming convergence, or migration/debt cleanup.

- Move new backend domain logic toward `app/modules/<domain>/`.
- Keep compatibility choices explicit.
- Do not perform blind renames.
- Include migration strategy, tests, docs sync, and rollback/risk notes when persistence changes.

## Workflow

1. Read the current code path end to end before editing.
2. Identify the owning aggregate and status/ownership rules.
3. Decide Maintenance Mode or Refactor Mode.
4. Plan the smallest coherent set across router, schema, service, model, migration, tests, and docs.
5. Implement in the project style.
6. Run the relevant checks.
7. Regenerate the code map when routes, models, schemas, frontend services, or domain surfaces changed:

```bash
python3 scripts/docs/generate_code_map.py
```

## Core Rules

### Domain

- Treat `Evento` as the current public and persisted aggregate.
- Treat `AULA` only as `Evento.tipo = AULA`.
- Preserve the chain `Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`.
- Do not introduce active code using `/aulas`, `aula_id`, `aulaId`, `WorkspaceAula`, `TimeAula`, or `JogadorAula`.
- Historical Alembic migrations may contain old names; do not use them as current implementation vocabulary.

### REST and routing

- Prefer day-scoped routes for owned resources: `/dias/{data_iso}/eventos/...`.
- Frontend data calls must use `/api/...`.
- Flat `/api/eventos/{evento_id}/...` routes are acceptable for event-level commands already established by the codebase.
- Do not add a second style for the same resource unless the compatibility reason is explicit.
- Validate parent-child ownership for nested day/event/partida resources.

### SQLAlchemy and Alembic

- Update SQLAlchemy models, Pydantic schemas, tests, and Alembic together for persistence changes.
- Use Alembic for every schema change.
- Consider PostgreSQL behavior even when local tests use SQLite.
- Review enum changes carefully.
- Preserve existing data during upgrades unless a breaking migration is explicitly planned.

### State and synchronization

- For team composition and workspace flows, follow:
  `local immediate state -> persisted command/event -> polling now -> WebSocket future`.
- Keep `TeamConfig`, `EventoEquipesEstado`, workspace versions, warnings, and rotation consistent.
- Do not duplicate business rules between routers and services.

### Auth and platform

- Keep critical authorization in the backend.
- Do not introduce public registration or bypass RBAC.
- Preserve `/api` gateway assumptions.
- Do not require public FastAPI or PostgreSQL exposure.

### Testing

- Add or update focused tests for behavior changes.
- Prefer API tests for route contracts and service tests for domain calculations.
- Cover not found, invalid transitions, ownership mismatch, empty/precondition failures, idempotency, and version consistency when relevant.

## Expected Closeout

End with:

- what changed and why;
- domain/API/migration impact;
- files changed;
- checks executed;
- risks or follow-ups that remain.
