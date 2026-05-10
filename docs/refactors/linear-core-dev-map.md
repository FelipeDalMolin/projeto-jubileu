# Linear CORE/DEV Map

## Purpose

This document maps refactor slices to Linear decisions and execution issues.

Linear issue numbers are assigned by Linear. Proposed DEV numbers must be aligned to the next available issue at creation time.

## CORE Decisions

| CORE | Scope | Usage in refactor execution |
|---|---|---|
| `CORE-1` | Architectural principles | Compatibility-first execution, service ownership, gateway rules |
| `CORE-2` | Evento state model | TeamConfig, snapshots, versioned state discipline |
| `CORE-3` | Workspace DTO | WorkspaceEvento read-model contracts |
| `CORE-4` | Evento status and type | status/type compatibility and lifecycle transitions |
| `CORE-5` | Player presence flow | RSVP/check-in/attendance/arrival ordering/self actions |
| `CORE-6` | Modular UI and indicators | EventoPage panels, KPIs, warnings, operational UX |

## Existing DEV Context

| DEV | Status in current plan | Notes |
|---|---|---|
| `DEV-5` | Historical baseline | Legacy workspace backend read-model |
| `DEV-6` | Historical baseline | Legacy frontend workspace consumption |
| `DEV-7` | Historical baseline | event status/type and lifecycle |
| `DEV-9` | Existing baseline | Attendance confirmation |
| `DEV-10` | Existing baseline | TeamConfig versioning |
| `DEV-11` | Existing open context | Match event log/timeline backend |
| `DEV-12` | Existing open context | Match event UI |
| `DEV-13` | Existing baseline | Backend KPIs |
| `DEV-14` | Existing baseline | Backend warnings |
| `DEV-15` | Historical baseline | Workspace UI with panels |
| `DEV-16` | Existing baseline | Workspace DTO contract |
| `DEV-17` | Historical baseline | event state aggregation |
| `DEV-18` | Existing baseline | Contract validation |
| `DEV-19` | Existing baseline | Workspace DTO endpoint |
| `DEV-20` | Existing baseline | Refactor docs consolidation |
| `DEV-21` | Existing baseline | Backend 06 event contract hardening |
| `DEV-22` | Existing baseline | Frontend 08 event contract alignment |
| `DEV-23` | Existing baseline | Frontend 09 WorkspaceEvento adapter |
| `DEV-24` | Implemented in repo, API smoke passed | Frontend 10 RSVP/check-in self actions |
| `DEV-25` | Superseded by DEV-32 closure path | Frontend 11 polling/live stability |
| `DEV-26` | Implemented in repo, API smoke passed | Frontend 12 operational user/jogador session |
| `DEV-27` | Existing baseline | Infra 00-03 runtime/gateway/deploy MVP |

## Current Expansion (canonical Evento + Usuario)

Use existing CORE decisions only (`CORE-4`, `CORE-5`, `CORE-6`, and `CORE-3` for polling stability).

| DEV | Title | Scope | CORE links | Branch pattern |
|---|---|---|---|---|
| `DEV-28` | Corrigir semantica Ao Vivo em modo AULA | `frontend/workspaces/evento` (partida ativa somente `EM_ANDAMENTO`) | `CORE-4`, `CORE-6` | `dev-28-evento-ao-vivo-semantics` |
| `DEV-29` | Lifecycle explicito de partida start/end | `backend/routers/partidas.py` + `/api` aliases + tests | `CORE-4`, `CORE-6` | `dev-29-evento-partida-lifecycle` |
| `DEV-30` | Gerencia de lances v2 para Evento | capabilities + timeline/quick add com gate por status | `CORE-4`, `CORE-6` | `dev-30-evento-lances-v2` |
| `DEV-31` | JOGO_LIVRE E2E | RSVP/check-in/presentes/seed/lances no workspace | `CORE-5`, `CORE-6` | `dev-31-jogo-livre-e2e` |
| `DEV-32` | Hardening polling/autenticacao por canal | controller unico, backoff, circuit breaker, hidden tab pause | `CORE-3`, `CORE-6` | `dev-32-evento-polling-auth-hardening` |
| `DEV-33` | Contratos, testes e release docs | API/ROADMAP/RELEASES + matriz de validacao | `CORE-4`, `CORE-5`, `CORE-6` | `dev-33-evento-contract-tests-release` |

Execution note:

- `DEV-28`, `DEV-29` and `DEV-30` are the stabilization path for current `Evento.tipo = AULA`.
- `DEV-31` starts the next operational event type already present in domain (`JOGO_LIVRE`).
- `DEV-32` uses TanStack Query as the active polling path; obsolete Evento polling hooks should stay removed.
- `DEV-33` is the release gate before starting WorkspaceEvento vNext.
- `OUTRO` remains modeling-prep only in this cycle (no operational UI flow yet).

## WorkspaceEvento vNext (operational tabs + manual rotation)

| DEV | Title | Scope | CORE links | Branch pattern |
|---|---|---|---|---|
| `DEV-34` | WorkspaceEvento vNext tabs | Presenca como aba principal, Partida Atual, Partidas historico | `CORE-4`, `CORE-6` | `dev-34-workspace-evento-tabs-vnext` |
| `DEV-35` | Rotacao manual auditavel | preview/confirm por token, estado persistido, fila/proximos times | `CORE-4`, `CORE-5`, `CORE-6` | `dev-35-evento-rotacao-manual-audit` |
| `DEV-36` | Query + cronometro operacional | migracao TanStack Query, cronometro por inicio_at/fim_at, alerta de fim | `CORE-3`, `CORE-6` | `dev-36-evento-query-timer-hardening` |

## Evento Canonico + Usuario

Linear assigned the next available identifiers `DEV-34` through `DEV-41` for the proposed `DEV-37` through `DEV-44` sequence.

| DEV | Title | Scope | CORE links | Branch pattern |
|---|---|---|---|---|
| `DEV-34` | Proposed DEV-37 Decisao Evento canonico | checklist de corte e contratos publicos | `CORE-2`, `CORE-4` | `dev-34-dev-37-decisao-evento-canonico` |
| `DEV-35` | Proposed DEV-38 Migration persistence Evento | Alembic rename de tabelas/FKs e Usuario | `CORE-2`, `CORE-4` | `dev-35-dev-38-migration-persistence-evento` |
| `DEV-36` | Proposed DEV-39 Backend Evento-only | rotas, schemas, auth e testes sem entidade legada | `CORE-4`, `CORE-5` | `dev-36-dev-39-backend-evento-only` |
| `DEV-37` | Proposed DEV-40 Frontend Evento-only | rotas, services, hooks e workspace sem entidade legada | `CORE-3`, `CORE-6` | `dev-37-dev-40-frontend-evento-only` |
| `DEV-38` | Proposed DEV-41 Usuario persistido | model, auth/me e seed operacional | `CORE-5` | `dev-38-dev-41-usuario-persistido` |
| `DEV-39` | Proposed DEV-42 Pagina Usuario | perfil, jogador vinculado e eventos participados | `CORE-5`, `CORE-6` | `dev-39-dev-42-pagina-usuario` |
| `DEV-40` | Proposed DEV-43 UI operacional geral | Dashboard real-data, Jogadores, Turmas e Sessao | `CORE-6` | `dev-40-dev-43-ui-operacional-geral` |
| `DEV-41` | Proposed DEV-44 Docs e validacao final | API, releases, roadmap, smoke e release gate | `CORE-4`, `CORE-6` | `dev-41-dev-44-docs-e-validacao-final` |

## Issue Body Template

Each DEV issue should include:

- slice path
- related CORE issues
- branch suggestion
- compatibility constraints
- acceptance criteria
- validation checklist

## Branch Rule

Use issue-driven branches:

- `dev-XX-short-slug`

If Linear assigns a different number than proposed, update the branch slug to match the real issue identifier.
