# Runbook - PostgreSQL Migrations

## Objetivo

Validar migrations Alembic em PostgreSQL real antes de promover o release `v0.3.0`.

## Comandos

```powershell
cd backend\jubileu-api-fastapi
python -m alembic current
python -m alembic heads
python -m alembic upgrade head
python -m pytest
```

## Criterios

- Existe apenas um Alembic head.
- `alembic upgrade head` passa em banco limpo.
- `alembic upgrade head` passa em banco com dados existentes.
- Dados antigos de evento modo `AULA` permanecem acessiveis como `Evento`.
- `usuarios` existe apos upgrade.

## Risco Principal

Drift entre SQLite de teste e PostgreSQL real, especialmente em enums, defaults e DDL transacional.
