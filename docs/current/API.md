# Jubileu API Contracts

## Purpose

This document summarizes the public contracts used by the current MVP.

## Gateway Rule

`/api` is the backend gateway prefix for canonical infrastructure-facing routes. NGINX remains the production entrypoint and PostgreSQL must not be exposed publicly.

## Compatibility Model

Current state:

- `Evento` is the canonical persisted entity.
- `AULA` is only an `Evento.tipo` value, not a public entity.
- Public routes, payload fields and frontend routes based on `Aula` were removed as a deliberate breaking change.
- Historical Alembic migrations may still mention old names because they document past schema steps.

## Dia and Evento

Active surfaces:

- `GET /dias`
- `GET /dias/{data_iso}`
- `POST /dias/{data_iso}/eventos`
- `GET /dias/{data_iso}/eventos/{evento_id}`
- `DELETE /dias/{data_iso}/eventos/{evento_id}`
- `GET /dias/{data_iso}/eventos/{evento_id}/workspace`
- `GET /dias/{data_iso}/eventos/{evento_id}/estado`
- `GET /dias/{data_iso}/eventos/{evento_id}/estado-equipes`
- `PUT /dias/{data_iso}/eventos/{evento_id}/estado-equipes`

`GET /dias` e `/api/dias` retornam dias com a lista de eventos carregada para alimentar
o calendario operacional. A tela `/dias` nao deve depender de chamadas por dia para
descobrir eventos ja cadastrados.

Canonical event fields:

- `id`
- `dia_id`
- `turma_id`
- `turma_nome`
- `numero_evento_na_turma`
- `tipo`: `AULA`, `JOGO_LIVRE`, `OUTRO`
- `status`: `PLANEJADO`, `EM_ANDAMENTO`, `ENCERRADO`, `CANCELADO`
- `horario_inicio`
- `horario_fim`

## Event Operations

Active canonical surfaces:

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
- `PATCH /api/eventos/{evento_id}/rotacao/estado`
- `POST /api/eventos/{evento_id}/rotacao/preview-sorteio`
- `POST /api/eventos/{evento_id}/rotacao/confirmar-sorteio`

Operational notes:

- `JOGO_LIVRE` uses canonical participants for RSVP, check-in, arrival order, seed and lances.
- Self actions require authenticated user with `jogador_id`.
- Manual check-in, seed and event lifecycle actions require an administrative role.
- Authorization stays server-side; frontend capability checks are only UI affordances.

## Partidas and Lances

Active surfaces:

- `GET /api/dias/{data_iso}/eventos/{evento_id}/partidas`
- `POST /api/dias/{data_iso}/eventos/{evento_id}/partidas`
- `PUT /api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}`
- `DELETE /api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}`
- `PUT /api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start`
- `PUT /api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end`
- `POST /api/partidas/{partida_id}/lances`
- `GET /api/eventos/{evento_id}/lances?partida_id={partida_id}&since={iso_datetime}&limit={n}`

Lifecycle contract:

- partida start is `PLANEJADA -> EM_ANDAMENTO`.
- partida end is `EM_ANDAMENTO -> ENCERRADA`.
- invalid transitions return `409`.
- event finalization is blocked while a partida is `EM_ANDAMENTO`.
- lances are accepted only when both event and partida are `EM_ANDAMENTO`.
- frontend live state is derived only from partida `EM_ANDAMENTO`.

## Auth and Usuario

Active surfaces:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/usuarios/me`
- `PUT /api/usuarios/me/jogador`

`GET /api/auth/me` returns the persisted user identity, role and optional `jogador_id`.

`GET /api/usuarios/me` returns:

- essential user profile
- linked jogador summary
- events in which the linked jogador participated or appeared in the event snapshot

`PUT /api/usuarios/me/jogador` persists the current user's linked player with
`{"jogador_id": number | null}`. It returns the updated `/api/usuarios/me`
payload, is idempotent for the same `jogador_id`, and returns `404` when the
target player does not exist.

Legacy header-based auth may remain for local compatibility, but persisted users are the canonical session source.

## Frontend Routes

Canonical contextual route:

- `/dias/:dataIso/eventos/:eventoId`

Removed route:

- `/dias/:dataIso/aulas/:aulaId`

Pure event deep-linking such as `/eventos/:eventoId` is not canonical until backend resolution by event ID is explicit and documented.

## Migration Rule

Any schema-affecting API change must:

- be implemented through Alembic migration
- be validated on a clean database
- preserve existing data when upgrading
- include rollback awareness
- consider PostgreSQL behavior even when SQLite tests pass
