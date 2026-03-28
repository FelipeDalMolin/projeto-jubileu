# Codex Plan - Jubileu Backend Refactor Baseline v2

## Summary

This plan defines the execution baseline for the Jubileu backend refactor as an incremental, compatibility-first evolution of the current FastAPI application. The goals are to stabilize the backend, reduce structural risk, preserve runtime and security behavior, and move safely toward the target modular architecture without a rewrite.

The official execution order is fixed:

1. Slice 00 - Stabilization
2. Slice 01 - App Shell Modularization
3. Slice 02 - Domain Reorganization and Service Extraction
4. Slice 03 - API Standardization
5. Slice 04 - JWT Authentication and RBAC
6. Slice 05 - Linux / NGINX / Deployment Assets

## Platform and Domain Baseline

- Runtime topology is fixed: `Cloudflare -> NGINX -> FastAPI -> PostgreSQL`.
- NGINX is the only public HTTP entrypoint.
- FastAPI must not be exposed directly.
- PostgreSQL must not be exposed publicly.
- `/api` remains the backend gateway contract.
- Authentication and authorization must remain backend-enforced.
- No public registration flow is allowed.
- Canonical domain direction is: `Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`.
- `Evento` is the target business concept, but current persistence still centers on `Aula`.
- The transition must preserve legacy behavior while converging semantics gradually.

## Current vs Target Architecture

### Current architecture

- Backend is still organized mostly by technical layer: `routers/`, `models/`, `schemas/`, `services/`.
- `app/main.py` directly creates the FastAPI app, configures CORS, and registers routers manually.
- `app/database.py` concentrates environment loading, engine creation, session factory, and declarative base.
- `app/deps.py` depends on the legacy `SessionLocal` source.
- `app/deps_auth.py` uses legacy header-based auth.
- `app/models/dia_aula.py` is a mega-model file containing the main persistence entities and enums.
- Business logic is partially extracted into services, but routers still carry substantial orchestration and rule ownership.

### Target architecture

- Internal backend layout should converge to:
  - `app/core/` for config and security
  - `app/db/` for base and session infrastructure
  - `app/modules/` for feature/domain organization
- Target module set:
  - `auth`
  - `usuarios`
  - `jogadores`
  - `dias`
  - `eventos`
  - `partidas`
  - `estatisticas`
- Routers should become HTTP-only.
- Services should own reusable business rules.
- Models should remain the persistence layer.
- Schemas should define I/O contracts only.

## Slice Plan

### Slice 00 - Stabilization

- Add `/health`.
- Add smoke coverage for startup and critical routes.
- Create initial `docs/DOMAIN_MODEL.md` and `docs/ARCHITECTURE.md`.
- Validate Alembic viability on a clean database.
- Preserve current naming, auth behavior, and public route contracts except for `/health`.

### Slice 01 - App Shell Modularization

- Introduce `app/core/config.py`.
- Introduce `app/db/session.py`.
- Introduce `app/db/base.py`.
- Refactor `app/main.py` into a `create_app()` composition root.
- Update `deps.py` to use the new session source.
- Preserve all route contracts and existing behavior.
- Do not modularize business domains yet.
- Do not change auth behavior.

### Slice 02 - Domain Reorganization and Service Extraction

- Reduce responsibilities concentrated in `models/dia_aula.py`.
- Start extracting service logic from `routers/dias.py` and `routers/partidas.py`.
- Keep persistence names and existing tables unchanged.
- Preserve Workspace, snapshot, and version behavior.
- Add or update tests around extracted logic.
- Do not rename `Aula` to `Evento`.
- Do not change auth flow.

### Slice 03 - API Standardization

- Standardize backend routes under `/api`.
- Preserve legacy routes temporarily for compatibility.
- Document the compatibility decision clearly.
- Do not change payload shapes unless strictly necessary.
- Maintain frontend compatibility for one release cycle.
- Introduce canonical route direction without forcing immediate persistence rename.

### Slice 04 - JWT Authentication and RBAC

- Create `modules/auth` with models, schemas, service, routes, and deps.
- Introduce JWT login and current-user flow.
- Add RBAC enforcement helpers.
- Preserve a temporary legacy headers mode through settings.
- Keep backend authorization as the source of truth.
- Do not introduce public registration.
- Preserve invite/onboarding constraints.

### Slice 05 - Linux / NGINX / Deployment Assets

- Add Linux deployment documentation.
- Add NGINX reverse proxy examples for frontend and `/api`.
- Add a systemd service example for the API.
- Add HTTPS / Certbot checklist and operational notes.
- Keep NGINX as the only public entrypoint.
- Avoid application behavior changes except what is strictly needed for health/config support.

## Public Interfaces and Compatibility Rules

- `/api` must remain the infrastructure gateway prefix.
- Canonical REST direction should converge toward `/dias/{data_iso}/eventos/...`.
- Legacy route structures may remain temporarily where compatibility is required.
- Current persistence names may coexist with canonical domain naming during migration.
- Any meaningful rename or convergence step must include:
  - migration planning
  - compatibility note
  - test updates
  - technical explanation
- Workspace payload behavior and snapshot/version semantics must remain stable until explicitly changed by a dedicated slice.

## Frontend Compatibility Rule

- Frontend must remain compatible during refactor unless a breaking change is explicitly planned.
- Backend contracts must be preserved unless versioned or bridged.
- Any breaking change requires:
  - compatibility layer
  - migration note
  - rollout note

## Risks

- Highest operational risk is Alembic/schema drift versus current models.
- `models/dia_aula.py` remains a regression hotspot until split.
- `JogadorAula` and `EventoParticipante` have overlapping participation semantics and must not be converged casually.
- Workspace derivation, `TeamConfig` versioning, and combined version logic are compatibility-critical.
- Auth/user changes are high-risk and must stay isolated to Slice 04.
- API route normalization can regress the frontend if aliases and transitional paths are not preserved.

## Protected Domain Surfaces

The following behaviors must remain stable until explicitly refactored:

- Workspace aggregation logic
- TeamConfig versioning
- Combined version logic
- KPI and warning derivation
- RSVP -> check-in transition flow
- `checked_at` / arrival ordering
- Match lifecycle transitions

## Test Plan

- Slice 00 must establish startup and critical-route smoke coverage.
- Each slice must add or update tests only for the touched behavior.
- Validation must cover:
  - route contract preservation
  - domain ownership and status transitions
  - SQLAlchemy/Alembic alignment
  - duplicate business-rule avoidance
  - auth/platform constraint preservation when applicable
  - edge cases explicitly touched by the slice
- PostgreSQL production behavior must be considered even when tests use SQLite.

## Migration Rule

Any schema-affecting change must:

- Be implemented through Alembic migration
- Be validated on a clean database
- Include rollback awareness
- Include compatibility notes
- Consider PostgreSQL production behavior even when SQLite tests pass

## Release and Delivery Model

- Use SemVer for formal releases.
- During refactor, use internal milestone tags:
  - `v0.2.0-dev.0` through `v0.2.0-dev.5`
- Maintain `docs/RELEASES.md`.
- Linear execution should map one core issue per slice under a single backend refactor epic.
- Every slice delivery should include:
  - domain and contract summary
  - implementation summary
  - compatibility and risk note
  - validation checklist

## Assumptions and Non-Negotiables

- This is a refactor plan, not a rewrite plan.
- Codex must implement one slice at a time.
- Codex must not perform the full refactor in one step.
- Codex must not rename domain concepts prematurely.
- Codex must not change auth before Slice 04.
- Codex must not break `/api`, NGINX gateway assumptions, Workspace behavior, or backend-enforced authorization.
- Legacy persistence naming may remain temporarily, but only as an explicit compatibility choice with documented follow-up.
