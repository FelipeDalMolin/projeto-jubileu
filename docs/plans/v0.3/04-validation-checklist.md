# 04 - Validation Checklist

## Backend

```powershell
cd backend\jubileu-api-fastapi
python -m pytest
alembic upgrade head
```

## Frontend

```powershell
cd frontend\jubileu-web
npm ci
npm run lint
npm run build
```

## Playwright Dev Container

```bash
docker exec jubileu-dev-frontend-dev-1 sh -lc 'apk add --no-cache chromium'
docker exec jubileu-dev-frontend-dev-1 sh -lc 'E2E_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser E2E_REUSE_EXISTING_SERVER=1 E2E_BASE_URL=http://frontend-dev:5173 E2E_API_URL=http://backend:8000 npm run test:e2e -- --project=chromium e2e/dev41-smoke.spec.ts --reporter=list'
docker exec jubileu-dev-frontend-dev-1 sh -lc 'E2E_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser E2E_REUSE_EXISTING_SERVER=1 E2E_BASE_URL=http://frontend-dev:5173 E2E_API_URL=http://backend:8000 npm run test:e2e -- --project=chromium e2e/contract.spec.ts e2e/uc01-login.spec.ts e2e/uc10-dashboard.spec.ts --reporter=list --workers=1 --timeout=90000'
```

## Buscas Obrigatorias

```bash
git grep -nE "WorkspaceAula|/aulas/|aula_id|aulaId" -- . ':(exclude)backend/jubileu-api-fastapi/alembic/versions/*' || true
git grep -nE "WorkspaceEvento|/eventos/|evento_id|eventoId" -- .
git grep -nE "JWT_SECRET|CHANGE_ME|sha256|localStorage|access_token" backend frontend || true
git grep -nE "className=.*\b(container|row|col-|card|btn|alert|table|table-sm|form-select|placeholder-wave|table-responsive)\b" frontend/jubileu-web/src || true
git grep -nE "refetchInterval|staleTime|force: true" frontend/jubileu-web/src || true
```

## Smoke Manual Obrigatorio

- Login.
- `/api/auth/me`.
- `/api/usuarios/me`.
- Usuario com `jogador_id`.
- Evento `AULA`: planejado, iniciado, encerrado.
- Evento `JOGO_LIVRE`: RSVP, check-in, fila, seed, partida ativa e lance.
- Historico de eventos participados em `/usuario`.
- Dashboard sem mocks criticos.

## Criterio De Falha

Falha qualquer item que:

- reintroduza Aula como entidade publica;
- exponha FastAPI ou PostgreSQL publicamente;
- introduza dependencia de UI sem motivacao, trade-offs e validacao visual documentados;
- aceite segredo inseguro em producao;
- publique release sem migration gate PostgreSQL.
