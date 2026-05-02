# Linear CORE/DEV Map

## Purpose

This document maps refactor slices to Linear decisions and execution issues.

Linear issue numbers are assigned by Linear. The proposed DEV numbers below assume the next available DEV issue after the current visible sequence ending at `DEV-19`.

## CORE Decisions

| CORE | Scope | Usage in refactor execution |
|---|---|---|
| `CORE-1` | Architectural principles | Compatibility-first execution, append-only event thinking, service ownership |
| `CORE-2` | Aula state model | TeamConfig, snapshots, versioned state, state transition discipline |
| `CORE-3` | Workspace DTO | WorkspaceAula and future WorkspaceEvento read-model contracts |
| `CORE-4` | Aula/Evento status and type | Status/type compatibility and canonical event vocabulary |
| `CORE-5` | Player presence flow | RSVP, check-in, attendance, arrival ordering, self actions |
| `CORE-6` | Modular UI and indicators | EventoPage panels, KPIs, warnings, operational UI layout |

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

## New DEV Issues

| DEV | Title | Slice path | CORE links | Branch pattern | Linear |
|---|---|---|---|---|
| `DEV-20` | Consolidar docs/refactors e índice de execução | `docs/refactors/EXECUTION_INDEX.md` | `CORE-1`, `CORE-2`, `CORE-3`, `CORE-6` | `dev-20-docs-refactors-execution-index` | https://linear.app/projeto-jubileu/issue/DEV-20/consolidar-docsrefactors-e-indice-de-execucao |
| `DEV-21` | Backend 06 - hardening dos contratos canônicos de Evento | `docs/refactors/Backend/06-evento-api-contract-hardening.md` | `CORE-1`, `CORE-4`, `CORE-5` | `dev-21-backend-evento-api-contract-hardening` | https://linear.app/projeto-jubileu/issue/DEV-21/backend-06-hardening-dos-contratos-canonicos-de-evento |
| `DEV-22` | Frontend 08 - alinhamento de contratos de Evento | `docs/refactors/Frontend/08-evento-contract-alignment.md` | `CORE-3`, `CORE-4`, `CORE-6` | `dev-22-frontend-evento-contract-alignment` | https://linear.app/projeto-jubileu/issue/DEV-22/frontend-08-alinhamento-de-contratos-de-evento |
| `DEV-23` | Frontend 09 - adapter WorkspaceEvento | `docs/refactors/Frontend/09-workspace-evento-adapter.md` | `CORE-2`, `CORE-3`, `CORE-6` | `dev-23-frontend-workspace-evento-adapter` | https://linear.app/projeto-jubileu/issue/DEV-23/frontend-09-adapter-workspaceevento |
| `DEV-24` | Frontend 10 - RSVP/check-in self actions | `docs/refactors/Frontend/10-rsvp-checkin-self-actions.md` | `CORE-5`, `CORE-6` | `dev-24-frontend-rsvp-checkin-self-actions` | https://linear.app/projeto-jubileu/issue/DEV-24/frontend-10-rsvpcheck-in-self-actions |
| `DEV-25` | Frontend 11 - polling/live stability | `docs/refactors/Frontend/11-evento-polling-live-stability.md` | `CORE-2`, `CORE-3`, `CORE-6` | `dev-25-frontend-evento-polling-live-stability` | https://linear.app/projeto-jubileu/issue/DEV-25/frontend-11-pollinglive-stability |
| `DEV-26` | Frontend 12 - sessão operacional user/jogador | `docs/refactors/Frontend/12-user-jogador-operational-session.md` | `CORE-5` | `dev-26-frontend-user-jogador-session` | https://linear.app/projeto-jubileu/issue/DEV-26/frontend-12-sessao-operacional-userjogador |
| `DEV-27` | Infra 00-03 - runtime, gateway e deploy MVP | `docs/refactors/Infra/00-overview.md` | `CORE-1` | `dev-27-infra-runtime-gateway-deploy-mvp` | https://linear.app/projeto-jubileu/issue/DEV-27/infra-00-03-runtime-gateway-e-deploy-mvp |

## Issue Body Template

Each new DEV issue should include:

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
