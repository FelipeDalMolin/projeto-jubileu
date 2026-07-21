# Infraestrutura Atual

Este documento resume a infraestrutura viva do Projeto Jubileu. Runbooks detalhados ficam em
`docs/runbooks/` e contexto operacional em `docs/ops/`.

## Topologia Oficial

```text
Cloudflare -> NGINX -> React SPA + FastAPI /api -> PostgreSQL
```

Regras:

- NGINX e o unico entrypoint publico.
- FastAPI nao deve expor porta publica em producao.
- PostgreSQL nao deve expor porta publica.
- `/api` e o prefixo de dados do backend pelo gateway.

## Desenvolvimento Via Docker

Arquivo principal: `compose.dev.yml`.

Servicos:

- `postgres-dev`: PostgreSQL 16 em rede interna Docker.
- `backend`: FastAPI, Alembic e Uvicorn em container.
- `frontend-dev`: Vite em container Node.
- `nginx-dev`: gateway local.

Portas locais:

- `127.0.0.1:8080`: entrada principal de desenvolvimento.
- `127.0.0.1:5173`: Vite direto para debug.
- `127.0.0.1:8000`: FastAPI direto para debug.
- PostgreSQL nao e publicado no host no compose dev oficial.

Comandos:

```bash
scripts/dev/up_dev.sh
scripts/dev/status_dev.sh
scripts/dev/logs_dev.sh
scripts/dev/smoke_dev.sh
scripts/dev/down_dev.sh
```

## Runtime Server

Arquivo principal: `compose.server.yml`.

Servicos:

- `jubileu-db`: PostgreSQL 16 interno.
- `jubileu-api`: FastAPI com `alembic upgrade head` no startup.
- `nginx`: serve `frontend/jubileu-web/dist` e proxy `/api`.

Porta local do servidor:

- `127.0.0.1:80:80`, normalmente consumida pelo Cloudflare Tunnel.

Comandos principais:

```bash
scripts/server/build_frontend.sh
scripts/server/up_server.sh
LOCAL_BASE_URL=http://127.0.0.1 scripts/server/smoke_server.sh
scripts/server/logs_server.sh
scripts/server/restart_server.sh
scripts/server/down_server.sh
```

## NGINX

- `infra/nginx/jubileu.dev.conf`: proxy `/api/` para `backend:8000` e `/` para Vite.
- `infra/nginx/jubileu.conf`: serve React estatico, faz fallback SPA e proxy `/api/`.
- `/health` testa backend pelo NGINX.
- `/api/health` testa caminho de API pelo gateway.
- `/api/dias` redireciona para `/api/dias/`.

## Ambientes E Segredos

- Versionar somente `.env.dev.example` e `.env.server.example`.
- Nunca versionar `.env.dev`, `.env.server` ou segredos reais.
- Nao copiar valores reais de secrets para documentacao, issues, PRs ou respostas.
- Arquivos locais de env devem permanecer ignorados e preferencialmente com permissao restrita.
- Producao exige `APP_ENV=production`, `AUTH_MODE=secure`, cookies seguros e segredos distintos para JWT e digest HMAC de refresh.
- O backend falha no startup quando a configuracao de auth de producao usa defaults, placeholders ou modo invalido.

## Banco E Migrations

- PostgreSQL 16 e o banco oficial de dev/prod.
- Alembic e obrigatorio para alteracao de schema.
- Testes SQLite podem apoiar regras, mas nao substituem validacao PostgreSQL para migration, enum, default ou nullable.

## Validacao

Config compose:

```bash
docker compose --env-file .env.dev -f compose.dev.yml config
docker compose --env-file .env.server -f compose.server.yml config
```

Smoke dev:

```bash
scripts/dev/smoke_dev.sh
```

Smoke server:

```bash
LOCAL_BASE_URL=http://127.0.0.1 scripts/server/smoke_server.sh
```

Contrato frontend/API:

```bash
cd frontend/jubileu-web
npm run check:api-contract
```

## Runbooks Relacionados

- `docs/runbooks/dev-compose.md`
- `docs/runbooks/cloudflare-tunnel.md`
- `docs/runbooks/postgres-migrations.md`
- `docs/runbooks/setup-linux.md`
- `docs/runbooks/setup-windows.md`
- `docs/ops/observabilidade.md`
- `docs/ops/wsl-incidentes.md`
