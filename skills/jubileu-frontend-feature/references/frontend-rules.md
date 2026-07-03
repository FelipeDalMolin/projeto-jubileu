# Frontend Rules

## Routing

- SPA navigation routes are not API routes.
- Canonical contextual event route is `/dias/:dataIso/eventos/:eventoId`.
- `/eventos/:eventoId` is not canonical until backend event-id resolution is explicit.
- `/dias/:dataIso/aulas/:aulaId` must not return as active UI.

## API calls

- Use `/api/...` for backend data.
- Avoid duplicated prefixes such as `/api/api/...`.
- Prefer relative API base in dev behind NGINX/Vite unless a task explicitly needs `VITE_API_BASE_URL`.
- Keep `X-Request-ID` behavior when using shared clients.
- When adding a service, update `npm run check:api-contract` expectations only if the rule itself changes.

## Auth/session

- Bearer JWT is preferred when available.
- Legacy `X-User-Id`, `X-Role`, and `X-Jogador-Id` headers can remain for compatibility.
- Do not trust frontend role checks for critical authorization.

## State and polling

- Local interaction can update immediately for responsiveness.
- Persist commands through backend routes.
- Refresh workspace/state through version-aware polling or TanStack Query.
- Avoid fan-out polling, hidden-tab churn, and repeated `401` loops.
- WebSocket/MQTT is future work, not the current default.

## Types and DTOs

- Update `src/types/*` with service changes.
- Prefer mappers at service boundaries when backend snake_case differs from frontend camelCase.
- Keep event vocabulary: `Evento`, `eventoId`, `evento_id`.

## UI direction

- This is an operational club-management app, not a marketing site.
- Screens should be dense, scannable, and task-oriented.
- Preserve existing layout/components unless the feature requires UI structure changes.
- Avoid broad redesigns inside API/data fixes.

## Testing

- Run `npm run lint`, `npm run build`, and `npm run check:api-contract` for normal frontend changes.
- Use Playwright for user workflows when changing navigation, auth, forms, or event workspace behavior.
- If Playwright is blocked by host/browser/API dependencies, state the blocker precisely.
