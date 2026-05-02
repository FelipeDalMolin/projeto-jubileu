# Infra Refactor Overview

## Contexto

Infra passa a ser uma trilha propria para runtime, PostgreSQL, NGINX, gateway e deploy MVP.

`Backend/05-linux-nginx-deploy.md` permanece como historico, mas novos itens operacionais devem entrar nesta pasta.

## Objetivo

Consolidar restricoes e entregas de infraestrutura sem misturar com slices de codigo backend.

## Escopo

- Runtime local e dev.
- PostgreSQL e Alembic.
- NGINX como gateway.
- Deploy MVP.
- Secrets e variaveis de ambiente.

## Fora de Escopo

- Mudancas de negocio.
- Alterar contrato de API.
- Expor FastAPI diretamente.
- Expor PostgreSQL publicamente.

## Arquivos Provaveis

- `docker-compose.yml`
- `backend/jubileu-api-fastapi/.env.example`
- `frontend/jubileu-web/.env.example`
- docs de setup/deploy
- exemplos NGINX/systemd quando aplicavel

## Riscos

- Documentacao divergir do runtime real.
- SQLite mascarar comportamento PostgreSQL.
- Secrets default irem para ambiente real.

## Criterios de Aceite

- Topologia documentada: Cloudflare -> NGINX -> FastAPI -> PostgreSQL.
- `/api` documentado como gateway.
- Ambiente local e deploy MVP possuem checklists claros.

## Validacao

- Conferir links em `docs/refactors/EXECUTION_INDEX.md`.
- Conferir comandos de setup em `docs/QUICK_START.md` e docs correlatas.

## Linear

- CORE: `CORE-1`
- DEV sugerida: `DEV-27`
- Branch sugerida: `dev-27-infra-runtime-gateway-deploy-mvp`
