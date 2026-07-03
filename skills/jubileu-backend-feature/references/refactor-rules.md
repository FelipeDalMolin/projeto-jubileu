# Refactor Rules

Use this file for structural refactors, module extraction, naming cleanup, or duplicate contract consolidation.

## Refactor goal

Move the backend toward clear domain modules while preserving the active domain:

```text
Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas
```

## Current cleanup direction

The major Aula-to-Evento public migration has already happened in active code. Current refactor work should focus on:

- reducing router/service mixing;
- moving new domain logic into `app/modules/<domain>/`;
- consolidating duplicate route/service surfaces;
- removing stale Aula vocabulary from active docs, skills, types, and comments;
- keeping generated docs synchronized with code.

## Historical names

Historical migrations may still contain names such as:

- `Aula`
- `TimeAula`
- `JogadorAula`
- `WorkspaceAula`

Do not rename historical migrations just to make wording cleaner. Do prevent those names from guiding new active code.

## Core rules

- Do not perform blind renames.
- Do not combine unrelated cleanup with feature delivery unless it reduces direct risk.
- Preserve behavior before moving code.
- Move shared rules out of routers into services.
- Keep compatibility choices explicit and documented.
- Every meaningful persistence refactor needs migration planning, tests, docs sync, and rollback/risk notes.

## Structural extraction rules

When refactor mode is active:

- put new domain code in `app/modules/<domain>/`;
- keep shared config/security in `app/core/`;
- keep shared database/session infrastructure in `app/db/` or the existing `app/database.py` bridge until deliberately migrated;
- keep route registration clear in `app/main.py`;
- avoid creating a second owner for the same business rule.

## Compatibility rules

If current routes, schemas, or DB naming must remain temporarily:

- keep them intentionally;
- document the compatibility choice;
- identify the follow-up cleanup step;
- keep frontend calls on `/api/...`.

## Migration rules

Any DB-affecting refactor must consider:

- Alembic revision strategy;
- existing rows and defaults;
- enum compatibility;
- nullable-to-non-null transitions;
- rollback awareness;
- PostgreSQL behavior even when tests use SQLite.
