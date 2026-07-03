# Target Architecture

This file describes the desired backend internals for the Jubileu API as the project matures beyond mixed layer-by-type organization.

## Scope

This architecture applies under:

`backend/jubileu-api-fastapi/app/`

It does not replace repository-level layout such as `docs/`, `skills/`, `backend/`, `frontend/`, or `infra/`.

## Target backend layout

```text
app/
  core/
    config.py
    security.py
  db/
    base.py
    session.py
  modules/
    auth/
      models.py
      schemas.py
      service.py
      routes.py
    usuarios/
      models.py
      schemas.py
      service.py
      routes.py
    jogadores/
      models.py
      schemas.py
      service.py
      routes.py
    turmas/
      models.py
      schemas.py
      service.py
      routes.py
    dias/
      service.py
      routes.py
    eventos/
      models.py
      schemas.py
      service.py
      routes.py
    partidas/
      models.py
      schemas.py
      service.py
      routes.py
    estatisticas/
      models.py
      schemas.py
      service.py
      routes.py
    dashboards/
      schemas.py
      service.py
      routes.py
```

## Current transition

The codebase already has partial module extraction:

- `app/modules/auth/`
- `app/modules/dias/`
- `app/modules/eventos/`
- `app/modules/partidas/`

New backend work should move toward this shape without forcing a big-bang folder move.

## Layer ownership

- Routers parse HTTP, inject dependencies, validate route ownership, and map responses.
- Services own business rules, transitions, derived state, and reusable calculations.
- Models own persistence mapping.
- Schemas own public payload shape.
- Alembic owns schema evolution.
- Tests own behavioral confidence and compatibility evidence.

## Docs sync

Structural movement should update:

- `docs/current/ARCHITECTURE.md`
- `docs/current/DOMAIN_MODEL.md` when domain ownership changes
- `docs/current/API.md` when public routes or payloads change
- `docs/generated/code-map.md` via `python3 scripts/docs/generate_code_map.py`
