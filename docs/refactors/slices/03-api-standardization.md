# Slice 03 - API Standardization

## Intent

Standardize backend exposure under `/api` while preserving legacy routes for one compatibility cycle.

## Strategy

- Keep existing legacy routes unchanged.
- Add `/api` aliases for non-`/api` routers.
- Keep existing `/api` routes in `eventos` unchanged.
- Do not change payload shapes.
- Do not change auth flow.

## Compatibility map (old -> new)

- `/jogadores/*` -> `/api/jogadores/*` (both active)
- `/turmas/*` -> `/api/turmas/*` (both active)
- `/dias/*` -> `/api/dias/*` (both active)
- `/dashboards/jogadores/*` -> `/api/dashboards/jogadores/*` (both active)
- `/dashboards/partidas/*` -> `/api/dashboards/partidas/*` (both active)
- `/dashboards/estatisticas/*` -> `/api/dashboards/estatisticas/*` (both active)
- `/api/eventos/*` -> `/api/eventos/*` (already standardized; unchanged)
- `/api/partidas/{partida_id}/lances` -> `/api/partidas/{partida_id}/lances` (already standardized; unchanged)

## Extraction scope in this slice

- `routers/eventos.py` keeps HTTP orchestration only.
- Business/orchestration logic moved to `app/modules/eventos/service.py`:
  - RSVP/check-in/manual check-in lifecycle rules
  - participant and ownership checks
  - arrival sequence calculation
  - start/end/cancel event lifecycle
  - seed-first-match orchestration
  - lance validation and idempotency behavior

## Deferred cleanup (intentional)

- Legacy non-`/api` routes are still active by design.
- Persistence naming remains legacy (`Aula`, `JogadorAula`, `EventoParticipante`).
- `app/models/dia_aula.py` remains a re-export compatibility surface.
- `app/database.py` compatibility bridge remains in place.
