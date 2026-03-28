# Target Architecture

This file describes the desired backend architecture for the Jubileu API as the project matures beyond the current layer-by-type organization.

## Scope

This architecture applies to the backend application internals, especially under:

`backend/jubileu-api-fastapi/app/`

It does not replace the repository-level layout such as:
- `skills/`
- `docs/`
- `backend/`
- `frontend/`
- `infra/`

## Target backend layout

```text
app/
  core/
    config.py
    security.py
  db/
    base.py
    session.py
  modules/
    auth/
      models.py
      schemas.py
      service.py
      routes.py
    usuarios/
      models.py
      schemas.py
      service.py
      routes.py
    jogadores/
      models.py
      schemas.py
      service.py
      routes.py
    eventos/
      models.py
      schemas.py
      service.py
      routes.py
    partidas/
      models.py
      schemas.py
      service.py
      routes.py
    estatisticas/
      models.py
      schemas.py
      service.py
      routes.py