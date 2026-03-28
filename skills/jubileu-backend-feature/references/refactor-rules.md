
# Refactor Rules

Use this file when the task affects domain migration, structural refactor, module extraction, naming convergence, or transition from the legacy model toward the target model.

## Refactor goal

The backend should evolve safely from the current persistence-centered domain toward the canonical domain model:

`Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`

## Legacy to target convergence

### Current legacy concepts
- `Aula`
- `TimeAula`
- `JogadorAula`
- `EventoParticipante`

### Target canonical concepts
- `Evento`
- `TimeEvento`
- `ParticipacaoEvento`

## Core rules

- Do not perform blind renames.
- Do not replace legacy concepts everywhere in one uncontrolled step.
- Use controlled coexistence when needed.
- Every meaningful rename or convergence step must include:
  - migration planning
  - compatibility note
  - test updates
  - technical explanation

## Coexistence strategy

It is acceptable to:
- preserve current persistence naming temporarily
- introduce service-level canonical naming first
- add compatibility bridges before removing legacy structures

It is not acceptable to:
- deepen legacy semantics without explicit reason
- duplicate rule ownership between old and new paths
- silently diverge the API contract from the domain model

## Structural extraction rules

When refactor mode is active:
- move shared rule logic out of routers into services
- move new domain work toward `app/modules/`
- place config/security into `app/core/`
- place session/base infrastructure into `app/db/`

## Compatibility rules

If current routes, schemas, or DB naming must remain temporarily:
- keep them intentionally
- document the compatibility choice
- identify the follow-up cleanup step

## Migration rules

Any DB-affecting refactor must consider:
- Alembic revision strategy
- existing rows and defaults
- enum compatibility
- nullable-to-non-null transitions
- rollback awareness
- production PostgreSQL behavior even when tests use SQLite

## Delivery expectation for refactor work

Refactor tasks should explicitly state:
- what legacy concept exists today
- what target concept is desired
- what was changed now
- what remains for the next step