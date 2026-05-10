> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Slice 04 - JWT Auth and RBAC

## Intent

Introduce JWT authentication and keep backend-enforced RBAC as source of truth, while preserving temporary legacy header compatibility.

## Auth contracts

- `POST /api/auth/login`
  - input: `{ "username": "...", "password": "..." }`
  - output: `{ "access_token": "...", "token_type": "bearer", "expires_in": <seconds> }`
- `GET /api/auth/me`
  - supports `Authorization: Bearer <token>`
  - supports legacy headers in compatibility mode
  - output: `{ "user_id": "...", "role": "...", "jogador_id": <int|null> }`

## Compatibility mode

- `AUTH_MODE=legacy`:
  - only legacy headers (`X-User-Id`, `X-Role`, `X-Jogador-Id`)
- `AUTH_MODE=jwt_compat` (default):
  - prefer Bearer JWT
  - fallback to legacy headers
- `AUTH_MODE=jwt_only`:
  - only Bearer JWT

## RBAC

- Role enforcement remains backend-side with `require_roles`.
- Existing protected event commands continue to enforce role checks.

## Deferred cleanup (intentional)

- Legacy headers are still accepted in compatibility mode.
- No public register endpoint introduced.
- `app/deps_auth.py` remains as a compatibility re-export surface.
