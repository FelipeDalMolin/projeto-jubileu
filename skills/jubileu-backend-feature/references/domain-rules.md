# Domain Rules

Load this reference when a change affects behavior, invariants, aggregate ownership, or domain language.

## Domain hierarchy

```text
Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas
```

## Current persistence model

Current active persistence is Evento-based:

- `Dia`: calendar root identified by `data_iso`.
- `Evento`: operational aggregate for `AULA`, `JOGO_LIVRE`, or `OUTRO`.
- `TimeEvento`: team inside an event.
- `JogadorEvento`: player snapshot inside an event.
- `EventoParticipante`: RSVP/check-in state for a base player.
- `Partida`: match between two event teams.
- `EstatisticaJogadorPartida`: per-player stats in a match.
- `Lance`: match action/event log.
- `TeamConfig` and `EventoEquipesEstado`: team composition state and versioned snapshots.
- `EventoRotacaoEstado` and `EventoRotacaoSorteio`: rotation queue and draw/audit state.

`AULA` is only an event type. Do not model it as a public resource.

## Invariants to preserve

- A child resource must belong to the parent day/event declared in the route.
- Event and match status gates matter.
- Team composition changes must keep snapshots and versions coherent.
- Match/stat changes can affect score totals, workspace KPIs, warnings, dashboards, and combined versions.
- Arrival/check-in ordering is meaningful when seeding matches.
- Authorization must be enforced in the backend.
- PostgreSQL is the production/dev database target; SQLite-only behavior is not enough for migration confidence.

## Existing behavior patterns

- Missing `Dia` can be auto-created in day-centric routes.
- `AULA` event creation requires `turma_id` and snapshots active turma players into `jogadores_evento`.
- `JOGO_LIVRE` rejects `turma_id`; RSVP/check-in uses `evento_participantes`.
- Team snapshot state is versioned through `TeamConfig`; only one active config should remain active.
- Workspace payload combines derived event, team, match, KPI, and warning state.
- Invalid transitions usually raise `HTTPException` with `400` or `409`; missing resources use `404`.

## REST guidance

- Prefer routes shaped like `/dias/{data_iso}/eventos/...` for resources owned by a day/event.
- Preserve existing flat `/api/eventos/{evento_id}/...` command routes when working in that family.
- Frontend data calls must use `/api/...`.
- Do not add `/aulas` or Aula-shaped public payloads.

## Edge cases to check

- Empty participant sets.
- Invalid parent-child relationships.
- Repeated commands and idempotency keys.
- Invalid enum/status transitions.
- Event finalization while a partida is in progress.
- Team version drift after local-state persistence.
- PostgreSQL enum/default/nullable behavior in migrations.

## Current drift watch

`docs/generated/code-map.md` currently exposes frontend calls to `/api/dias/{diaId}/equipes`.
Treat that as a legacy/uncertain surface until reconciled with backend routes.
