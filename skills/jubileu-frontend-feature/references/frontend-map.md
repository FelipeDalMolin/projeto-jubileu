# Frontend Map

## Stack

- React + Vite + TypeScript.
- Router: `react-router-dom`.
- Data/query: mixed service calls plus TanStack Query in workspace surfaces.
- E2E: Playwright under `frontend/jubileu-web/e2e`.

## Main paths

- `src/App.tsx`
  Wraps `AuthProvider`, `BrowserRouter`, `Navbar`, and `AppRoutes`.

- `src/routes/AppRoutes.tsx`
  Canonical SPA routes:
  - `/login`
  - `/dias`
  - `/dias/:dataIso`
  - `/dias/:dataIso/eventos/:eventoId`
  - `/turmas`, `/turmas/nova`, `/turmas/:turmaId`
  - `/jogadores`
  - `/dashboard`, `/dashboard/jogadores`, `/dashboard/partidas`, `/dashboard/estatisticas`
  - `/usuario`

- `src/context/AuthContext.tsx`, `src/hooks/useAuthSession.ts`
  Session and auth state.

- `src/lib/apiClient.ts`
  Minimal `/api` client with `X-Request-ID`.

- `src/services/`
  Domain services. Some use local `fetch` helpers; event command services use `services/eventos/http.ts`.

- `src/types/`
  Domain DTOs and frontend types.

- `src/pages/dias/`
  Calendar/day/event entry flow.

- `src/pages/eventos/EventoPage.tsx`
  Event route shell.

- `src/workspaces/evento/`
  Operational event workspace: presence, teams, rotation, live partida, lances, timeline.

- `src/components/evento/`
  Workspace panels and read-model display components.

- `src/pages/dashboard/`
  Dashboards backed by backend dashboard endpoints.

## Important scripts

```bash
cd frontend/jubileu-web
npm run lint
npm run build
npm run check:api-contract
npm run test:e2e
```

## Generated docs

`docs/generated/code-map.md` lists frontend routes and `/api/...` calls discovered from services.
Regenerate after route or service changes:

```bash
python3 scripts/docs/generate_code_map.py
```
