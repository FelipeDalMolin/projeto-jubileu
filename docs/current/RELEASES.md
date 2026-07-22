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
- `v0.3.0-dev.evento-canonical` (canonical Evento breaking cut)

## Release Checklist

Every slice delivery should include:

- domain and contract summary
- implementation summary
- compatibility note
- migration/Alembic note when applicable
- PostgreSQL risk note
- validation commands
- linked Linear issue

## v0.3 Promotion Policy

- CI constroi backend e frontend uma unica vez para `linux/amd64` e publica no GHCR pela
  SHA completa.
- `release-manifest.json` registra os dois digests, Git SHA, Alembic head, workflow e a
  classe de compatibilidade da migration.
- RC1 e RC2 sao historicos e nao promoviveis. Somente `v0.3.0-rc.3`, criado depois de DEV-21 e
  DEV-27, podera ser candidato de promocao.
- RC3 usa os digests do manifesto em uma stack isolada e executa readiness, smoke e Playwright via
  NGINX; `/api/version` e consultado apenas depois do login do smoke.
- `compose.release.yml` e o unico runtime promovivel; `compose.server.yml` e scripts que compilavam
  ou atualizavam um checkout foram removidos. O banco usa volume externo explicitamente nomeado.
- O bundle do RC contem Compose, manifesto, scripts, runbooks e checksums, mas nunca env real,
  segredo ou dump.
- Producao, quando autorizada, reutiliza exatamente esses digests. A tag `v0.3.0` e o
  deploy produtivo nao fazem parte da aprovacao do RC.
- A migration `0020_auth_sessions_rollback_safe` e compativel durante a janela v0.3 porque
  preserva o hash legado. Migration incompativel exige restore explicito; scripts nunca
  executam downgrade ou restore automaticamente.
- A producao observada esta em `0016_usuarios_legacy_nullable`; o gate exige ensaio isolado
  `0016 -> 0020`, retorno do runtime anterior contra o schema migrado e nova subida do RC3.

## Current Planned Milestones

| Milestone | Scope | Expected outcome |
|---|---|---|
| Docs consolidation | refactors/docs | execution index, roadmap, API, decisions and Linear map |
| Backend contracts | Backend 06-08 | event API, read-model and auth/session hardening plan |
| Frontend Evento | Frontend 08-12 | event UI behavior, adapter, polling and session plan |
| Infra MVP | Infra 00-03 | runtime, gateway and deploy documentation |
| Evento MVP closure | DEV-28-33 | AULA stabilization, JOGO_LIVRE E2E, polling/auth hardening and validation matrix |
| Evento canonical cut | DEV-37-44 | Evento persistence/API/frontend migration, Usuario profile and release validation |

## v0.3.0-dev.evento-canonical Notes

Status: implemented in working tree.

Breaking changes:

- removed public Aula entity routes and frontend route `/dias/:dataIso/aulas/:aulaId`.
- canonical contextual route is `/dias/:dataIso/eventos/:eventoId`.
- event status values are `PLANEJADO`, `EM_ANDAMENTO`, `ENCERRADO`, `CANCELADO`.
- event type values are `AULA`, `JOGO_LIVRE`, `OUTRO`.

Included:

- Alembic migration `0013_eventos_canonicos_usuarios`.
- backend models and FKs renamed to Evento naming.
- persisted `Usuario` model and `/api/usuarios/me`.
- `auth/me` returns persisted profile fields where available.
- frontend services, hooks, types and workspace migrated to Evento naming.
- `/usuario` page shows profile, linked jogador and participated events.
- Dashboard home reads backend dashboard endpoints instead of mocks.
- Jogadores status options match backend values.

Validation:

- backend: `.venv\Scripts\python.exe -m pytest` passed on 2026-05-09.
- frontend: `npm run build` passed on 2026-05-09.
- frontend: `npm run lint` passed on 2026-05-09.

Migration note:

- historical migrations still contain old names because they are part of the schema history.
- `0013` upgrades existing data from old event table/column names to canonical Evento names and creates `usuarios`.

## v0.2.0-dev.docs-33 Notes

Status: in milestone closure.

Included:

- AULA live semantics fixed around partida `EM_ANDAMENTO`.
- explicit partida start/end lifecycle and `/api` aliases.
- AULA lances gated by event and partida status.
- JOGO_LIVRE operational path for RSVP, check-in, seed and lances.
- Evento polling consolidated on TanStack Query; unused page-local polling hooks removed.
- release validation matrix archived at `docs/archive/refactors/evento-validation-matrix.md`.

Validation gate:

- backend: `.venv\Scripts\python.exe -m pytest` passed on 2026-05-09.
- frontend: `npm run lint` passed on 2026-05-09.
- frontend: `npm run build` passed on 2026-05-09.
- local PostgreSQL API smoke passed for login/profile with `jogadorId`, AULA lifecycle/lance gates and JOGO_LIVRE RSVP/check-in/seed/lance.
- browser-level visual smoke remains pending.

PostgreSQL note:

- The 2026-05-09 smoke caught `SELECT max(...) FOR UPDATE` in the JOGO_LIVRE arrival queue path. The implementation now locks the event/AULA row before computing the next arrival sequence.

## Compatibility Windows

Legacy routes and compatibility adapters remain until:

- replacement contract is documented
- frontend migration is complete
- tests cover old and new paths
- rollout note is written
