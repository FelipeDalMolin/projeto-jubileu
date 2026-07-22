---
name: jubileu-infra-ops
description: Implement or analyze infrastructure and operations changes for Projeto Jubileu. Use when Codex works on Docker Compose, NGINX, Cloudflare tunnel, env files, immutable release runtime, ports, health checks, logs, backups, smoke tests, or PostgreSQL/Alembic operational flows.
---

# Jubileu Infra Ops

Use this skill for infrastructure, runtime, deployment, and operational diagnostics.

Read only the references needed:

- Read [`references/infra-map.md`](./references/infra-map.md) to locate compose files, NGINX, scripts, runbooks, env examples, and runtime topology.
- Read [`references/infra-rules.md`](./references/infra-rules.md) before changing public exposure, ports, secrets, gateway routing, database wiring, migrations, or deploy scripts.

## Workflow

1. Identify whether the change targets dev runtime, isolated RC, or approved production promotion.
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

Release runtime:

```bash
docker compose --env-file .env.release -f compose.release.yml config
scripts/release/smoke_release.sh
scripts/release/backup_release.sh
scripts/release/build_release_bundle.sh release-manifest.json
```

## Core Rules

- Official runtime: Cloudflare -> NGINX -> React SPA + FastAPI `/api` -> PostgreSQL.
- NGINX is the only public entrypoint.
- FastAPI and PostgreSQL must not be publicly exposed in production.
- Dev entrypoint is `http://127.0.0.1:8080`.
- Release NGINX port is explicit through `NGINX_PORT` and bound only to loopback.
- PostgreSQL uses an explicitly named external volume and remains on the internal Docker network.
- Version `.env.*.example`, never real `.env.dev` or `.env.release`.
- Promotable images must use digests; checkout builds and bind mounts are forbidden.
- Do not print or copy secret values into docs, logs, or final summaries.

## Closeout

Report:

- target runtime affected;
- files/scripts changed;
- security/exposure impact;
- smoke/config checks run;
- rollback or operational follow-up.
