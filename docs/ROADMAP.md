# Jubileu Roadmap

## Direction

Jubileu evolves as a compatibility-first modular monolith.

The canonical domain direction is:

`Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`

Persistence may remain Aula-centered while the product model converges toward Evento.

## Current Milestone

The current milestone is execution stability:

- align documentation with actual code
- preserve existing backend/frontend contracts
- close the operational Evento happy path
- stabilize polling and auth fallback behavior
- prepare runtime/deploy documentation for MVP use

## Execution Tracks

### Backend

Focus:

- event API contract hardening
- WorkspaceEvento read-model preparation
- auth/session operational hardening

### Frontend

Focus:

- canonical event contract alignment
- WorkspaceEvento adapter
- RSVP/check-in self actions
- live polling stability
- user/jogador session clarity

### Infra

Focus:

- local runtime clarity
- PostgreSQL/Alembic validation
- NGINX gateway assumptions
- MVP deploy hardening

## Delivery Order

1. Documentation consolidation.
2. Backend contract hardening.
3. Frontend contract alignment.
4. WorkspaceEvento adapter.
5. Self actions and check-in flow.
6. Polling and auth stability.
7. Operational session hardening.
8. Infra/deploy MVP.

## Compatibility Rules

- Keep legacy routes during transition.
- Keep `/api` gateway assumptions.
- Keep backend authorization as source of truth.
- Keep persistence names until a dedicated migration exists.
- Do not break frontend payload expectations without a bridge.

## Deferred Work

- Full Aula to Evento persistence rename.
- Pure `/eventos/:eventoId` deep-link without Dia context.
- WebSocket/MQTT real-time flow.
- Removal of legacy auth compatibility.
- Removal of legacy Aula routes.
