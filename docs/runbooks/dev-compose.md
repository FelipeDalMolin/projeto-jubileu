# Dev Compose no app-host

Use `compose.dev.yml` para rodar o Jubileu no WSL `app-host` sem depender de Node ou Python globais do WSL.

## Stack

- `postgres-dev`: PostgreSQL 16 apenas na rede interna Docker, sem `ports` no host.
- `backend`: FastAPI via imagem Python do Dockerfile do backend, conectado ao banco por `postgres-dev:5432`.
- `frontend-dev`: Vite em container Node, publicado em `127.0.0.1:5173`.

O backend tambem publica `127.0.0.1:8000` para debug local. O Postgres nao e publicado no host.

## Configuracao

Os valores padrao de desenvolvimento ficam documentados em `.env.dev.example`. Para overrides locais:

```sh
cp .env.dev.example .env.dev
```

Nao coloque segredos reais em `.env.dev.example` e nao reutilize dados de producao no banco dev.

## Validacao estatica

```sh
docker compose -f compose.dev.yml config
```

## Execucao

Quando autorizado a subir containers:

```sh
docker compose --env-file .env.dev -f compose.dev.yml up --build
```

A aplicacao web ficara em `http://127.0.0.1:5173`. O frontend usa o proxy `/api` do Vite para falar com `http://backend:8000` dentro da rede Docker.
