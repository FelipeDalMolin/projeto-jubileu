# Linear CORE/DEV Map

## Purpose

This document maps refactor slices to Linear decisions and execution issues.

Linear issue numbers are assigned by Linear. Proposed DEV numbers must be aligned to the next available issue at creation time.

## CORE Decisions

| CORE | Scope | Usage in refactor execution |
|---|---|---|
| `CORE-1` | Architectural principles | Compatibility-first execution, service ownership, gateway rules |
| `CORE-2` | Aula state model | TeamConfig, snapshots, versioned state discipline |
| `CORE-3` | Workspace DTO | WorkspaceAula and WorkspaceEvento read-model contracts |
| `CORE-4` | Aula/Evento status and type | Status/type compatibility and lifecycle transitions |
| `CORE-5` | Player presence flow | RSVP/check-in/attendance/arrival ordering/self actions |
| `CORE-6` | Modular UI and indicators | EventoPage panels, KPIs, warnings, operational UX |

## Existing DEV Context

| DEV | Status in current plan | Notes |
|---|---|---|
| `DEV-5` | Existing baseline | WorkspaceAula backend read-model |
| `DEV-6` | Existing baseline | Frontend consumption of WorkspaceAula |
| `DEV-7` | Existing baseline | Aula status/type and lifecycle |
| `DEV-9` | Existing baseline | Attendance confirmation |
| `DEV-10` | Existing baseline | TeamConfig versioning |
| `DEV-11` | Existing open context | Match event log/timeline backend |
| `DEV-12` | Existing open context | Match event UI |
| `DEV-13` | Existing baseline | Backend KPIs |
| `DEV-14` | Existing baseline | Backend warnings |
| `DEV-15` | Existing baseline | New Aula UI with panels |
| `DEV-16` | Existing baseline | Workspace DTO contract |
| `DEV-17` | Existing baseline | Aula state aggregation |
| `DEV-18` | Existing baseline | Contract validation |
| `DEV-19` | Existing baseline | Workspace DTO endpoint |
| `DEV-20` | Existing baseline | Refactor docs consolidation |
| `DEV-21` | Existing baseline | Backend 06 event contract hardening |
| `DEV-22` | Existing baseline | Frontend 08 event contract alignment |
| `DEV-23` | Existing baseline | Frontend 09 WorkspaceEvento adapter |
| `DEV-24` | Existing baseline | Frontend 10 RSVP/check-in self actions |
| `DEV-25` | Existing baseline | Frontend 11 polling/live stability |
| `DEV-26` | Existing baseline | Frontend 12 operational user/jogador session |
| `DEV-27` | Existing baseline | Infra 00-03 runtime/gateway/deploy MVP |

## Current Expansion (AULA stabilization + next event type)

Use existing CORE decisions only (`CORE-4`, `CORE-5`, `CORE-6`, and `CORE-3` for polling stability).

| DEV | Title | Scope | CORE links | Branch pattern |
|---|---|---|---|---|
| `DEV-28` | Corrigir semantica Ao Vivo em AULA | `frontend/workspaces/evento` (partida ativa somente `EM_ANDAMENTO`) | `CORE-4`, `CORE-6` | `dev-28-aula-ao-vivo-semantics` |
| `DEV-29` | Lifecycle explicito de partida start/end | `backend/routers/partidas.py` + `/api` aliases + tests | `CORE-4`, `CORE-6` | `dev-29-aula-partida-lifecycle` |
| `DEV-30` | Gerencia de lances v2 para AULA | capabilities + timeline/quick add com gate por status | `CORE-4`, `CORE-6` | `dev-30-aula-lances-v2` |
| `DEV-31` | JOGO_LIVRE E2E | RSVP/check-in/presentes/seed/lances no workspace | `CORE-5`, `CORE-6` | `dev-31-jogo-livre-e2e` |
| `DEV-32` | Hardening polling/autenticacao por canal | controller unico, backoff, circuit breaker, hidden tab pause | `CORE-3`, `CORE-6` | `dev-32-evento-polling-auth-hardening` |
| `DEV-33` | Contratos, testes e release docs | API/ROADMAP/RELEASES + matriz de validacao | `CORE-4`, `CORE-5`, `CORE-6` | `dev-33-evento-contract-tests-release` |

Execution note:

- `DEV-28`, `DEV-29` and `DEV-30` are the immediate stabilization path for current `AULA`.
- `DEV-31` starts the next operational event type already present in domain (`JOGO_LIVRE`).
- `OUTRO` remains modeling-prep only in this cycle (no operational UI flow yet).

## WorkspaceEvento vNext (operational tabs + manual rotation)

| DEV | Title | Scope | CORE links | Branch pattern |
|---|---|---|---|---|
| `DEV-34` | WorkspaceEvento vNext tabs | Presenca como aba principal, Partida Atual, Partidas historico | `CORE-4`, `CORE-6` | `dev-34-workspace-evento-tabs-vnext` |
| `DEV-35` | Rotacao manual auditavel | preview/confirm por token, estado persistido, fila/proximos times | `CORE-4`, `CORE-5`, `CORE-6` | `dev-35-evento-rotacao-manual-audit` |
| `DEV-36` | Query + cronometro operacional | migracao TanStack Query, cronometro por inicio_at/fim_at, alerta de fim | `CORE-3`, `CORE-6` | `dev-36-evento-query-timer-hardening` |

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
