# Contexto Curto Para Chat E Agentes

Use este arquivo como memoria curta do Projeto Jubileu. Para detalhes gerados do codigo,
leia `docs/generated/code-map.md`; para regras de dominio, leia `docs/current/DOMAIN_MODEL.md`.

## Papel Esperado

Atue como arquiteto de software e parceiro de implementacao de uma aplicacao multi-paginas
para organizar aulas/eventos de futebol do clube.

## Stack Oficial

- Frontend: React + Vite + TypeScript.
- Backend: FastAPI + SQLAlchemy + Alembic.
- Banco: PostgreSQL em producao e PostgreSQL via Docker em desenvolvimento.
- Runtime: Cloudflare -> NGINX -> React SPA + FastAPI `/api` -> PostgreSQL.

## Areas De Referencia

- Backend/API: use `skills/jubileu-backend-feature/` e `docs/current/API.md`.
- Frontend: use `skills/jubileu-frontend-feature/` e `docs/current/FRONTEND.md`.
- Infra/ops: use `skills/jubileu-infra-ops/` e `docs/current/INFRASTRUCTURE.md`.

## Dominio Canonico

```text
Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas
```

`Evento` e a entidade publica e persistida central. `AULA` e somente `Evento.tipo = AULA`.
Nao reintroduzir `Aula` como entidade publica, rota publica ou payload novo.

## Regras De Evolucao

- Convergir telas do frontend para APIs reais do backend.
- Preservar `/api` como prefixo de dados do gateway.
- Manter autorizacao critica no backend.
- Usar Alembic para mudancas de schema.
- Evoluir por slices pequenos, com testes e docs atualizados.
- Para equipes/presenca/workspace, usar: estado local imediato -> persistencia por comando/evento -> polling agora -> WebSocket futuro.
- Antes de concluir feature que muda contratos, rodar o gerador de mapa e atualizar docs vivos.

## Comandos Uteis

```bash
docker compose -f compose.dev.yml up -d
python3 scripts/docs/generate_code_map.py --check
cd frontend/jubileu-web && npm run lint && npm run build && npm run check:api-contract
```

Backend local depende de venv ou container. Quando a venv existir:

```bash
cd backend/jubileu-api-fastapi
.venv/bin/python -m pytest -q
.venv/bin/python -m alembic upgrade head
```

## Leitura Prioritaria

1. `docs/current/README.md`
2. `docs/current/DOMAIN_MODEL.md`
3. `docs/current/API.md`
4. `docs/current/FRONTEND.md`
5. `docs/current/INFRASTRUCTURE.md`
6. `docs/generated/code-map.md`
7. `docs/current/DOCS_SYNC.md`
8. `AGENTS.md`
