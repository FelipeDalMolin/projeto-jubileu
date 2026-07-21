---
name: jubileu-frontend-feature
description: Implement or evolve frontend features for Projeto Jubileu, a React, Vite, TypeScript sports event app. Use when Codex changes pages, routes, components, hooks, services, types, auth/session UI, polling/query behavior, API contract usage, Playwright tests, or frontend/backend convergence.
---

# Jubileu Frontend Feature

Use this skill when working on the React/Vite application in `frontend/jubileu-web`.

Read only the references needed:

- Read [`references/frontend-map.md`](./references/frontend-map.md) to locate routes, pages, services, types, workspace components, tests, and scripts.
- Read [`references/frontend-rules.md`](./references/frontend-rules.md) before changing routing, API calls, auth headers, polling, query behavior, or user-facing flows.
- Read [`../../docs/current/COMMAND_SAFETY.md`](../../docs/current/COMMAND_SAFETY.md) before changing forms, buttons, services, or workspace actions that write data.

## Workflow

1. Start from the user flow, not the component.
2. Trace page -> service -> backend route -> type/schema.
3. Preserve canonical routes and `/api` data calls.
4. Keep local UI state immediate, then persist through backend commands.
5. Update TypeScript types with service/payload changes.
6. Run frontend checks and regenerate the code map if routes/services changed:

```bash
cd frontend/jubileu-web
npm run lint
npm run build
npm run check:api-contract
cd ../..
python3 scripts/docs/generate_code_map.py
```

## Core Rules

- Canonical event route: `/dias/:dataIso/eventos/:eventoId`.
- Do not reintroduce `/dias/:dataIso/aulas/:aulaId`.
- Frontend API calls must use `/api/...` and must never produce `/api/api/...`.
- Prefer existing services and types before adding a new client abstraction.
- Keep backend authorization as source of truth; frontend role checks are UI affordances.
- For teams/workspace, follow: local immediate state -> persisted command/event -> polling now -> WebSocket future.
- For mutating UI, prevent duplicate submits as UX and rely on backend command safety for integrity.
- Avoid broad visual redesign while fixing data/API behavior.
- Update `docs/current/FRONTEND.md` when frontend architecture or workflow rules change.

## Closeout

Report:

- changed user flow;
- changed routes/services/types/components;
- API contract impact;
- checks run;
- known UI/test gaps.
