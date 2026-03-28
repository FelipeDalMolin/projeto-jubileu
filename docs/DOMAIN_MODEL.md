# DOMAIN MODEL (Slice 00 Baseline)

## Purpose

This document captures the current domain model used by the backend and the intended canonical direction for incremental refactor work.

This is a stabilization baseline. It is not a rename or semantics rewrite document.

## Current persisted aggregates

Current persistence keeps event behavior centered on `Aula` and related entities:

- `Dia`
- `Aula`
- `TimeAula`
- `JogadorAula`
- `Partida`
- `EstatisticaJogadorPartida`
- `EventoParticipante`
- `Lance`
- `TeamConfig`

## Canonical direction (approved baseline)

Long-term business direction:

`Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`

Transitional rule:

- `Aula` remains the persisted aggregate for now.
- Canonical `Evento` naming can be introduced gradually in service/API layers with compatibility controls.
- No early persistence rename is allowed in stabilization slices.

## Invariants that must remain stable

- Parent-child ownership checks in nested day/event routes.
- Status gate rules for mutable operations (`PLANEJADA`, `EM_ANDAMENTO`, `CONCLUIDA`).
- Team snapshot/version consistency (`TeamConfig` active version ownership).
- Workspace combined version behavior for polling contracts.
- RSVP/check-in flow and arrival ordering semantics.
- Match lifecycle transitions and command guards.
- Backend authorization as source of truth.

## Protected domain surfaces (stabilization)

The following behaviors are frozen unless a slice explicitly refactors them:

- Workspace aggregation logic
- TeamConfig versioning
- Combined version logic
- KPI and warning derivation
- RSVP -> check-in transition flow
- `checked_at` / arrival ordering behavior
- Match lifecycle transitions

## Legacy hotspots (known)

- `app/models/dia_aula.py` concentrates multiple aggregates and enum concerns.
- `routers/dias.py` and `routers/partidas.py` still mix HTTP orchestration and business rules.
- `JogadorAula` and `EventoParticipante` overlap in participation semantics and require controlled convergence later.
