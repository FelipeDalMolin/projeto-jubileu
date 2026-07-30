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

## v0.3.0 Final Release

Status: promoted on 2026-07-23 from immutable candidate `v0.3.0-rc.5`.

- Git SHA: `bfe4ed076c101e4bf9c44bdbff7fa896a6fd7ff6`.
- Backend digest: `sha256:59928c4b79764127edc56a0a2cf01d2392d32a1d65a7a668dde4488cc96de92f`.
- Frontend digest: `sha256:595355954c989edb6b6e5af387b832f95bb21d6cbd1c0180269759eafd3a1232`.
- Alembic: production upgraded from `0016_usuarios_legacy_nullable` to
  `0020_auth_sessions_rollback_safe` through a one-shot migration.
- Runtime: `/srv/ops/stacks/jubileu-v03`, using `compose.release.yml`; the legacy production
  checkout was not modified.
- Validation: authenticated smoke passed; readiness remained stable for 31 samples over 15
  minutes; API and NGINX logs contained zero unexpected `5xx`.
- Rollback: no downgrade, restore or automatic rollback was executed. The prior runtime artifacts
  and pre-migration custom-format backups remain private and checksummed.

The final tag `v0.3.0` points to the same commit as RC5. Its release assets reuse the approved
manifest, bundle and checksums; no image was rebuilt and no existing RC tag was changed.

Included product/platform outcomes:

- canonical `Evento` model and guided operational workspace;
- persisted Usuario/player identity and secure cookie sessions;
- server-side authorization matrix and RBAC Security Gate;
- deterministic queue/next-match command with PostgreSQL concurrency and idempotency;
- traceable dashboards and operational Tailwind UI;
- six blocking CI checks, full Playwright suite, immutable digest promotion and verified rollback
  rehearsal.

## v0.3.1 Stabilization

Status: DEV-53 em validacao local; nenhum candidato, tag ou deploy criado.

Primeiro slice proposto:

- logs JSON NGINX/FastAPI com rota normalizada e identificadores validados;
- healthchecks desacoplados e reducao de ruido de probes;
- reports locais privados, rotativos e sem dados funcionais/logs brutos;
- piloto OTel somente por overlay dev, OTLP/HTTP e rede privada;
- backend construído por `requirements.lock --require-hashes`;
- contratos de privacidade e sintaxe NGINX adicionados ao required check `Compose + Shell`.

Nao ha migration nem mudanca de contrato funcional da API. A matriz
[`DEV53_OBSERVABILITY_CONFORMANCE.md`](DEV53_OBSERVABILITY_CONFORMANCE.md) registra os blockers:
issue filha de DEV-53, audit atual do frontend, CI completo e aplicacao controlada da nova
configuracao no runtime dev. Producao permanece em `v0.3.0`.

## v0.3 Promotion Policy

- CI constroi backend e frontend uma unica vez para `linux/amd64` e publica no GHCR pela
  SHA completa.
- `release-manifest.json` registra os dois digests, Git SHA, Alembic head, workflow e a
  classe de compatibilidade da migration.
- RC1 e RC2 sao historicos e nao promoviveis. RC3 falhou no gate de rehearsal posterior ao build.
  RC4 corrigiu e aprovou o rehearsal real, mas foi rejeitado pelo audit de dependencias posterior
  ao build. Todos permanecem imutaveis e nao promoviveis; RC5 e o unico candidato promovido.
- O required check `Frontend` executa `npm audit --audit-level=high` depois de `npm ci`, alem de
  lint, build e contrato `/api`. Uma falha posterior ao build exige novo RC.
- O RC candidato usa os digests do manifesto em uma stack isolada e executa readiness, smoke e
  Playwright via NGINX; `/api/version` e consultado apenas depois do login do smoke.
- `compose.release.yml` e o unico runtime promovivel; `compose.server.yml` e scripts que compilavam
  ou atualizavam um checkout foram removidos. O banco usa volume externo explicitamente nomeado.
- O bundle do RC contem Compose, manifesto, scripts, runbooks e checksums, mas nunca env real,
  segredo ou dump.
- Producao reutiliza exatamente os digests do RC aprovado. A tag `v0.3.0` aponta para o mesmo SHA
  do RC5 e nao dispara o workflow de build de candidatos.
- A migration `0020_auth_sessions_rollback_safe` e compativel durante a janela v0.3 porque
  preserva o hash legado. Migration incompativel exige restore explicito; scripts nunca
  executam downgrade ou restore automaticamente.
- A producao partiu de `0016_usuarios_legacy_nullable`; o gate comprovou isoladamente
  `0016 -> 0020`, retorno do runtime anterior contra o schema migrado e nova subida do RC aprovado
  antes da promocao real.
- O runtime anterior valida saude da API enquanto a revisao e consultada diretamente no banco. Sua
  copia historica do Alembic nao e obrigada a conhecer o identificador `0020`.

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
