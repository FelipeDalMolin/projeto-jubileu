# Domain Rules

Load this reference when the change affects behavior, invariants, or aggregate ownership.

## Domain hierarchy

Treat the business chain as:

`Jogadores -> Dias -> Evento/Aula -> Times -> Partidas -> Estatisticas`

## Current persistence model

Current persistence maps the event concept mainly onto `Aula`, with supporting entities:

- `Dia`: calendar root identified by `data_iso`
- `Aula`: current persisted event aggregate for a day and turma
- `TimeAula`: team snapshot inside the event
- `JogadorAula`: player snapshot and attendance/state inside the event
- `Partida`: match between two teams inside the event
- `EstatisticaJogadorPartida`: per-player stats in a match
- `EventoParticipante`: RSVP/check-in state
- `Lance`: append-only event log for match actions

## Canonical domain direction

The long-term canonical direction of the project is:

`Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`

This means:
- `Aula` is the current persisted aggregate
- `Evento` is the intended canonical concept
- `JogadorAula` and `EventoParticipante` are candidates for convergence analysis into a canonical participation model
- legacy persistence and canonical business naming may coexist temporarily during migration

## Invariants to preserve

- A child resource must always belong to the parent day/event declared in the route.
- Presence and event status gates matter. Many commands are valid only in `PLANEJADA` or `EM_ANDAMENTO`.
- Completed events such as `CONCLUIDA` are not editable through normal command flows.
- Team composition changes must keep snapshots and versions coherent.
- Match/stat changes can affect aggregated scores, workspace KPIs, warnings, and combined versions.
- Arrival/check-in ordering is meaningful when seeding matches.
- Authorization must be enforced in the backend, not just in UI.

## Existing behavioral patterns

- Missing `Dia` is sometimes auto-created in day-centric routes.
- Day-centric routes validate ownership by checking both `aula_id` and `dia_id`.
- Team snapshot state is versioned through `TeamConfig`; only one active config should remain active.
- Workspace payload combines team snapshot version with a CRC-based match version.
- Invalid transitions usually raise `HTTPException` with `400` or `409`; missing resources use `404`.

## REST guidance for this project

- Prefer routes shaped like `/dias/{data_iso}/eventos/...`.
- If the underlying code still uses `aulas` in storage or route names, keep the persistence naming stable unless the task explicitly includes a rename.
- When introducing a new nested resource, decide who owns it first:
  - If it is scoped to a day and event, nest it under the day/event route.
  - If it is an operational command on a match, ensure the match still resolves back to its owning event/day.

## Duplication avoidance

- Router code should orchestrate request parsing, ownership checks, dependency injection, and HTTP response mapping.
- Shared business rules should live in services or helpers.
- Derived values such as score totals, warnings, and workspace state should be computed in one place and reused.

## Edge cases to check

- Empty participant sets
- Invalid parent-child relationships
- Repeated commands with idempotency concerns
- Enum/status transitions
- Compatibility between SQLite tests and PostgreSQL production semantics
- Migration behavior for non-null columns, defaults, and existing rows
- Mixed legacy/canonical naming during incremental refactor

## Evolution note

Do not assume the current persistence model is the final domain model.  
If the task is a structural refactor, read `refactor-rules.md` and `target-architecture.md` and prefer forward-compatible changes.