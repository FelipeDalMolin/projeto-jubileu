# ARCHITECTURE (Slice 00 Baseline)

## Runtime topology

Official deployment shape:

`Cloudflare -> NGINX -> FastAPI -> PostgreSQL`

Non-negotiable platform constraints:

- NGINX is the only public entrypoint.
- FastAPI is not publicly exposed.
- PostgreSQL is not publicly exposed.
- `/api` remains the gateway model for backend exposure.

## Current backend architecture

Current backend organization is still mostly layer-by-type:

- `app/routers/`
- `app/models/`
- `app/schemas/`
- `app/services/`

Entry and infra details:

- `app/main.py` creates the FastAPI app and includes routers directly.
- `app/database.py` currently owns env loading, engine, session factory, and base.
- `app/deps_auth.py` still uses header-based auth mode in this phase.

## Target architecture direction

Refactor target (incremental, compatibility-first):

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
    usuarios/
    jogadores/
    dias/
    eventos/
    partidas/
    estatisticas/
```

Execution order is fixed by baseline:

1. Slice 00 - Stabilization
2. Slice 01 - App Shell Modularization
3. Slice 02 - Domain Reorganization and Service Extraction
4. Slice 03 - API Standardization
5. Slice 04 - JWT + RBAC
6. Slice 05 - Linux/NGINX deployment assets

## Compatibility commitments for Slice 00

- Persistence naming remains unchanged (`Aula` is still persisted).
- Auth flow remains unchanged (header-based behavior preserved).
- Existing public route contracts remain unchanged, except `/health` addition.
- Business payload semantics remain unchanged.

## Alembic viability check (clean database)

Validation executed on 2026-03-22 against a clean PostgreSQL instance:

- Command: `alembic upgrade head`
- Result: success up to head `0011_evento_participantes_lances`

## Migration drift risk note

Even with successful clean upgrade, migration risk remains non-trivial:

- Migration history has multi-branch merge points (for example, `0003_*` branches merged later), which increases operational complexity in existing environments.
- Several migrations are corrective/idempotent alignment steps, indicating historical model/schema drift pressure.
- SQLite test coverage does not fully validate PostgreSQL behavior for enums, defaults, transactional DDL nuances, and conditional DDL logic.
- Production upgrades require staged validation with PostgreSQL data snapshots and rollback-aware runbooks.

## Remaining legacy hotspots

- `app/models/dia_aula.py` as a concentration point for multiple aggregates.
- Router-heavy domain logic in day and match flows.
- Transitional overlap between `JogadorAula` and `EventoParticipante` semantics.
