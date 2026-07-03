# Dev Compose no app-host

Use `compose.dev.yml` para rodar o Jubileu no WSL `app-host` sem depender de Node ou Python globais do WSL.

## Stack

- `postgres-dev`: PostgreSQL 16 apenas na rede interna Docker, sem `ports` no host.
- `backend`: FastAPI via imagem Python do Dockerfile do backend, conectado ao banco por `postgres-dev:5432`.
- `frontend-dev`: Vite em container Node, usado pelo NGINX dev e publicado em `127.0.0.1:5173` para debug direto.
- `nginx-dev`: gateway local em `127.0.0.1:8080`, roteando `/api` para o backend e `/` para o Vite.

O backend tambem publica `127.0.0.1:8000` para debug local. O Postgres nao e publicado no host. Use `http://127.0.0.1:8080` como entrada principal do navegador para exercitar um caminho mais parecido com producao.

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

A aplicacao web ficara em `http://127.0.0.1:8080`. O NGINX dev encaminha `/api` para `http://backend:8000` dentro da rede Docker e encaminha as demais rotas para `http://frontend-dev:5173`.

As portas diretas continuam disponiveis para investigacao:

- Frontend Vite: `http://127.0.0.1:5173`
- Backend FastAPI: `http://127.0.0.1:8000`
