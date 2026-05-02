# Slice 01 - Dev Runtime, PostgreSQL and Migrations

## Contexto

Os testes podem usar SQLite, mas o ambiente de producao usa PostgreSQL. O historico Alembic ja possui merge heads e mudancas relevantes de schema.

## Objetivo

Documentar e validar runtime de desenvolvimento com foco em PostgreSQL e Alembic.

## Escopo

- Fluxo local de PostgreSQL.
- Alembic upgrade em banco limpo.
- Notas de drift schema/model.
- Limites de testes SQLite.

## Fora de Escopo

- Criar migration nova sem demanda de schema.
- Trocar ORM.
- Alterar modelos.

## Arquivos Provaveis

- `docker-compose.yml`
- `backend/jubileu-api-fastapi/alembic/*`
- `backend/jubileu-api-fastapi/.env.example`
- `docs/QUICK_START.md`

## Riscos

- Migration passar em SQLite e falhar em PostgreSQL.
- Variaveis de ambiente divergentes.
- Drift entre `Base.metadata` e migrations.

## Criterios de Aceite

- Banco limpo sobe ate `head`.
- Risco PostgreSQL documentado.
- Variaveis de ambiente consistentes.

## Validacao

- `alembic upgrade head` contra PostgreSQL local.
- Smoke backend apos migration.

## Linear

- CORE: `CORE-1`
- DEV sugerida: `DEV-27`
- Branch sugerida: `dev-27-infra-runtime-gateway-deploy-mvp`
