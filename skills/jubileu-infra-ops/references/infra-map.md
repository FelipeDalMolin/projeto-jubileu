# Infra Map

## Runtime topologies

Dev:

```text
browser -> 127.0.0.1:8080 nginx-dev -> frontend-dev + backend -> postgres-dev
```

Server:

```text
Cloudflare tunnel -> 127.0.0.1:80 nginx -> static React dist + jubileu-api -> jubileu-db
```

## Compose files

- `compose.dev.yml`
  Dev stack with `postgres-dev`, `backend`, `frontend-dev`, and `nginx-dev`.
  Main browser entrypoint: `127.0.0.1:8080`.

- `compose.server.yml`
  Server runtime with `jubileu-db`, `jubileu-api`, and `nginx`.
  NGINX binds `127.0.0.1:80:80`.

O Compose PostgreSQL-only legado foi removido. Use sempre `compose.dev.yml` ou
`compose.server.yml` com `--env-file` e `-f` explicitos.

## NGINX

- `infra/nginx/jubileu.dev.conf`
  Proxies `/api/` to `backend:8000`; proxies `/` to Vite `frontend-dev:5173`.

- `infra/nginx/jubileu.conf`
  Serves React `dist`; proxies `/api/` and `/health` to `jubileu-api:8000`; uses SPA fallback.

## Env files

- `.env.dev.example` is versioned development template.
- `.env.server.example` is versioned server template.
- `.env.dev` and `.env.server` are local secret-bearing files and must remain ignored.

## Scripts

Dev:

- `scripts/dev/up_dev.sh`
- `scripts/dev/status_dev.sh`
- `scripts/dev/logs_dev.sh`
- `scripts/dev/smoke_dev.sh`
- `scripts/dev/down_dev.sh`

Server:

- `scripts/server/build_frontend.sh`
- `scripts/server/up_server.sh`
- `scripts/server/smoke_server.sh`
- `scripts/server/check_api_contracts.sh`
- `scripts/server/logs_server.sh`
- `scripts/server/restart_server.sh`
- `scripts/server/down_server.sh`
- `scripts/server/backup_db.sh`
- `scripts/server/restore_db.sh`
- `scripts/server/deploy_server.sh`

## Runbooks

- `docs/runbooks/dev-compose.md`
- `docs/runbooks/cloudflare-tunnel.md`
- `docs/runbooks/postgres-migrations.md`
- `docs/runbooks/setup-linux.md`
- `docs/runbooks/setup-windows.md`
- `docs/ops/observabilidade.md`
- `docs/ops/wsl-incidentes.md`
