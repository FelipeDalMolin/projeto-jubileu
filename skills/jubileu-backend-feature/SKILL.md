---
name: jubileu-backend-feature
description: Implement or evolve backend features for the Jubileu sports event management system (FastAPI + SQLAlchemy + Alembic + PostgreSQL). Use when Codex needs to analyze, refactor, or extend backend behavior, especially for flows centered on Dia -> Eventos -> Times -> Partidas -> Estatisticas, authentication, users, and domain migration from the current Aula-based persistence toward the target Evento-based architecture.
---

# Jubileu Backend Feature

Implement backend changes by preserving Jubileu's domain hierarchy, REST conventions, migration discipline, and platform constraints. Keep the output actionable: ready code, a short technical description, and a validation checklist.

Read only the references needed for the current task:

- Read [`references/backend-map.md`](./references/backend-map.md) at the start to locate routers, models, services, Alembic, tests, and the current backend structure.
- Read [`references/domain-rules.md`](./references/domain-rules.md) before changing behavior that touches Dia, Aula/Evento, Times, Partidas, presence, statistics, or aggregate invariants.
- Read [`references/target-architecture.md`](./references/target-architecture.md) when the task affects project structure, service boundaries, module organization, or backend layering.
- Read [`references/refactor-rules.md`](./references/refactor-rules.md) when the task affects domain migration, legacy-to-target convergence, renames, coexistence strategy, or large refactors.
- Read [`references/platform-rules.md`](./references/platform-rules.md) when the task affects authentication, users, routing, deployment, infra, public exposure, or API security constraints.
- Read [`references/delivery.md`](./references/delivery.md) when the user also wants Linear updates, GitHub PR structure, technical delivery notes, or validation reporting.

## Operating Modes

### Maintenance Mode
Use this mode when the task is a focused backend change inside the current project structure.
- Preserve existing domain semantics unless explicitly asked to change them.
- Prefer the smallest coherent change set.
- Maintain compatibility with the current persistence model.

### Refactor Mode
Use this mode when the task affects architecture, folder layout, service extraction, aggregate ownership, or the migration path from Aula to Evento.
- Prioritize the target architecture over the current folder layout.
- Preserve backward compatibility only when explicitly needed.
- Avoid deepening legacy naming unless the task is purely maintenance.
- Prefer incremental convergence with controlled coexistence between legacy and target concepts.
- Never perform blind renames without migration strategy, compatibility notes, and tests.

## Workflow

1. Read the current code path end to end before proposing changes.
2. Identify the domain impact explicitly:
   - which entity owns the rule
   - which transitions are allowed
   - which aggregates must remain consistent
3. Determine whether the task is Maintenance Mode or Refactor Mode.
4. Suggest the smallest coherent change set across:
   - router
   - schema
   - service
   - model
   - migration
   - tests
5. Generate code in the project style unless the task explicitly requires structural refactor.
6. Validate edge cases, domain invariants, migration safety, and platform constraints before closing.

## Implementation Rules

### REST and routing
- Prefer nested resources rooted in the day: `/dias/{data_iso}/eventos`.
- Keep new operations consistent with the route family already handling the owning aggregate.
- If a legacy flat route such as `/api/eventos/...` must remain for compatibility, preserve behavior intentionally and document the compatibility choice in the technical description.
- Reject route additions that leak internal persistence details into the API contract.
- Keep all backend HTTP endpoints under `/api` or within the existing backend routing conventions.

### SQLAlchemy and Alembic
- Update SQLAlchemy models and Pydantic schemas together when persistence changes.
- Use Alembic for every schema change; do not rely on `Base.metadata.create_all` as the delivery mechanism.
- Keep migrations deterministic, safe, and aligned with existing revision naming.
- Review enum changes carefully because they affect ORM mapping, persisted values, and tests.
- If the task changes persistence without changing the API contract, still review serializers, derived state, workspace outputs, and polling payloads.

### Domain consistency
- Preserve or intentionally evolve the hierarchy `Jogadores -> Dias -> Evento/Aula -> Times -> Partidas -> Estatisticas`.
- Treat `Aula` as the current persisted event aggregate unless the task explicitly includes migration toward the canonical `Evento`.
- Keep status transitions explicit and validated. Reject invalid transitions with the existing HTTP error style.
- Rebuild or refresh derived state when commands affect team composition, snapshots, workspace/version payloads, warnings, or score aggregation.
- Prevent duplication of business rules between routers and services; move shared logic into service/helper code when multiple endpoints need it.

### Refactor-specific rules
- Structural changes must follow the target backend architecture defined in `target-architecture.md`.
- New backend domains should prefer `modules/<domain>/models.py`, `schemas.py`, `service.py`, and `routes.py`.
- Shared config/security belongs in `app/core/`.
- Shared database infrastructure belongs in `app/db/`.
- Legacy naming may coexist temporarily, but new logic should move toward the target canonical domain model.
- Every significant refactor must include a migration path, compatibility note, and rollback awareness.

### Authentication, users, and platform constraints
- Do not alter JWT strategy, refresh flow, invite flow, or RBAC unless explicitly requested.
- Do not introduce public registration.
- Do not move critical auth or authorization logic to the frontend.
- Do not expose FastAPI publicly outside the intended NGINX `/api` gateway model.
- Respect the hosting and security constraints in `platform-rules.md`.

### Testing and edge cases
- Add or update focused backend tests for every behavior change.
- Prefer API tests for contract changes and service/unit-style tests for domain calculations.
- Cover at least:
  - not found
  - invalid status transition
  - empty/precondition failure
  - ownership mismatch
  - idempotency concerns when applicable
  - versioning or aggregate consistency where applicable
- Reuse the in-memory SQLite test harness only when it matches the behavior under test; call out PostgreSQL-specific risks when SQLite cannot validate them.

## Change Planning Heuristics

- Start from the owning aggregate and work outward:
  `models -> schemas -> services -> routers -> tests -> migration`
- If the request changes payload shape without changing persistence, skip Alembic.
- If the request changes persistence, review migration strategy, naming compatibility, and derived outputs.
- If the request touches `TeamConfig`, `WorkspaceAula`, presence, seeding, or match scoring, inspect version calculation and warnings side effects.
- If the request touches authentication, users, or invite flow, review RBAC, token lifecycle, and backend-only enforcement.

## Expected Output

End with these three deliverables unless the user asks for something narrower:

- Ready code in the workspace.
- A short technical description covering:
  - domain impact
  - files changed
  - compatibility and migration decisions
- A validation checklist with executed checks and remaining risks.

## Linear and GitHub

- Use Linear tools when the user asks to create, update, or sync delivery tracking.
- Keep issue text tied to:
  - domain change
  - affected aggregates
  - routes
  - migration impact
  - validation plan
- Use GitHub tools when the user asks for PR work.
- Keep the PR structured with:
  - context
  - implementation summary
  - migration/testing notes
  - rollout and compatibility notes
- Do not create tracking artifacts by default.

## Guardrails

- Do not duplicate logic already present in shared backend services/helpers.
- Do not introduce a second route style for the same resource without an explicit compatibility reason.
- Do not change domain semantics silently; mention semantic changes in the technical description.
- Do not finish after code generation alone; validate edge cases and list anything not executed.
- Do not use refactor mode as an excuse for uncontrolled rewrites.