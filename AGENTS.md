# Projeto Jubileu - Instrucoes Para Agentes

## Contexto

O Projeto Jubileu e uma aplicacao para organizar aulas/eventos de futebol do clube:
jogadores, turmas, dias, eventos, equipes, partidas, lances, estatisticas e dashboards.

Stack oficial:

- Frontend: React + Vite + TypeScript.
- Backend: FastAPI + SQLAlchemy + Alembic.
- Banco: PostgreSQL.
- Desenvolvimento: PostgreSQL via Docker em `compose.dev.yml`.
- Runtime: Cloudflare -> NGINX -> React SPA + FastAPI `/api` -> PostgreSQL.

## Regras Canonicas

- `Evento` e a entidade publica e persistida central.
- `AULA` e somente um valor de `Evento.tipo`.
- Dominio: `Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`.
- Frontend deve chamar dados por `/api/...`.
- Nao reintroduzir `/aulas`, `aula_id`, `aulaId`, `WorkspaceAula`, `TimeAula` ou `JogadorAula` em codigo ativo.
- Migrations historicas podem citar nomes antigos; nao use migrations antigas como linguagem de implementacao nova.

## Workflow De Mudanca

1. Leia primeiro `docs/current/README.md`, `docs/current/DOMAIN_MODEL.md` e `docs/generated/code-map.md`.
2. Para frontend, leia `docs/current/FRONTEND.md` e use `skills/jubileu-frontend-feature/`.
3. Para backend/API, leia `docs/current/API.md` e use `skills/jubileu-backend-feature/`.
4. Para infra/ops, leia `docs/current/INFRASTRUCTURE.md` e use `skills/jubileu-infra-ops/`.
5. Entenda o fluxo ponta a ponta antes de editar: frontend service/page -> backend router -> service -> model/schema -> migration/teste.
6. Para schema, sempre usar Alembic.
7. Para contrato publico, atualizar `docs/current/API.md` e testes.
8. Para qualquer mudanca de rotas, models ou services frontend, rode:

```bash
python3 scripts/docs/generate_code_map.py
```

9. Antes de fechar, rode os checks possiveis no ambiente e declare o que nao foi possivel rodar.

## Areas Sensiveis

- Auth/JWT/RBAC e headers legados.
- `TeamConfig`, `EventoEquipesEstado`, workspace e versoes.
- RSVP/check-in/arrival order.
- Partidas em andamento, lances e bloqueio de encerramento.
- NGINX `/api` e exposicao publica de FastAPI/PostgreSQL.

## Memoria Curta

Use `docs/current/CHAT_CONTEXT.md` como fonte curta para novas conversas e
`docs/current/DOCS_SYNC.md` para manter codigo e documentacao sincronizados.
