# Infraestrutura Atual

Este documento resume a infraestrutura viva do Projeto Jubileu. Runbooks detalhados ficam em
`docs/runbooks/` e contexto operacional em `docs/ops/`.

## Topologia Oficial

```text
Cloudflare -> NGINX -> React SPA + FastAPI /api -> PostgreSQL
```

Regras:

- NGINX e o unico entrypoint publico.
- FastAPI nao deve expor porta publica em producao.
- PostgreSQL nao deve expor porta publica.
- `/api` e o prefixo de dados do backend pelo gateway.

## Desenvolvimento Via Docker

Arquivo principal: `compose.dev.yml`.

O antigo `docker-compose.yml`, que publicava PostgreSQL no host, foi removido. Scripts e
operadores devem informar sempre `--env-file .env.dev -f compose.dev.yml`.

Servicos:

- `postgres-dev`: PostgreSQL 16 em rede interna Docker.
- `backend`: FastAPI, Alembic e Uvicorn em container.
- `frontend-dev`: Vite em container Node.
- `nginx-dev`: gateway local.

Portas locais:

- `127.0.0.1:8080`: entrada principal de desenvolvimento.
- `127.0.0.1:5173`: Vite direto para debug.
- `127.0.0.1:8000`: FastAPI direto para debug.
- PostgreSQL nao e publicado no host no compose dev oficial.

Comandos:

```bash
scripts/dev/up_dev.sh
scripts/dev/status_dev.sh
scripts/dev/logs_dev.sh
scripts/dev/smoke_dev.sh
scripts/dev/down_dev.sh
```

## Runtime De Release Imutavel

`compose.release.yml` e o unico runtime promovivel. `compose.server.yml`, `.env.server` e os
scripts que compilavam ou faziam pull a partir de checkout foram descontinuados. O Compose recebe
`BACKEND_IMAGE` e `FRONTEND_IMAGE` completos com `@sha256:...`, nao possui build ou bind mount e
exige `POSTGRES_VOLUME_NAME` apontando para um volume externo criado pelo operador. Migration e
executada explicitamente como job one-shot antes da API; `/api/ready` impede que uma API com schema
incorreto seja considerada pronta.

Somente o NGINX publica `127.0.0.1:${NGINX_PORT}:80`. API e PostgreSQL usam apenas a rede interna.
RC e producao devem consumir o mesmo par de digests registrado em `release-manifest.json`; rebuild
no servidor nao e promocao valida.

Desde `v0.3.0`, a stack produtiva e operada em `/srv/ops/stacks/jubileu-v03`, com project name
`jubileu-v03`, volume externo `jubileu_prod_db_data` e NGINX em loopback `127.0.0.1:80`. O checkout
`/srv/apps/jubileu-prod` permanece somente como runtime anterior preservado; nao recebe pull,
edicao ou build durante a promocao por digest.

Sequencia operacional minima:

```bash
docker volume create "$POSTGRES_VOLUME_NAME"
docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file .env.release \
  -f compose.release.yml up -d --wait jubileu-db
docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file .env.release \
  -f compose.release.yml run --rm migration
docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file .env.release \
  -f compose.release.yml up -d --wait jubileu-api nginx
scripts/release/smoke_release.sh
```

`scripts/release/build_release_bundle.sh` gera um pacote sem segredos com Compose, manifesto,
scripts, runbooks e `SHA256SUMS`. `backup_release.sh`, `restore_release.sh` e
`rehearse_restore_rollback.sh` implementam backup custom-format, restore isolado e ensaio de
compatibilidade sem downgrade ou restore automatico.

## NGINX

- `infra/nginx/jubileu.dev.conf`: proxy `/api/` para `backend:8000` e `/` para Vite.
- `infra/nginx/jubileu.conf`: serve React estatico, faz fallback SPA e proxy `/api/`.
- `/health` testa apenas que o processo backend esta vivo.
- `/api/health` testa caminho de API pelo gateway.
- `/api/ready` comprova PostgreSQL acessivel e revisao Alembic esperada.
- `/api/ready` expoe somente `status`; detalhes de falha permanecem nos logs.
- `/api/version` e autenticado e informa release ref, SHA Git, digests e revisao de schema.
- Colecoes canonicas (`/api/dias`, `/api/jogadores`, `/api/turmas`) nao usam barra final.
- NGINX nao cria redirects de contrato antes da autenticacao.
- O root FastAPI e a documentacao OpenAPI ficam desabilitados em producao.

## Ambientes E Segredos

- Versionar somente `.env.dev.example` e `.env.release.example`.
- Nunca versionar `.env.dev`, `.env.release` ou segredos reais.
- Nao copiar valores reais de secrets para documentacao, issues, PRs ou respostas.
- Arquivos locais de env devem permanecer ignorados e preferencialmente com permissao restrita.
- Producao exige `APP_ENV=production`, `AUTH_MODE=secure`, cookies seguros e segredos distintos para JWT e digest HMAC de refresh.
- O backend falha no startup quando a configuracao de auth de producao usa defaults, placeholders ou modo invalido.
- Antes de promover uma migration que desative contas padrao, o operador deve provar uma conta
  administrativa nao padrao e ativa. Credenciais operacionais ficam fora do Git em arquivo `0600`;
  nenhuma senha aparece em logs, manifesto, bundle ou documentacao.

## Banco E Migrations

- PostgreSQL 16 e o banco oficial de dev/prod.
- Alembic e obrigatorio para alteracao de schema.
- Testes SQLite podem apoiar regras, mas nao substituem validacao PostgreSQL para migration, enum, default ou nullable.

## Validacao

Config compose:

```bash
docker compose --env-file .env.dev -f compose.dev.yml config
cp .env.release.example .env.release
docker compose --env-file .env.release -f compose.release.yml config
```

No CI, `Compose + Shell` tambem executa `bash -n` e ShellCheck 0.10.0 de forma deterministica.

Smoke dev:

```bash
scripts/dev/smoke_dev.sh
```

Smoke de release:

```bash
SMOKE_USERNAME="$JUBILEU_SMOKE_USERNAME" SMOKE_PASSWORD="$JUBILEU_SMOKE_PASSWORD" \
  RELEASE_BASE_URL=http://127.0.0.1:"$NGINX_PORT" scripts/release/smoke_release.sh
```

Na promocao de `v0.3.0`, o smoke conferiu RC5, SHA, digests, schema `0020`, frontend, readiness e
portas privadas. A observacao subsequente coletou 31 amostras em 15 minutos e registrou zero `5xx`
na API e no NGINX.

Contrato frontend/API:

```bash
cd frontend/jubileu-web
npm run check:api-contract
```

## Runbooks Relacionados

- `docs/runbooks/dev-compose.md`
- `docs/runbooks/cloudflare-tunnel.md`
- `docs/runbooks/postgres-migrations.md`
- `docs/runbooks/release-v03.md`
- `docs/runbooks/setup-linux.md`
- `docs/runbooks/setup-windows.md`
- `docs/ops/observabilidade.md`
- `docs/ops/wsl-incidentes.md`
