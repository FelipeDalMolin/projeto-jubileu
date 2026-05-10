# Evento Validation Matrix

## Purpose

Release gate for DEV-28 through DEV-44. This matrix closes the Evento canonical migration, Usuario profile, AULA-mode stabilization and JOGO_LIVRE MVP window before new vNext work starts.

## Automated Checks

| Area | Command | Expected |
|---|---|---|
| Backend contracts | `.venv\Scripts\python.exe -m pytest` from `backend/jubileu-api-fastapi` | all current tests pass; skipped MVP fixture remains documented |
| Frontend lint | `npm run lint` from `frontend/jubileu-web` | no lint errors or warnings |
| Frontend build | `npm run build` from `frontend/jubileu-web` | production bundle completes |

Last local automated run on 2026-05-09:

- backend: 43 passed, 1 skipped
- frontend lint: passed
- frontend build: passed

## Manual Smoke Scenarios

| DEV | Scenario | Acceptance | 2026-05-09 local result |
|---|---|---|---|
| DEV-28 | Open an AULA event with only `PLANEJADA` partidas | no live badge, no active timeline, pre-game state is shown | API smoke confirmed workspace `PLANEJADA` with partida `PLANEJADA` only |
| DEV-29 | Start a planned partida, then end it | status moves `PLANEJADA -> EM_ANDAMENTO -> ENCERRADA`; invalid transitions return `409` | API smoke confirmed start blocked before event start, then explicit start/end |
| DEV-30 | Try AULA lances before, during and after active partida | quick add is blocked outside event+partida `EM_ANDAMENTO`; accepted during active play | API smoke confirmed lance blocked before active partida and accepted during active partida |
| DEV-31 | Run JOGO_LIVRE from RSVP to first lance | RSVP/check-in updates participants, seed creates active partida, first lance appears in timeline | API smoke confirmed RSVP, self check-in, manual check-in, arrival queue, seed, lance and event end |
| DEV-32 | Exercise hidden tab, network failure and expired/invalid auth | no request flood; UI surfaces recoverable/auth errors; query polling resumes after recovery | Auth profile with `jogadorId` confirmed through `/api/auth/me`; browser/network visual smoke still pending |
| DEV-33 | Review docs and Linear | API, roadmap, releases and Linear DEV map match the implemented state | Docs and Linear reconciled for DEV-28 through DEV-33 |
| DEV-37-44 | Validate canonical Evento cut | no public code route/type/service uses Aula entity naming; Usuario profile/history works | Backend/frontend grep clean outside historical docs/migrations; `/api/usuarios/me` covered by test |

## Protected Compatibility

- Canonical `/dias/:dataIso/eventos/:eventoId` is the only contextual event workspace route.
- `/api` aliases for event, match lifecycle, lances and dashboards remain available.
- Persistence rename and Usuario creation are handled by Alembic migration `0013_eventos_canonicos_usuarios`.
- Backend authorization remains the source of truth for event actions.

## Remaining Risks

- SQLite-based tests do not fully prove PostgreSQL/Alembic behavior; local PostgreSQL smoke caught and fixed the `arrival_seq` check-in query path.
- Browser-level visual smoke is still pending because the browser automation tool was unavailable in this session; the Vite `/login` route loaded with HTTP 200.
- DEV closure still needs final product-owner acceptance before starting DEV-34 through DEV-36.
