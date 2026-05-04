# Jubileu Releases

## Purpose

This document tracks refactor milestones and delivery notes.

## Versioning

Use SemVer for formal releases:

- MAJOR: breaking changes
- MINOR: compatible feature milestones
- PATCH: fixes

During refactor execution, use internal milestone tags when useful:

- `v0.2.0-dev.backend-06`
- `v0.2.0-dev.backend-07`
- `v0.2.0-dev.backend-08`
- `v0.2.0-dev.frontend-08`
- `v0.2.0-dev.frontend-09`
- `v0.2.0-dev.frontend-10`
- `v0.2.0-dev.frontend-11`
- `v0.2.0-dev.frontend-12`
- `v0.2.0-dev.infra-00`
- `v0.2.0-dev.frontend-13` (DEV-28/DEV-30 stream)
- `v0.2.0-dev.backend-09` (DEV-29 stream)
- `v0.2.0-dev.frontend-14` (DEV-31 stream)
- `v0.2.0-dev.frontend-15` (DEV-32 stream)
- `v0.2.0-dev.docs-33` (DEV-33 closure)

## Release Checklist

Every slice delivery should include:

- domain and contract summary
- implementation summary
- compatibility note
- migration/Alembic note when applicable
- PostgreSQL risk note
- validation commands
- linked Linear issue

## Current Planned Milestones

| Milestone | Scope | Expected outcome |
|---|---|---|
| Docs consolidation | refactors/docs | execution index, roadmap, API, decisions and Linear map |
| Backend contracts | Backend 06-08 | event API, read-model and auth/session hardening plan |
| Frontend Evento | Frontend 08-12 | event UI behavior, adapter, polling and session plan |
| Infra MVP | Infra 00-03 | runtime, gateway and deploy documentation |

## Compatibility Windows

Legacy routes and compatibility adapters remain until:

- replacement contract is documented
- frontend migration is complete
- tests cover old and new paths
- rollout note is written
