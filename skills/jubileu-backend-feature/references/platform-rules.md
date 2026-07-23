# Platform Rules

This file captures backend/platform constraints for Projeto Jubileu.

## Runtime architecture

Official runtime shape:

```text
Cloudflare -> NGINX -> React SPA + FastAPI /api -> PostgreSQL
```

## Public exposure rules

- NGINX is the only public HTTP entrypoint.
- FastAPI must not be publicly exposed directly in production.
- PostgreSQL must never be publicly exposed.
- Backend endpoints must remain compatible with the `/api` gateway model.
- Frontend data calls must use `/api/...`; SPA navigation routes are separate.

## Authentication and users

The project uses controlled authentication and user management.

Mandatory constraints:

- Browser authentication uses same-origin HttpOnly access/refresh cookies; technical clients may
  use Bearer. Authentication and authorization remain backend-controlled.
- Production requires `APP_ENV=production`, `AUTH_MODE=secure`, short-lived access tokens,
  rotating refresh sessions, signed session-bound CSRF and distinct JWT/refresh HMAC secrets.
- Legacy `X-User-*` headers exist only in development/test and never override cookie or Bearer.
- Do not introduce public registration.
- Do not change refresh, session-family replay or invite semantics without an explicit product
  decision and docs/ADR update.
- RBAC must be enforced in backend.
- Frontend must not be the source of truth for critical authorization.

## Domain/platform coupling rules

- No feature may bypass backend authorization.
- No feature may assume direct DB exposure.
- No feature may require public FastAPI port exposure.
- Any routing change must remain compatible with the NGINX reverse-proxy model.

## Linux host and deployment awareness

Backend changes must remain compatible with:

- environment-variable based configuration;
- internal container networking;
- NGINX reverse proxying;
- PostgreSQL on an internal network;
- migration-driven schema evolution.

## Safe defaults

When uncertain:

- keep auth unchanged;
- keep public exposure unchanged;
- keep `/api` routing assumptions intact;
- prefer backend-enforced access control;
- document infra-sensitive assumptions explicitly.
