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
- dependa de Bootstrap ou shadcn/ui;
- aceite segredo inseguro em producao;
- publique release sem migration gate PostgreSQL.
