---
name: jubileu-infra-ops
description: Implement or analyze infrastructure and operations changes for Projeto Jubileu. Use when Codex works on Docker Compose, NGINX, Cloudflare tunnel, env files, deployment scripts, dev/server runtime, ports, health checks, logs, backups, smoke tests, or PostgreSQL/Alembic operational flows.
---

# Jubileu Infra Ops

Use this skill for infrastructure, runtime, deployment, and operational diagnostics.

Read only the references needed:

- Read [`references/infra-map.md`](./references/infra-map.md) to locate compose files, NGINX, scripts, runbooks, env examples, and runtime topology.
- Read [`references/infra-rules.md`](./references/infra-rules.md) before changing public exposure, ports, secrets, gateway routing, database wiring, migrations, or deploy scripts.

## Workflow

1. Identify whether the change targets dev runtime, server runtime, or public Cloudflare/NGINX runtime.
2. Preserve the official topology and `/api` gateway.
3. Keep secrets out of versioned files.
4. Validate compose/nginx/scripts before claiming success.
5. Update runbooks and generated docs when runtime behavior changes.

## Core Commands

Dev runtime:

```bash
docker compose --env-file .env.dev -f compose.dev.yml config
scripts/dev/up_dev.sh
scripts/dev/smoke_dev.sh
scripts/dev/logs_dev.sh
scripts/dev/down_dev.sh
```

Server/runtime:

```bash
docker compose --env-file .env.server -f compose.server.yml config
scripts/server/build_frontend.sh
scripts/server/up_server.sh
LOCAL_BASE_URL=http://127.0.0.1 scripts/server/smoke_server.sh
```

## Core Rules

- Official runtime: Cloudflare -> NGINX -> React SPA + FastAPI `/api` -> PostgreSQL.
- NGINX is the only public entrypoint.
- FastAPI and PostgreSQL must not be publicly exposed in production.
- Dev entrypoint is `http://127.0.0.1:8080`.
- Server local entrypoint is `http://127.0.0.1:80`.
- PostgreSQL in dev/server compose stays on internal Docker networks.
- Version `.env.*.example`, never real `.env.dev` or `.env.server`.
- Do not print or copy secret values into docs, logs, or final summaries.

## Closeout

Report:

- target runtime affected;
- files/scripts changed;
- security/exposure impact;
- smoke/config checks run;
- rollback or operational follow-up.
