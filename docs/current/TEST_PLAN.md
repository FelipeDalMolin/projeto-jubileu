# Plano canonico de testes e rastreabilidade

## Estado analisado

- Repositorio: `FelipeDalMolin/projeto-jubileu`
- Base integrada: `origin/jubileu-v2`
- Branch final de docs/validacao: `dev-41-docs-validacao-final`
- Marco tecnico de runtime/API analisado: `94d4f45 chore(server): enable init for api container`
- Base local deste PR2: `4ec4284 ci: adiciona gate minimo e atualiza evidencias`
- Data desta revisao: 2026-06-09
- Escopo desta entrega: PR2 empilhado sobre `4ec4284 ci: adiciona gate minimo e atualiza evidencias`, adicionando coverage backend, preflight Playwright diagnosticavel e evidencias locais sem aprovar E2E completo.
- Fora de escopo: models, migrations, regras de dominio, RBAC definitivo e refatoracao visual/UI.

Atualizacao DEV-41 smoke em 2026-07-04:

- Branch de validacao: `dev-41-smoke-validacao-final`.
- Ambiente: compose dev em `/srv/apps/jubileu-dev`, com frontend em `frontend-dev:5173`, backend em `backend:8000` e NGINX dev em `127.0.0.1:8080`.
- Playwright passou a aceitar `E2E_CHROMIUM_EXECUTABLE_PATH` para rodar com Chromium nativo em container Alpine.
- No container `jubileu-dev-frontend-dev-1`, a execucao browser foi validada com Chromium do Alpine em `/usr/bin/chromium-browser`.
- `dev41-smoke.spec.ts` validou `DEV-39` e `DEV-32`: login, `/usuario`, chamada `/api/usuarios/me`, erro 503 operacional e ausencia de flood apos o erro.
- Contratos `/api`, login e dashboard foram reexecutados em suite curta E2E com `5 passed`.

O marco tecnico de runtime/API de referencia permanece `94d4f45 chore(server): enable init for api container`. Esse commit e hardening operacional: adiciona `init: true` ao container `jubileu-api` em `compose.server.yml` e nao altera regras de negocio, models, migrations, contratos publicos, UI ou cobertura funcional UC/CT. O PR1 local `4ec4284 ci: adiciona gate minimo e atualiza evidencias` criou o gate minimo GitHub Actions e atualizou evidencias documentais. O commit documental anterior e `a5c74dd Ajuste Roadmap`; a ultima entrega tecnica de testes e automacao continua sendo `4d51fdf test(e2e): estrutura Playwright e evidencias UC CT`; o marco de contrato `/api`, `/api/health`, `X-Request-ID`, smoke/contract backend, `apiClient` e `check:api-contract` permanece em `fe06768 Ajuste em routes da API`.

Esta revisao PR2 adicionou `coverage` como dependencia de auditoria/testes, moveu o full pytest do CI backend para `coverage run --branch` + `coverage report -m`, tornou o servidor Playwright previsivel com `--strictPort` e criou um job `playwright-preflight` nao bloqueante. Isso nao comprovava cobertura funcional completa dos casos de uso. A atualizacao DEV-41 de 2026-07-04 comprova E2E browser no compose dev para smoke `/usuario`, contratos `/api`, login e dashboard; os demais fluxos continuam dependendo de fixtures/dados preparados. Vercel nao e gate oficial de qualidade nem runtime oficial do projeto; pode aparecer apenas como resquicio historico de integracao externa.

## Casos de uso macro

| ID | Caso de uso | Objetivo |
|---|---|---|
| UC01 | Autenticar usuario/perfil | Validar login, identidade, perfil e autorizacao basica. |
| UC02 | Manter jogadores | Validar cadastro, consulta e manutencao de jogadores. |
| UC03 | Manter turmas/vinculos | Validar cadastro de turmas e vinculos jogador-turma. |
| UC04 | Consultar/criar dias | Validar consulta, criacao implicita e relacao dia-evento. |
| UC05 | Criar/agendar evento/aula | Validar criacao, tipo, agenda e ciclo inicial de evento/aula. |
| UC06 | Registrar presencas/check-in/RSVP | Validar RSVP, check-in, check-out, cancelamento e presenca. |
| UC07 | Formar equipes | Validar equipes, rotacao, filas, proximos times e snapshots. |
| UC08 | Criar e operar partidas | Validar criacao/seed, inicio, encerramento e gates de partida. |
| UC09 | Registrar lances/estatisticas | Validar lances, filtros, placar e estatisticas de jogo. |
| UC10 | Consultar dashboards/indicadores | Validar dashboards e indicadores agregados. |

## Command Safety

Todo PR que altera comando mutavel deve avaliar concorrencia, retry e duplo clique conforme
`docs/current/COMMAND_SAFETY.md`.

Casos obrigatorios quando o fluxo for tocado:

- CT-CS-01: duplo create nao gera recurso duplicado incoerente.
- CT-CS-02: retry com mesmo `client_event_id` ou idempotency key retorna o recurso existente.
- CT-CS-03: snapshot com `expected_version` stale retorna `409 version_conflict`.
- CT-CS-04: dois operadores alterando fila/equipes/rotacao nao sobrescrevem silenciosamente.
- CT-CS-05: upsert ou constraint preserva uma linha por recurso naturalmente unico.
- CT-CS-06: check-in/arrival order preserva participante unico e ordem estavel.

## Playwright / E2E

A camada Playwright foi adicionada ao frontend para validar experiencia de usuario e integracao browser -> Vite -> `/api` -> backend. Ela complementa, mas nao substitui, os testes `pytest`: seed por API prepara cenario, mas nao conta como cobertura E2E de fluxo de usuario.

### Comandos reproduziveis

```bash
cd frontend/jubileu-web
npm install
npm run lint
npm run build
npm run check:api-contract
npx playwright install
npm run test:e2e
```

No container dev Alpine usado no app-host, use Chromium nativo para evitar o binario glibc baixado pelo Playwright:

```bash
docker exec jubileu-dev-frontend-dev-1 sh -lc 'apk add --no-cache chromium'
docker exec jubileu-dev-frontend-dev-1 sh -lc 'E2E_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser E2E_REUSE_EXISTING_SERVER=1 E2E_BASE_URL=http://frontend-dev:5173 E2E_API_URL=http://backend:8000 npm run test:e2e -- --project=chromium e2e/dev41-smoke.spec.ts --reporter=list'
```

Variaveis e modos:

- `E2E_BASE_URL`: URL do frontend, fallback `http://127.0.0.1:5173`.
- `E2E_API_URL`: URL explicita da API; se definida, tem precedencia sobre o modo.
- `E2E_RUNTIME_MODE=nginx`: usa runtime local NGINX em `http://127.0.0.1`, com API sob `/api`.
- `E2E_CHROMIUM_EXECUTABLE_PATH`: caminho opcional para Chromium nativo do sistema/container.
- Modo dev local: Vite em `127.0.0.1:5173` e FastAPI direto em `localhost:8000`.
- Runtime local/Cloudflare/NGINX: NGINX em porta 80 e API sob `/api`.
- `E2E_REUSE_EXISTING_SERVER=1`: permite reutilizar um Vite existente; por padrao o Playwright sobe servidor novo com `--strictPort`.

`https://app.jubileuweb.com` deve ser usado para smoke/validacao manual publica. Nao usar esse ambiente para seed destrutivo de E2E automatizado.

### Specs criadas

| Spec | UC/CT alvo | Status nesta revisao | Observacao |
|---|---|---|---|
| `contract.spec.ts` | E2E-CONTRACT; `/api/health`, `X-Request-ID`, ausencia de `/api/api` | passed-e2e-dev | Passou no compose dev via `frontend-dev:5173` -> `/api` -> `backend:8000`. |
| `dev41-smoke.spec.ts` | DEV-39 `/usuario`; DEV-32 erro sem flood | passed-e2e-dev | Cobre login, `/usuario`, `/api/usuarios/me`, erro 503 controlado e estabilidade de chamadas apos erro. |
| `uc01-login.spec.ts` | UC01 login/sessao/navegacao protegida | passed-e2e-dev | Passou no compose dev com Chromium nativo do Alpine. |
| `uc02-uc03-cadastros.spec.ts` | UC02 jogador; UC03 turma | created-e2e/blocked-e2e | Specs criadas; testes criam jogador/turma pela UI quando API esta saudavel. |
| `uc04-uc05-dia-evento.spec.ts` | UC04 dia; UC05 evento/aula | created-e2e/blocked-e2e | Spec criada; seed por API prepara turma/dia e criacao do evento e feita pela UI. |
| `uc06-uc09.spec.ts` | UC06 a UC09 | pending | Specs `test.skip` com motivo: exigem fixtures completas de participantes, equipes, partidas e lances. |
| `uc10-dashboard.spec.ts` | UC10 dashboard/indicadores | passed-e2e-dev | Passou no compose dev apos aquecimento do Vite/dashboard. |

### Status E2E por UC

| UC | Status E2E | Leitura |
|---|---|---|
| UC01 | passed-e2e-dev | Login UI e navegacao protegida passaram no compose dev. |
| UC02 | created-e2e/blocked-e2e | Spec criada para cadastro UI de jogador; depende de browser e API local. |
| UC03 | created-e2e/blocked-e2e | Spec criada para cadastro UI de turma; depende de browser e API local. |
| UC04 | created-e2e/blocked-e2e | Spec criada para abrir dia; depende de browser e API local. |
| UC05 | created-e2e/blocked-e2e | Spec criada para criar evento/aula pela UI; depende de browser e API local. |
| UC06 | pending | Fluxo UI de presenca/check-in requer fixture completa e estabilizacao futura. |
| UC07 | pending | Fluxo UI de equipes/rotacao requer fixture completa e criterios de testabilidade. |
| UC08 | pending | Fluxo UI de partida requer fixture completa de equipes/partida. |
| UC09 | pending | Fluxo UI de lances requer partida em andamento e jogadores elegiveis. |
| UC10 | passed-e2e-dev | Dashboard renderiza indicadores ou estado operacional esperado no compose dev. |

Motivos conhecidos de E2E parcial neste ambiente: os fluxos UC02-UC05 criam dados e devem ser rodados somente quando a base de teste estiver preparada; UC06-UC09 seguem com `test.skip` por dependerem de fixtures completas. O browser Playwright baixado automaticamente usa binario glibc e nao roda bem no container Alpine; para o compose dev, usar `apk add --no-cache chromium` e `E2E_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser`. O caminho browser via NGINX dev (`http://nginx-dev`) exige `nginx-dev` em `server.allowedHosts`; para E2E de produto no container, o caminho mais estavel validado e `frontend-dev:5173` com proxy `/api` para `backend:8000`, enquanto o NGINX dev e validado por `scripts/dev/smoke_dev.sh`.

## Atualizacao do ultimo commit

| Commit | Tipo | Impacto na matriz UC/CT | Status |
|---|---|---|---|
| `4ec4284 ci: adiciona gate minimo e atualiza evidencias` | CI/documentacao | Cria gate minimo GitHub Actions, atualiza roadmap/plano/runbook e declara Cloudflare/NGINX como runtime oficial. | workflow criado/aguardando execucao |
| `94d4f45 chore(server): enable init for api container` | hardening operacional | Adiciona `init: true` ao container `jubileu-api`; nao muda regra de negocio, contrato, UI ou suite de testes. | partial |
| `a5c74dd Ajuste Roadmap` | documentacao | Atualiza `docs/current/ROADMAP.md`; documentacao nao conta como cobertura automatizada. | partial |
| `4d51fdf test(e2e): estrutura Playwright e evidencias UC CT` | automacao de testes | Adiciona Playwright, helpers, specs iniciais, `data-testid` minimos e evidencias E2E blocked por ambiente. | created-e2e/blocked-e2e |
| `fe06768 Ajuste em routes da API` | contrato/API | Consolida `/api`, `/api/health`, `X-Request-ID`, smoke/contract backend, `apiClient` e `check:api-contract`. | covered-api/covered-contract |

## Matriz UC -> CT -> teste -> evidencia

| ID do caso de uso | Nome do caso de uso | Objetivo | Casos de teste associados | Tipo de teste | Arquivo de teste | Comando de execucao | Status | Evidencia | Observacoes |
|---|---|---|---|---|---|---|---|---|---|
| UC01 | Autenticar usuario/perfil | Login, perfil, vinculo de jogador e autorizacao. | CT-01 login e `/api/auth/me` com bearer; CT-02 compatibilidade headers legados; CT-03 perfil `/api/usuarios/me`; CT-03A salvar/limpar `jogador_id` em `/api/usuarios/me/jogador`; CT-03B rejeitar jogador inexistente; CT-03C RBAC de inicio de evento. | integracao API, e2e | `test_auth_jwt_rbac.py`, `test_usuarios_api.py`; `uc01-login.spec.ts`, `dev41-smoke.spec.ts` | `python -m pytest -q -m uc01`; `npm run test:e2e` | covered-api/passed-e2e-dev | Incluido na suite backend atual; E2E dev passou para login e `/usuario`. | Cobertura backend inclui o vinculo persistido de jogador e o browser foi validado no compose dev com Chromium nativo do Alpine. |
| UC02 | Manter jogadores | Cadastro e consulta de jogadores. | CT-04 alias/listagem `/jogadores/` e `/api/jogadores/`; CT-05 criacao de jogador no fluxo MVP; CT-06 update/delete/validacoes negativas. | contrato, integracao API, e2e | `test_api_standardization_aliases.py`, `test_mvp_flow.py`; `uc02-uc03-cadastros.spec.ts` | `python -m pytest -q -m uc02`; `npm run test:e2e` | covered-contract/partial/created-e2e/blocked-e2e | `test_mvp_flow.py` pula sem `DATABASE_URL_TEST`; alias roda no full pytest; spec UI criada. | CT-06 permanece pending. |
| UC03 | Manter turmas/vinculos | Cadastro de turma e vinculos jogador-turma. | CT-07 criacao de turma no fluxo MVP; CT-08 contrato/listagem `/api/turmas`; CT-09 adicionar/remover vinculos de turma. | contrato, integracao API, e2e | `test_mvp_flow.py`, `test_smoke_api.py`; `uc02-uc03-cadastros.spec.ts` | `python -m pytest -q -m uc03`; `npm run test:e2e` | covered-contract/partial/created-e2e/blocked-e2e | Teste funcional de turma depende de `DATABASE_URL_TEST`; spec UI criada. | CT-09 permanece pending; smoke de rota nao comprova fluxo funcional. |
| UC04 | Consultar/criar dias | Consulta e criacao implicita de dia. | CT-10 get-or-create de dia por `data_iso`; CT-11 alias `/dias` e `/api/dias`; CT-12 servico `get_evento_no_dia_or_404`. | contrato, unitario, integracao API, e2e | `test_api_standardization_aliases.py`, `test_slice02_services.py`, `test_mvp_flow.py`; `uc04-uc05-dia-evento.spec.ts` | `python -m pytest -q -m uc04`; `npm run test:e2e` | covered-api/covered-contract/partial/created-e2e/blocked-e2e | Alias e service cobertos no full pytest; fluxo MVP de dia fica skipped sem `DATABASE_URL_TEST`; spec UI criada. | Ainda falta negativo funcional completo de data/agenda. |
| UC05 | Criar/agendar evento/aula | Criacao, tipo, agenda e inicio de evento. | CT-13 criar evento/aula; CT-14 regras de tipo (`JOGO_LIVRE` sem turma e `AULA` com turma); CT-15 inicio autorizado/status; CT-16 validacoes temporais de agenda. | integracao API, unitario, e2e | `test_mvp_flow.py`, `test_auth_jwt_rbac.py`, `test_eventos_api.py`, `test_partidas_lifecycle_api.py`, `test_slice02_services.py`, `test_workspace_evento.py`; `uc04-uc05-dia-evento.spec.ts` | `python -m pytest -q -m uc05`; `npm run test:e2e` | covered-api/partial/created-e2e/blocked-e2e | Comando agrupado `python -m pytest -q -m "uc05 or uc06 or uc07"`: `19 passed, 2 skipped, 24 deselected`; spec UI criada. | CT-16 permanece pending; criacao detalhada depende parcialmente de `DATABASE_URL_TEST`. |
| UC06 | Registrar presencas/check-in/RSVP | RSVP, check-in, check-out e presenca. | CT-17 RSVP; CT-18 check-in/check-out/cancelamento; CT-19 check-in por treinador e ordem de presentes invalida; CT-20 negativos de duplicidade/estado. | integracao API, e2e pending | `test_eventos_api.py`; `uc06-uc09.spec.ts` | `python -m pytest -q -m uc06`; `npm run test:e2e` | covered-api/partial/pending | Coberto no comando agrupado: `19 passed, 2 skipped, 24 deselected`; E2E marcado `test.skip`. | CT-20 permanece pending se exigir duplicidade/estado especifico. |
| UC07 | Formar equipes | Equipes, rotacao, fila e snapshots. | CT-21 estado de equipes/snapshot; CT-22 estado de rotacao e indicadores; CT-23 preview/confirmacao de sorteio; CT-24 update de fila/proximos times/team size; CT-25 reconciliacao e avisos de times. | integracao API, e2e pending | `test_mvp_flow.py`, `test_eventos_api.py`, `test_eventos_rotacao_api.py`, `test_workspace_evento.py`; `uc06-uc09.spec.ts` | `python -m pytest -q -m uc07`; `npm run test:e2e` | covered-api/partial/pending | Parte de CT-21 fica skipped sem `DATABASE_URL_TEST`; demais rodam em SQLite in-memory; E2E marcado `test.skip`. | Fixtures completas ainda pendentes. |
| UC08 | Criar e operar partidas | Seed, inicio, encerramento e gates. | CT-26 seed/criacao de partida; CT-27 start/end; CT-28 negativos de lifecycle; CT-29 finalizar evento com partida ativa/reconciliacao. | integracao API, e2e pending | `test_eventos_api.py`, `test_partidas_lifecycle_api.py`, `test_workspace_evento.py`; `uc06-uc09.spec.ts` | `python -m pytest -q -m uc08`; `npm run test:e2e` | covered-api/pending | Incluido no full pytest: `44 passed, 2 skipped`; E2E marcado `test.skip`. | UI E2E requer fixture completa de equipes/partida. |
| UC09 | Registrar lances/estatisticas | Lances, filtros, placar e estatisticas. | CT-30 registrar e consultar lances; CT-31 filtros invalidos; CT-32 conversao/rejeicao de jogador; CT-33 placar e estatisticas em service/workspace. | unitario, integracao API, e2e pending | `test_eventos_api.py`, `test_partidas_lifecycle_api.py`, `test_slice02_services.py`, `test_workspace_evento.py`; `uc06-uc09.spec.ts` | `python -m pytest -q -m uc09`; `npm run test:e2e` | covered-api/pending | Incluido no full pytest: `44 passed, 2 skipped`; E2E marcado `test.skip`. | UI E2E requer partida em andamento e jogadores elegiveis. |
| UC10 | Consultar dashboards/indicadores | Dashboards e indicadores agregados. | CT-34 contratos de rotas de dashboard e KPIs agregados de workspace; CT-35 dashboard funcional com dados reais. | contrato, integracao API, e2e | `test_api_standardization_aliases.py`, `test_workspace_evento.py`; `uc10-dashboard.spec.ts` | `python -m pytest -q -m uc10`; `npm run test:e2e` | covered-contract/partial/passed-e2e-dev | KPIs de workspace rodam no full pytest; dashboard passou no compose dev renderizando indicadores ou estado operacional esperado. | CT-35 ainda pode crescer com cenarios de dados reais mais ricos. |

## Validacao manual publica

Validacao manual em `https://app.jubileuweb.com` e evidencia operacional complementar. Ela nao substitui `pytest`, contrato frontend/API, GitHub Actions ou smoke server. Todos os UCs permanecem `manual-pending` ate haver gravacao, print ou log auditavel associado.

| UC | Fluxo publico esperado | URL base | Status | Evidencia exigida |
|---|---|---|---|---|
| UC01 | Login, sessao e perfil basico. | `https://app.jubileuweb.com` | manual-pending | Print/gravacao do login e chamadas `/api/auth/me` ou `/api/usuarios/me`. |
| UC02 | Cadastro/consulta de jogadores. | `https://app.jubileuweb.com` | manual-pending | Print/gravacao de criacao/listagem e request `/api/jogadores/...`. |
| UC03 | Cadastro de turmas e vinculos. | `https://app.jubileuweb.com` | manual-pending | Print/gravacao de turma/vinculo e request `/api/turmas/...`. |
| UC04 | Consulta/criacao implicita de dia. | `https://app.jubileuweb.com` | manual-pending | Print/gravacao de dia aberto e request `/api/dias/...`. |
| UC05 | Criacao/agendamento de Evento do tipo `AULA`. | `https://app.jubileuweb.com` | manual-pending | Print/gravacao do evento criado e request `/api/dias/{data_iso}/eventos`. |
| UC06 | RSVP, check-in, check-out e presenca. | `https://app.jubileuweb.com` | manual-pending | Print/gravacao do fluxo de presenca/check-in. |
| UC07 | Formacao de equipes e rotacao. | `https://app.jubileuweb.com` | manual-pending | Print/gravacao de equipes/fila/rotacao. |
| UC08 | Criacao, inicio e encerramento de partida. | `https://app.jubileuweb.com` | manual-pending | Print/gravacao de partida ativa e encerrada. |
| UC09 | Registro de lances e estatisticas. | `https://app.jubileuweb.com` | manual-pending | Print/gravacao de lance e placar/estatisticas. |
| UC10 | Dashboard e indicadores agregados. | `https://app.jubileuweb.com` | manual-pending | Print/gravacao de indicadores com dados reais ou estado operacional esperado. |

## Testes existentes, planejados, pendentes e bloqueados

### Ja existentes

- Backend `pytest` com 46 itens coletados em `backend/jubileu-api-fastapi/tests`.
- Testes de smoke/startup: `test_smoke_api.py`.
- Testes de contrato/API: `test_api_standardization_aliases.py` e parte de `test_smoke_api.py`.
- Testes de dominio/eventos: `test_eventos_api.py`, `test_eventos_rotacao_api.py`, `test_partidas_lifecycle_api.py`, `test_workspace_evento.py`.
- Testes de auth/perfil: `test_auth_jwt_rbac.py`, `test_usuarios_api.py`.
- Testes de services: `test_slice02_services.py`.
- Testes de fluxo MVP: `test_mvp_flow.py`, dependentes de `DATABASE_URL_TEST`.
- Check frontend/API: `npm run check:api-contract`.
- Infraestrutura Playwright E2E em `frontend/jubileu-web/e2e`, com specs iniciais por UC/CT.
- Coverage backend com `coverage run --branch` para auditoria de teste.

### Planejados

- 10 casos de uso macro.
- 35 casos de teste planejados, CT-01 a CT-35.
- Markers pytest `uc01` a `uc10`, `smoke`, `contract`, `integration` e `e2e`.

### Pendentes

- CT-06: update/delete/validacoes negativas de jogadores.
- CT-09: adicionar/remover vinculos jogador-turma.
- CT-16: validacoes temporais de agenda/evento.
- CT-20: negativos especificos de duplicidade/estado em presenca.
- CT-35: dashboard funcional completo com dados reais.
- Execucao bem-sucedida do E2E browser completo em host com dependencias Playwright instaladas e runtime/API saudaveis.
- Validacao manual publica em `https://app.jubileuweb.com` com evidencia auditavel para UC01 a UC10.
- Execucao do workflow GitHub Actions criado neste PR.

### Bloqueados por ambiente

- `test_mvp_flow.py` depende de `DATABASE_URL_TEST`; nesta revisao os 2 testes desse arquivo ficaram skipped.
- `npm run test:e2e` completo ainda nao e gate aprovado; exige browser funcional, Vite saudavel e API no modo correto.
- `npx playwright install-deps --dry-run chromium` apontou dependencia nativa pendente neste host: `libcups2t64`.
- Modo dev local E2E nao foi executado porque `http://127.0.0.1:8000/health` nao respondeu.
- Modo runtime NGINX local ficou parcial: `/health` e `/api/health` responderam, mas `contract.spec.ts` fechou com 2 passed e 1 failed por `ERR_CONNECTION_RESET` em `/login`.
- `app.jubileuweb.com` e ambiente de smoke/validacao manual publica, nao ambiente para seed destrutivo de E2E automatizado.

## Evidencia informada/observada

Resultados abaixo sao evidencia local desta revisao para o marco tecnico `94d4f45` com PR2 empilhado sobre `4ec4284`. O commit `94d4f45` e hardening operacional, entao nao aumenta cobertura funcional UC/CT.

| Comando | Resultado observado | Status |
|---|---|---|
| `cd backend/jubileu-api-fastapi && .venv/bin/python -m pytest -q -rs` | `44 passed, 2 skipped`; skipped por `DATABASE_URL_TEST nao definido` em `test_mvp_flow.py`. | covered-api/partial |
| `.venv/bin/python -m pip install -r requirements.txt` | Instalou dependencias, incluindo `coverage==7.14.1`. | covered-api |
| `.venv/bin/python -m coverage run --branch -m pytest -q -rs` | `44 passed, 2 skipped, 1 warning`; skipped por `DATABASE_URL_TEST nao definido` em `test_mvp_flow.py`. | covered-api/partial |
| `.venv/bin/python -m coverage report -m` | Relatorio emitido com `TOTAL 77%`. | covered-api |
| `.venv/bin/python -m pytest -q -m smoke -rs` | `4 passed`. | covered-api |
| `.venv/bin/python -m pytest -q -m contract -rs` | `5 passed`. | covered-contract |
| `cd frontend/jubileu-web && npm ci` | Instalacao concluiu; npm reportou 6 vulnerabilidades de dependencia, sem alteracao automatica nesta revisao. | covered-contract |
| `cd frontend/jubileu-web && npm run lint` | `eslint .` concluiu com exit code 0. | covered-contract |
| `npm run build` | Vite build concluiu com sucesso. | covered-contract |
| `npm run check:api-contract` | `API contract check OK: no suspicious service calls, /api/api, or Vite rewrite found.` | covered-contract |
| `LOCAL_BASE_URL=http://127.0.0.1 scripts/server/smoke_server.sh` | `Smoke OK: NGINX + Frontend + FastAPI respondendo.` | covered-contract |
| `PUBLIC_BASE_URL=https://app.jubileuweb.com scripts/server/smoke_server.sh` | `Smoke OK: NGINX + Frontend + FastAPI respondendo.` | covered-contract |
| `npx playwright install-deps --dry-run chromium` | Historico do host fora do container: `Missing system dependencies (1): libcups2t64`. No container Alpine, usar Chromium nativo via `E2E_CHROMIUM_EXECUTABLE_PATH`. | historical-blocked-e2e |
| `npx playwright --version` | `Version 1.60.0`. | created-e2e |
| `E2E_RUNTIME_MODE=nginx E2E_REUSE_EXISTING_SERVER=1 E2E_BASE_URL=http://127.0.0.1:5173 npm run test:e2e -- --project=chromium e2e/contract.spec.ts --reporter=list` | Historico anterior: `contract.spec.ts` 2 passed e 1 failed por `/login` com `ERR_CONNECTION_RESET`. | historical-partial-e2e |
| `npm run test:e2e` completo | Infraestrutura criada e 11 testes coletados; suite completa ainda nao e gate aprovado porque UC02-UC05 criam dados e UC06-UC09 seguem skipped/pendentes. | partial-e2e |
| `docker exec jubileu-dev-frontend-dev-1 sh -lc 'E2E_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser E2E_REUSE_EXISTING_SERVER=1 E2E_BASE_URL=http://frontend-dev:5173 E2E_API_URL=http://backend:8000 npm run test:e2e -- --project=chromium e2e/dev41-smoke.spec.ts --reporter=list'` | `2 passed`: login, `/usuario`, erro 503 controlado e sem novas chamadas apos erro. | passed-e2e-dev |
| `docker exec jubileu-dev-frontend-dev-1 sh -lc 'E2E_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser E2E_REUSE_EXISTING_SERVER=1 E2E_BASE_URL=http://frontend-dev:5173 E2E_API_URL=http://backend:8000 npm run test:e2e -- --project=chromium e2e/contract.spec.ts e2e/uc01-login.spec.ts e2e/uc10-dashboard.spec.ts --reporter=list --workers=1 --timeout=90000'` | `5 passed`: contrato `/api`, login e dashboard. | passed-e2e-dev |
| `timeout 90 scripts/dev/smoke_dev.sh` | `Dev smoke OK: NGINX dev + Frontend + FastAPI respondendo.` | covered-runtime-dev |

## CI/GitHub Actions

O gate oficial de qualidade passa a ser GitHub Actions + smoke server + runtime oficial `Cloudflare Tunnel -> NGINX -> React/Vite estatico + FastAPI /api -> PostgreSQL`.

Vercel nao e runtime oficial nem evidencia oficial de qualidade. Se checks, comments ou previews Vercel aparecerem no historico do GitHub, devem ser tratados como resquicio de integracao externa, sem substituir CI, smoke server ou validacao no runtime oficial.

| Camada | Responsabilidade | Status nesta revisao |
|---|---|---|
| GitHub Actions `ci.yml` | Rodar backend coverage/smoke/contract e frontend lint/build/check:api-contract em PR/push para `jubileu-v2`. | workflow criado/aguardando execucao |
| GitHub Actions `playwright-preflight` | Instalar Chromium com dependencias e registrar versao Playwright, sem rodar E2E completo; job nao bloqueante. | workflow criado/aguardando execucao |
| Smoke server local | Validar `/health`, `/api/health` e rotas API pelo NGINX local quando a stack estiver ativa. | covered-contract |
| Smoke server publico | Validar `https://app.jubileuweb.com/health` e `https://app.jubileuweb.com/api/...` pelo Cloudflare Tunnel/NGINX. | covered-contract |
| Vercel | Integracao externa historica, sem valor de gate oficial. | pending |

## Scripts de checagem

Os scripts abaixo foram localizados no estado atual do workspace, mas nao foram registrados como passed nesta revisao porque a evidencia exigida para eles nao foi executada aqui.

| Script | Objetivo | Comando sugerido | Status nesta revisao |
|---|---|---|---|
| `scripts/dev/check_frontend_api_prefixes.sh` | Procurar chamadas provaveis de backend sem prefixo `/api` nos services do frontend. | `C:\Program Files\Git\bin\bash.exe scripts/dev/check_frontend_api_prefixes.sh` | localizado, nao executado como evidencia desta entrega |
| `scripts/server/check_api_contracts.sh` | Validar contrato de borda NGINX/SPA/API em uma instancia HTTP ativa. | `C:\Program Files\Git\bin\bash.exe scripts/server/check_api_contracts.sh` | localizado, pendente de ambiente server em `127.0.0.1:80` |

## Analise do commit HEAD 94d4f45

| Dimensao | Analise |
|---|---|
| Comportamento funcional | Sem mudanca funcional; commit restrito a hardening operacional do container API. |
| Contrato de API | Sem mudanca no contrato; mantem leitura anterior de `/api`, `/api/health`, ausencia de `/api/api`, `X-Request-ID` e check frontend/API. |
| Documentacao | Esta revisao atualiza roadmap, plano de testes, runbook Cloudflare e CI minimo para refletir o HEAD atual. |
| Runtime/deploy | `compose.server.yml` usa `init: true` no container `jubileu-api`; topologia oficial segue Cloudflare Tunnel -> NGINX -> React/Vite estatico + FastAPI `/api` -> PostgreSQL. |
| Testes | Sem nova suite funcional neste commit; GitHub Actions minimo passa a executar full/smoke/contract backend e lint/build/check frontend. |

## Metricas

| Metrica | Valor | Observacao |
|---|---:|---|
| Casos de uso mapeados | 10 | UC01 a UC10. |
| Casos de teste planejados | 35 | CT-01 a CT-35. |
| Itens pytest coletados | 46 | Coleta local do backend. |
| Testes executaveis no ambiente padrao | 44 | Passaram sem `DATABASE_URL_TEST`. |
| Testes dependentes de `DATABASE_URL_TEST`/PostgreSQL externo | 2 | `test_mvp_flow.py`. |
| Cobertura planejada por UC | 100% | Todos os 10 UCs possuem CTs planejados. |
| Cobertura automatizada estimada | parcial | Ha testes backend para todos os UCs e specs E2E iniciais para UC01-UC05/UC10; execucao browser ainda blocked neste host. |
| Cobertura comprovada nesta revisao | parcial | Backend/API, contratos e build/lint frontend comprovados; manual publico e E2E browser seguem pendentes. |
| Coverage report | 77% | `coverage run --branch` passou com `44 passed, 2 skipped`; `coverage report -m` emitido. |
| E2E navegador | passed-e2e-dev/parcial | DEV-41 smoke, contrato, login e dashboard passaram no compose dev; UC02-UC05/UC06-UC09 seguem controlados por preparacao de dados/fixtures. |
| Validacao manual publica | manual-pending | UC01 a UC10 ainda exigem evidencia em `https://app.jubileuweb.com`. |
| GitHub Actions | pending | Workflow minimo criado; aguardando execucao no GitHub. |

### Percentual estimado por caso de uso

| UC | Cobertura funcional estimada | Leitura |
|---|---:|---|
| UC01 | 70% | Backend de auth/perfil coberto; UI ausente. |
| UC02 | 40% | Consulta/alias e criacao em fluxo skipped; CRUD completo pendente. |
| UC03 | 35% | Criacao em fluxo skipped; vinculos pendentes. |
| UC04 | 65% | Consulta/criacao dia e service cobertos parcialmente. |
| UC05 | 55% | Inicio/status cobertos; agendamento temporal pendente. |
| UC06 | 75% | RSVP/check-in bem cobertos; negativos especificos pendentes. |
| UC07 | 75% | Rotacao/equipes bem cobertas; parte do estado-equipes skipped. |
| UC08 | 80% | Lifecycle de partida coberto em API. |
| UC09 | 80% | Lances/placar/estatisticas cobertos em API/service/workspace. |
| UC10 | 30% | Workspace/KPIs parciais; dashboard funcional pendente. |

Esses percentuais sao estimativas de auditoria por comportamento, nao metricas de cobertura de codigo.

## Comandos reproduziveis

Backend:

```bash
cd backend/jubileu-api-fastapi
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m coverage run --branch -m pytest -q -rs
.venv/bin/python -m coverage report -m
.venv/bin/python -m pytest -q -rs
.venv/bin/python -m pytest -q -m smoke -rs
.venv/bin/python -m pytest -q -m contract -rs
.venv/bin/python -m pytest -q -m "uc05 or uc06 or uc07" -rs
```

Frontend:

```bash
cd frontend/jubileu-web
npm ci
npm run lint
npm run build
npm run check:api-contract
npx playwright install-deps --dry-run chromium
npm run test:e2e
```

E2E contrato local:

```bash
# Modo dev local: Vite 5173 + FastAPI direto 8000.
E2E_BASE_URL=http://127.0.0.1:5173 E2E_API_URL=http://127.0.0.1:8000 npm run test:e2e -- --project=chromium e2e/contract.spec.ts --reporter=list

# Modo runtime NGINX: NGINX 80 + API sob /api.
E2E_RUNTIME_MODE=nginx E2E_BASE_URL=http://127.0.0.1:5173 npm run test:e2e -- --project=chromium e2e/contract.spec.ts --reporter=list

# Apenas quando um Vite existente em 127.0.0.1:5173 estiver saudavel.
E2E_RUNTIME_MODE=nginx E2E_REUSE_EXISTING_SERVER=1 E2E_BASE_URL=http://127.0.0.1:5173 npm run test:e2e -- --project=chromium e2e/contract.spec.ts --reporter=list
```

Server/contrato de borda, quando a stack estiver ativa:

```bash
scripts/dev/check_frontend_api_prefixes.sh
LOCAL_BASE_URL=http://127.0.0.1 scripts/server/smoke_server.sh
PUBLIC_BASE_URL=https://app.jubileuweb.com scripts/server/smoke_server.sh
```

## Conclusao

- Cobertura planejada: 10 UCs e 35 CTs documentados.
- Cobertura automatizada: existe uma base real de testes backend, check frontend/API e Playwright E2E criado.
- Cobertura comprovada: pytest com coverage (`TOTAL 77%`), smoke, contract, lint, build, `check:api-contract` e smoke server local/publico estao registrados como passed/covered.
- Cobertura E2E comprovada no compose dev: DEV-41 smoke (`2 passed`) e suite curta contrato/login/dashboard (`5 passed`) com Chromium nativo do Alpine.
- Cobertura pendente: suite Playwright completa como gate, validacao manual publica, cenarios de dashboard com dados ricos e fluxos UC06-UC09 com participantes/equipes/partidas/lances.
- Gate oficial: GitHub Actions minimo + smoke server + runtime Cloudflare/NGINX. Vercel nao e gate oficial.
- Proximo PR recomendado: adicionar PostgreSQL com `DATABASE_URL_TEST` no CI e, depois, habilitar Playwright no CI com dependencias nativas.
