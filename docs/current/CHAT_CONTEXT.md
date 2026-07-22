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

- No app-host, trate `/srv/apps/jubileu-dev` como checkout canonico de desenvolvimento. O workspace remoto/VS Code/Codex serve para trabalhar e ver portas expostas, mas PRs acontecem entre branches Git no GitHub.
- Antes de editar, commitar ou rodar checks, confirme que o repo ativo e `/srv/apps/jubileu-dev`; se a sessao estiver em outro diretorio, use `git -C /srv/apps/jubileu-dev ...` ou mude para esse diretorio.
- Fluxo esperado: branch em dev -> editar/testar no ambiente exposto -> commit -> push -> PR -> checks -> merge -> pull/deploy controlado. Nao copiar arquivos manualmente entre `/srv/apps/jubileu-dev`, `/srv/apps/jubileu-prod` e workspaces auxiliares.
- Convergir telas do frontend para APIs reais do backend.
- Preservar `/api` como prefixo de dados do gateway.
- Nao montar aliases de dados sem `/api` nem depender de redirects de barra.
- Manter autorizacao critica no backend conforme `app/modules/auth/policy.py` e a matriz gerada.
- Allowlist publica: health/readiness minimo e login/refresh; demais rotas exigem autenticacao.
- `user` tem leitura e self-service; mutacoes operacionais exigem `admin`, `treinador` ou `auxiliar`.
- Lifecycle canonico usa `POST /api/eventos/{evento_id}/start|end|cancel`; partida usa apenas `POST`
  nos comandos contextuais `start|end`; proxima partida existe somente sob `/api/eventos/{evento_id}`.
- DEV-21 eliminou as facades `app/modules/eventos/service.py` e `_legacy.py`; routers importam
  diretamente as capacidades de Evento e Partida.
- Equipes/snapshots pertencem a `app/modules/eventos/teams.py`; fila, sorteio, seed e proxima partida
  pertencem a `rotation.py`. Em rotacao, adquirir locks sempre como `Evento -> Rotacao -> filhos` e
  tratar conflitos esperados com savepoint, sem rollback global.
- Partidas/estatisticas pertencem a `app/modules/partidas/service.py`; lances pertencem a
  `app/modules/partidas/lances.py`. Ambos bloqueiam Evento antes de filhos.
- Usar Alembic para mudancas de schema.
- Evoluir por slices pequenos, com testes e docs atualizados.
- Para equipes/presenca/workspace, usar: estado local imediato -> persistencia por comando/evento -> polling agora -> WebSocket futuro.
- Antes de concluir feature que muda contratos, rodar o gerador de mapa e atualizar docs vivos.

## Comandos Uteis

```bash
docker compose --env-file .env.dev -f compose.dev.yml up -d
python3 scripts/docs/generate_code_map.py --check
python3 scripts/docs/generate_authorization_matrix.py --check
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
