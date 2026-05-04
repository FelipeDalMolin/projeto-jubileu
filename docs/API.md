# Jubileu API Contracts

## Purpose

This document summarizes public API contracts relevant to the refactor roadmap.

It is not a full OpenAPI replacement. It is the compatibility contract used by refactor slices.

## Gateway Rule

`/api` is the backend gateway prefix for canonical and infrastructure-facing routes.

Rules:

- NGINX remains the public entrypoint in production.
- FastAPI must not be exposed directly in production.
- PostgreSQL must not be exposed publicly.
- Frontend changes must preserve existing backend contracts unless a compatibility bridge or versioned change exists.

## Compatibility Model

Current state:

- Legacy routes still exist for Aula-centered flows.
- Canonical Evento routes are being introduced and consumed incrementally.
- Persistence naming remains Aula-centered.
- UI language should converge to Evento through adapters, not destructive renames.

## Route Surfaces

### Dias and Aulas

Legacy and active surfaces include:

- `GET /dias`
- `GET /dias/{data_iso}`
- `POST /dias/{data_iso}/aulas`
- `DELETE /dias/{data_iso}/aulas/{aula_id}`
- `GET /dias/{data_iso}/aulas/{aula_id}/workspace`

These remain compatibility-critical because WorkspaceAula still feeds the operational UI.

### Evento

Canonical event direction:

- `GET /api/eventos/{evento_id}/participants`
- `GET /api/eventos/{evento_id}/presentes`
- `POST /api/eventos/{evento_id}/rsvp`
- `DELETE /api/eventos/{evento_id}/rsvp`
- `POST /api/eventos/{evento_id}/checkin`
- `DELETE /api/eventos/{evento_id}/checkin`
- `POST /api/eventos/{evento_id}/start`
- `POST /api/eventos/{evento_id}/end`
- `POST /api/eventos/{evento_id}/cancel`
- `POST /api/eventos/{evento_id}/partidas/seed`
- `GET /api/eventos/{evento_id}/lances`
- `GET /api/eventos/{evento_id}/rotacao/estado`
- `POST /api/eventos/{evento_id}/rotacao/preview-sorteio`
- `POST /api/eventos/{evento_id}/rotacao/confirmar-sorteio`

Any missing or inconsistent implementation must be handled by a backend hardening slice before the frontend relies on it as a stable contract.

Rotation contract notes:

- `team_size_ref` is an operational reference, never a hard blocker.
- Preview and confirm are token-based to keep manual draw auditable.
- Confirm applies exactly the previewed result; no recalculate on confirm.
- Queue and next-team groups allow incomplete or unbalanced compositions.

### Partidas and Lances

Current match/lance surfaces include:

- `POST /api/partidas/{partida_id}/lances`
- `PUT /api/dias/{data_iso}/aulas/{aula_id}/partidas/{partida_id}/start`
- `PUT /api/dias/{data_iso}/aulas/{aula_id}/partidas/{partida_id}/end`
- legacy Aula match routes under `/dias/{data_iso}/aulas/{aula_id}/partidas`

Timeline reads should use canonical event routes where available, while legacy mutation surfaces may coexist during transition.

### Auth

Canonical auth direction:

- `POST /api/auth/login`
- `GET /api/auth/me`

Temporary compatibility:

- legacy header-based auth may remain during migration
- frontend must not silently mask expired or invalid JWT failures in production-sensitive flows

## Frontend Route Compatibility

Canonical contextual route:

- `/dias/:dataIso/eventos/:eventoId`

Legacy route preserved:

- `/dias/:dataIso/aulas/:aulaId`

Pure event deep-linking such as `/eventos/:eventoId` should not be treated as canonical until backend resolution by event ID is explicit and documented.

## Protected Domain Surfaces

The following behaviors must remain stable until explicitly refactored:

- Workspace aggregation logic
- TeamConfig versioning
- Combined version logic
- KPI and warning derivation
- RSVP to check-in transition flow
- `checked_at` and arrival ordering
- Match lifecycle transitions

## Migration Rule

Any schema-affecting API change must:

- be implemented through Alembic migration
- be validated on a clean database
- include rollback awareness
- include compatibility notes
- consider PostgreSQL behavior even when SQLite tests pass
