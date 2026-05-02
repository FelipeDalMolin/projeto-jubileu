# Jubileu Decisions

## Purpose

This document indexes architectural decisions that guide implementation slices.

Linear remains the detailed source for decision discussion. This file is the repository-facing map.

## Decision Index

### CORE-1 - Architectural Principles

Use compatibility-first incremental refactoring.

Implications:

- do not rewrite the system wholesale
- move rules into services/modules gradually
- preserve contracts while adding canonical paths

### CORE-2 - Aula State Model

State, snapshots and events must be separated.

Implications:

- TeamConfig versioning is protected
- combined version logic is protected
- read-model behavior must remain deterministic

### CORE-3 - Workspace DTO

Workspace is a UI read-model, not the persistence model.

Implications:

- WorkspaceAula remains valid during transition
- WorkspaceEvento should be introduced as an adapter/read-model, not as a destructive rename

### CORE-4 - Aula/Evento Status and Type

Status and type are domain constraints, not just UI labels.

Implications:

- status transitions must stay backend-enforced
- frontend capabilities must reflect backend status/type rules
- canonical Evento language may coexist with legacy Aula persistence

### CORE-5 - Player Presence Flow

Presence is a domain flow, not a visual toggle.

Implications:

- RSVP and check-in are separate concepts
- `checked_at` and arrival ordering are protected
- self actions require a reliable user/jogador session

### CORE-6 - Modular UI and Indicators

Operational screens should be modular and indicator-driven.

Implications:

- EventoPage should be composed from panels
- KPIs and warnings should come from stable derivation rules
- live/timeline UI must not create uncontrolled polling or duplicated state

## Rules for New Decisions

Create or reference a CORE decision when a change affects:

- domain semantics
- persistence naming
- public contracts
- security/auth model
- platform topology
- compatibility policy
