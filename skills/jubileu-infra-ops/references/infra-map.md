# Infra Map

## Runtime topologies

Dev:

```text
browser -> 127.0.0.1:8080 nginx-dev -> frontend-dev + backend -> postgres-dev
```

Release:

```text
Cloudflare tunnel -> 127.0.0.1:${NGINX_PORT} nginx image -> jubileu-api image -> jubileu-db
```

## Compose files

- `compose.dev.yml`
  Dev stack with `postgres-dev`, `backend`, `frontend-dev`, and `nginx-dev`.
  Main browser entrypoint: `127.0.0.1:8080`.

- `compose.release.yml`
  Immutable runtime with digest-pinned images, one-shot migration and external PostgreSQL volume.
  Only NGINX publishes a loopback port selected by `NGINX_PORT`.

Os Composes legados foram removidos. Use sempre `compose.dev.yml` ou `compose.release.yml` com
`--env-file` e `-f` explicitos.

## NGINX

- `infra/nginx/jubileu.dev.conf`
  Proxies `/api/` to `backend:8000`; proxies `/` to Vite `frontend-dev:5173`.

- `infra/nginx/jubileu.conf`
  Serves React `dist`; proxies `/api/` and `/health` to `jubileu-api:8000`; uses SPA fallback.

## Env files

- `.env.dev.example` is versioned development template.
- `.env.release.example` is the secret-free release shape.
- `.env.dev` and `.env.release` are local secret-bearing files and must remain ignored.

## Scripts

Dev:

- `scripts/dev/up_dev.sh`
- `scripts/dev/status_dev.sh`
- `scripts/dev/logs_dev.sh`
- `scripts/dev/smoke_dev.sh`
- `scripts/dev/down_dev.sh`

Release:

- `scripts/release/verify_required_checks.sh`
- `scripts/release/build_release_bundle.sh`
- `scripts/release/backup_release.sh`
- `scripts/release/restore_release.sh`
- `scripts/release/rehearse_restore_rollback.sh`
- `scripts/release/smoke_release.sh`
- `scripts/release/rollback_release.sh`
- `scripts/release/redact_evidence.sh`

## Runbooks

- `docs/runbooks/dev-compose.md`
- `docs/runbooks/cloudflare-tunnel.md`
- `docs/runbooks/postgres-migrations.md`
- `docs/runbooks/release-v03.md`
- `docs/runbooks/setup-linux.md`
- `docs/runbooks/setup-windows.md`
- `docs/ops/observabilidade.md`
- `docs/ops/wsl-incidentes.md`
