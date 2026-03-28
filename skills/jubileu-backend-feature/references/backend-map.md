# Backend Map

Use this file to orient yourself quickly before editing.

## Stack

- API: FastAPI in `backend/jubileu-api-fastapi/app/main.py`
- ORM: SQLAlchemy models in `backend/jubileu-api-fastapi/app/models/`
- Migrations: Alembic in `backend/jubileu-api-fastapi/alembic/`
- Tests: pytest + FastAPI TestClient in `backend/jubileu-api-fastapi/tests/`

## Current backend shape

The current backend is still organized mostly by technical layer and legacy domain naming:
- routers under `app/routers/`
- models under `app/models/`
- schemas under `app/schemas/`
- services under `app/services/`

The project is not yet fully reorganized into the target modular layout.

## Primary files

- `backend/jubileu-api-fastapi/app/main.py`
  Registers routers for `dias`, `eventos`, `partidas`, `jogadores`, `turmas`, auth-related flows, and dashboards.

- `backend/jubileu-api-fastapi/app/routers/dias.py`
  Main nested day workflow. Contains routes under `/dias/{data_iso}/aulas/...` and workspace/state endpoints.

- `backend/jubileu-api-fastapi/app/routers/eventos.py`
  Legacy or parallel event-oriented API under `/api/eventos/...` and `/api/partidas/...`.

- `backend/jubileu-api-fastapi/app/models/dia_aula.py`
  Core aggregate definitions around the current event persistence model:
  `Dia`, `Aula`, `TimeAula`, `JogadorAula`, `Partida`, `EstatisticaJogadorPartida`, `EventoParticipante`, and `Lance`.

- `backend/jubileu-api-fastapi/app/services/estado_equipes.py`
  Team snapshot rebuilding and active `TeamConfig` version management.

- `backend/jubileu-api-fastapi/app/services/workspace_aula.py`
  Derived workspace payload, KPI calculation, warnings, and combined version logic.

- `backend/jubileu-api-fastapi/alembic/env.py`
  Alembic entrypoint and metadata integration for migrations.

## Test entry points

- `backend/jubileu-api-fastapi/tests/conftest.py`
  In-memory SQLite fixture and dependency override for FastAPI tests.

- `backend/jubileu-api-fastapi/tests/test_eventos_api.py`
  Event flow coverage for RSVP, check-in, seeding, and lance creation.

- `backend/jubileu-api-fastapi/tests/test_workspace_aula.py`
  Workspace versioning, warnings, and KPI coverage.

- `backend/jubileu-api-fastapi/tests/test_mvp_flow.py`
  Cross-feature flow coverage.

## Reading order by task

### Add a new endpoint
Read:
1. `main.py`
2. target router
3. related schema
4. related service or helper
5. target tests

### Change persistence
Read:
1. target model
2. related schemas
3. migration history in `alembic/versions/`
4. affected tests
5. any service that derives state from that model

### Change team or workspace behavior
Read:
1. `routers/dias.py`
2. `services/estado_equipes.py`
3. `services/workspace_aula.py`
4. workspace/version tests

### Change auth or users
Read:
1. auth-related routes and dependencies
2. security/config code
3. user model/schema paths
4. auth tests
5. platform rules before changing behavior

## Important note

This file describes the current backend, not the target architecture.  
When the task involves refactor or convergence toward the desired structure, also read:
- `target-architecture.md`
- `refactor-rules.md`
- `platform-rules.md`