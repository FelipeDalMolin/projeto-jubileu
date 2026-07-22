# Backend Map

Use this file to orient before backend edits.

## Stack

- API: `backend/jubileu-api-fastapi/app/main.py`
- ORM: `backend/jubileu-api-fastapi/app/models/`
- Schemas: `backend/jubileu-api-fastapi/app/schemas/`
- Services: `backend/jubileu-api-fastapi/app/services/` and capability modules under `app/modules/`
- Migrations: `backend/jubileu-api-fastapi/alembic/`
- Tests: `backend/jubileu-api-fastapi/tests/`
- Generated map: `docs/generated/code-map.md`

## Current backend shape

The backend is partially modularized:

- current routers still live in `app/routers/`;
- extracted modules live in `app/modules/`;
- dashboard APIs live in `app/api/dashboards/`;
- shared config/database pieces live in `app/core/`, `app/db/`, and `app/database.py`.

## Primary files

- `app/main.py`
  Registers minimal public health/auth routes and one authenticated `/api` router; data aliases are not mounted.

- `app/routers/dias.py`
  Day-scoped event workflow: `/dias/{data_iso}/eventos`, teams, status, state, workspace, and presence confirmation.

- `app/routers/partidas.py`
  Day/event-scoped partidas and per-player stats.

- `app/routers/eventos.py`
  `/api/eventos/{evento_id}/...` commands for RSVP, check-in, lifecycle, seed, lances, and rotation.

- `app/modules/eventos/service.py`, `lifecycle.py`, `participants.py`
  Import-only facade plus extracted lifecycle and participant capabilities. `_legacy.py` is
  transitional and must not be imported by routers.

- `app/routers/jogadores.py`, `app/routers/turmas.py`, `app/routers/usuarios.py`
  CRUD/profile surfaces for players, classes/groups, and current user profile.

- `app/models/dia_evento_core.py`
  `Dia`, `Evento`, `EventoEquipesEstado`, `TeamConfig`, `TimeEvento`, and `JogadorEvento`.

- `app/models/dia_evento_event.py`
  `EventoParticipante` and `Lance`.

- `app/models/dia_evento_match.py`
  `Partida` and `EstatisticaJogadorPartida`.

- `app/models/dia_evento_rotation.py`
  Rotation state and draw/audit records.

- `app/models/jogador_turma.py`, `app/models/usuario.py`
  Player, turma, membership, and user identity models.

- `app/services/estado_equipes.py`
  Team snapshot rebuilding and active `TeamConfig` version management.

- `app/services/workspace_evento.py`
  Workspace read-model, KPIs, warnings, and combined version logic.

## Test entry points

- `app/modules/auth/policy.py` and `tests/test_api_authorization_policy.py`
  Exhaustive route policy plus positive, `401`, and `403` authorization gates.
- `tests/test_smoke_api.py` and `tests/test_api_standardization_aliases.py`
  Startup, canonical `/api`, removed aliases and no-redirect contract checks.

- `tests/test_eventos_api.py`, `tests/test_eventos_rotacao_api.py`, `tests/test_partidas_lifecycle_api.py`
  Event operations, rotation, lances, and partida lifecycle.

- `tests/test_workspace_evento.py`
  Workspace versioning, warnings, and KPI coverage.

- `tests/test_auth_jwt_rbac.py`, `tests/test_usuarios_api.py`
  Auth, RBAC, and profile flows.

- `tests/test_mvp_flow.py`
  Cross-feature flow; may require `DATABASE_URL_TEST`.

## Reading order by task

### Add or change an endpoint

1. `app/main.py`
2. target router
3. related schema
4. related service/helper
5. related tests
6. `docs/current/API.md`
7. `docs/generated/code-map.md`

### Change persistence

1. target model
2. related schema and service
3. Alembic history
4. affected tests
5. `docs/current/DOMAIN_MODEL.md`
6. generated code map

### Change team/workspace/rotation

1. `app/routers/dias.py` or `app/routers/eventos.py`
2. `app/services/estado_equipes.py`
3. `app/services/workspace_evento.py`
4. the capability module exposed by `app/modules/eventos/service.py`
5. workspace/rotation tests

### Change auth/users

1. `app/modules/auth/`
2. `app/routers/usuarios.py`
3. `app/models/usuario.py`
4. auth/user tests
5. platform rules

## Docs sync

After changing active models, routes, frontend services, or route contracts, run:

```bash
python3 scripts/docs/generate_code_map.py
```
