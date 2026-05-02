# Slice 02 - NGINX API Gateway

## Contexto

O contrato de plataforma exige Cloudflare -> NGINX -> FastAPI -> PostgreSQL.

## Objetivo

Documentar NGINX como unico entrypoint publico e garantir roteamento de `/api`.

## Escopo

- Reverse proxy para frontend.
- Reverse proxy para `/api`.
- Health checks.
- Headers relevantes.
- Notas de CORS e ambiente local vs producao.

## Fora de Escopo

- Expor FastAPI diretamente.
- Expor PostgreSQL.
- Redesenhar autenticacao.

## Arquivos Provaveis

- docs de deploy Linux/NGINX
- exemplos de configuracao NGINX
- exemplos `.env`

## Riscos

- Frontend chamar backend fora do gateway.
- CORS mascarar configuracao de proxy incorreta.
- Health endpoint nao representar dependencias reais.

## Criterios de Aceite

- `/api` roteado via NGINX.
- FastAPI permanece interno.
- PostgreSQL permanece interno.

## Validacao

- Smoke de `/health`.
- Smoke de rota `/api`.
- Revisao de configuracao NGINX.

## Linear

- CORE: `CORE-1`
- DEV sugerida: `DEV-27`
- Branch sugerida: `dev-27-infra-runtime-gateway-deploy-mvp`
