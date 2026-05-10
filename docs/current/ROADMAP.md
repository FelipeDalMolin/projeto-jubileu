# Jubileu Roadmap

## Direction

Jubileu now uses `Evento` as the canonical operational entity:

`Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`

`AULA` remains only as an event mode (`Evento.tipo = AULA`). New work must not introduce public models, routes or payload fields based on an Aula entity.

## Current Milestone

The active milestone is the canonical Evento cut:

- persisted tables and FKs use event naming
- APIs expose `/eventos` surfaces only
- frontend routes, services and workspace types use Evento
- `/usuario` shows persisted profile, linked jogador and participated events
- Dashboard, Jogadores, Turmas and session surfaces are kept operational and scan-friendly

## Execution Tracks

### Backend

Focus:

- canonical Evento models and Alembic migration
- persisted Usuario entity
- `auth/me` backed by persisted users
- `usuarios/me` profile and event history endpoint
- event-only tests for workspace, lifecycle, lances, rotation and user profile

### Frontend

Focus:

- event-only routes and services
- WorkspaceEvento without adapter indirection
- Usuario page with profile and event history
- Dashboard home using backend data instead of mocks
- Jogadores status values aligned with backend

### Infra

Focus:

- PostgreSQL migration validation
- release notes for breaking route changes
- local smoke for login, Usuario, AULA-mode event and JOGO_LIVRE

## Current Closure Window

| DEV | Status | Notes |
|---|---|---|
| DEV-33 | Completed in repo | API, roadmap, releases and validation docs updated for canonical Evento. |
| Proposed DEV-37 / Linear DEV-34 | Implemented in repo | Evento canonical migration decision and checklist. |
| Proposed DEV-38 / Linear DEV-35 | Implemented in repo | Alembic migration renames persistence to Evento and adds Usuario. |
| Proposed DEV-39 / Linear DEV-36 | Implemented in repo | Backend APIs and auth use Evento/Usuario contracts. |
| Proposed DEV-40 / Linear DEV-37 | Implemented in repo | Frontend removed Aula route/types/services and uses Evento-only workspace. |
| Proposed DEV-41 / Linear DEV-38 | Implemented in repo | Persisted Usuario and `/api/usuarios/me`. |
| Proposed DEV-42 / Linear DEV-39 | Implemented in repo | `/usuario` profile and participated events. |
| Proposed DEV-43 / Linear DEV-40 | Partially implemented | Dashboard home now reads backend data; Jogadores status options aligned. |
| Proposed DEV-44 / Linear DEV-41 | In progress | Final migration smoke and release validation. |

## Compatibility Rules

- Keep `/api` gateway assumptions.
- Keep backend authorization as source of truth.
- Do not reintroduce `/aulas`, `aulaId`, `aula_id` or `WorkspaceAula`.
- Historical migrations may retain old names; active models and public contracts must not.
- `OUTRO` remains modeling-prep unless a dedicated operational flow is added.

## Deferred Work

- Pure `/eventos/:eventoId` deep-link without Dia context.
- WebSocket/MQTT real-time flow.
- Removal of legacy header auth compatibility.
- Full visual redesign of Turmas and Turma detail beyond the current operational cleanup.
