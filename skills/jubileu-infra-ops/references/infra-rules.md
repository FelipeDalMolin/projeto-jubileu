# Infra Rules

## Exposure

- Public traffic enters through Cloudflare/NGINX.
- FastAPI must not expose a public host port in production.
- PostgreSQL must not expose a public host port.
- Dev-only direct ports are bound to `127.0.0.1`.

## Gateway

- `/health` validates backend health through NGINX.
- `/api/health` validates API gateway path.
- Canonical collections have no trailing slash; NGINX must not redirect contracts before auth.
- `/api/version` is authenticated; release smoke logs in before validating identity.
- SPA routes must fall back to React `index.html` in server NGINX.
- Dev NGINX proxies `/` to Vite and `/api/` to backend.

## Secrets

- Never commit `.env.dev` or `.env.release`.
- Never paste actual secret values into docs or summaries.
- Use `.env.dev.example` and `.env.release.example` for documented shape only.
- Prefer `chmod 600` for created local env files.

## Database and migrations

- PostgreSQL 16 is the official dev/prod database.
- Release migrations run as an explicit one-shot job before application startup.
- Migration changes need clean-database and upgrade-path awareness.
- SQLite test success is not enough for PostgreSQL-specific migration behavior.

## Validation

For compose changes:

```bash
docker compose --env-file .env.dev -f compose.dev.yml config
docker compose --env-file .env.release -f compose.release.yml config
```

For runtime changes:

```bash
scripts/dev/smoke_dev.sh
scripts/release/smoke_release.sh
```

For frontend/API edge contracts:

```bash
cd frontend/jubileu-web && npm run check:api-contract
```

## Rollback thinking

- Rollback reuses a previous manifest only when the migration compatibility class permits it.
- Never run downgrade, restore, or production promotion automatically.
- State whether a change affects dev only, isolated RC, or approved public runtime.
