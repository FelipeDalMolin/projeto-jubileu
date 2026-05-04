# Execution Plan Roadmap

## Summary

This roadmap consolidates the two latest technical investigations into an executable, compatibility-first refactor plan.

The plan does not introduce a fourth track. Work is organized under:

- Backend
- Frontend
- Infra

The current persistence model remains Aula-centered while the product language and UI continue converging toward Evento as the operational unit.

## Current Architecture Reading

- Backend is FastAPI with PostgreSQL, Alembic, modular auth, `/api` aliases, and a compatibility bridge around legacy database/session imports.
- Frontend is React/Vite/TypeScript with canonical event routes already present and legacy Aula routes preserved.
- WorkspaceAula remains the primary read-model for the operational screen.
- Evento APIs already exist for status actions, participants, presentes, RSVP/check-in, seed and lances, but UI usage is still partial.
- Infra documentation exists, but runtime/deploy artifacts are not yet consolidated into a single operational track.

## Priority Risks

- Drift between code, docs, Linear issues and actual frontend behavior.
- Drift between canonical Evento semantics and Aula persistence/read-model.
- Polling loops and auth fallback ambiguity in event screens.
- TeamConfig/versioning and workspace aggregation regressions.
- SQLite tests not fully covering PostgreSQL/Alembic production behavior.
- Legacy UI and canonical UI competing instead of being separated by adapters.

## Execution Order

1. Docs and roadmap consolidation.
2. Backend event API contract hardening.
3. Frontend event contract alignment.
4. WorkspaceEvento adapter over WorkspaceAula.
5. RSVP/check-in self actions.
6. Polling/live stability and auth error handling.
7. User/Jogador operational session.
8. Infra runtime, gateway and deploy MVP hardening.

## Current Delivery Window

The immediate window follows DEV-28 through DEV-33:

1. `DEV-28` AULA live semantics fix.
2. `DEV-29` explicit match lifecycle (`start`/`end`) + alias validation.
3. `DEV-30` AULA lances v2 gating and timeline behavior.
4. `DEV-31` JOGO_LIVRE end-to-end operational flow.
5. `DEV-32` polling/auth channel hardening.
6. `DEV-33` contract/tests/release documentation closure.

## Non-Negotiables

- Do not rename `Aula`, `JogadorAula`, or `EventoParticipante` casually.
- Do not remove legacy routes during compatibility windows.
- Do not change payload shapes without compatibility notes.
- Do not bypass `/api`, NGINX, backend RBAC or backend authorization.
- Do not expose FastAPI or PostgreSQL directly in production topology.
- Do not break Workspace aggregation, TeamConfig versioning, combined version logic, KPI/warning derivation, RSVP/check-in, arrival ordering or match lifecycle transitions.

## Product Documentation Dependencies

- `docs/API.md` defines public contracts.
- `docs/ROADMAP.md` defines delivery order.
- `docs/RELEASES.md` defines milestone tagging.
- `docs/DECISIONS.md` indexes CORE decisions.

## Validation Standard

Every implementation slice must report:

- files changed
- route contract preservation
- frontend compatibility impact
- auth/authorization impact
- Alembic or PostgreSQL risk
- validation commands executed
- remaining legacy hotspots
