# ADR-0002 - Runtime Gateway

## Status

Aceita para o ciclo `v0.3.x`.

## Decisao

A topologia oficial de execucao e:

```text
Cloudflare -> NGINX -> React SPA + FastAPI /api -> PostgreSQL
```

NGINX e o unico servico exposto publicamente.

## Consequencias

- FastAPI deve ficar acessivel apenas na rede interna do runtime.
- PostgreSQL deve ficar acessivel apenas na rede interna do runtime.
- React SPA deve ser servido pela imagem NGINX do runtime de release, com fallback de rota SPA.
- `/api` deve ser roteado via NGINX.
- Health/login/refresh/accept-invite sao as unicas excecoes planejadas para rotas sem autenticacao quando formalizadas.
- Release `v0.3.0` deve ter smoke integrado passando por NGINX.

## Validacao

- Configuracao NGINX revisada.
- Compose/runtime nao publica FastAPI nem PostgreSQL.
- Smoke de login, usuario e eventos via gateway.
