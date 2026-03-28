# Platform Rules

This file captures the non-negotiable backend/platform constraints of the Jubileu project.

## Runtime architecture

The official runtime shape is:

Cloudflare -> NGINX -> FastAPI -> PostgreSQL

## Public exposure rules

- NGINX is the only public HTTP entrypoint.
- FastAPI must not be publicly exposed directly.
- PostgreSQL must never be publicly exposed.
- Backend endpoints must remain compatible with the `/api` gateway model.

## Authentication and users

The project uses controlled authentication and user management.

### Mandatory constraints
- JWT-based authentication
- refresh flow preserved
- invite-based onboarding
- no public register flow
- RBAC enforced in backend
- frontend must not be the source of truth for critical authorization

### User model direction
The backend must preserve the user/auth domain while evolving sports/event features.
Changes affecting users, roles, invite flow, or auth endpoints must be treated as high-risk.

## Domain/platform coupling rules

- No feature may bypass backend authorization.
- No feature may assume direct DB exposure.
- No feature may require public FastAPI port exposure.
- Any routing change must remain compatible with the NGINX reverse-proxy model.

## Linux host and deployment awareness

The project is intended to run on a Linux host with containerized services.
That means backend changes must remain compatible with:
- environment-variable based configuration
- internal container networking
- NGINX reverse proxying
- PostgreSQL on internal network
- migration-driven schema evolution

## Safe defaults

When uncertain:
- keep auth unchanged
- keep public exposure unchanged
- keep `/api` routing assumptions intact
- prefer backend-enforced access control
- document infra-sensitive assumptions explicitly