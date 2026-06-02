# Plano canonico de testes e rastreabilidade

## Estado analisado

- Repositorio: `FelipeDalMolin/projeto-jubileu`
- Branch local: `jubileu-v2`
- HEAD analisado: `fe06768 Ajuste em routes da API`
- Data desta revisao: 2026-06-01
- Escopo desta entrega: documentacao, rastreabilidade, markers pytest, contrato frontend/API e configuracao inicial Playwright E2E.
- Fora de escopo: models, migrations, regras de dominio, RBAC definitivo e refatoracao visual/UI.

Este documento corrige a leitura de cobertura do projeto: o commit `fe06768` avanca o contrato `/api`, `/api/health`, `X-Request-ID`, smoke/contract backend, `apiClient`, `check:api-contract` e a primeira infraestrutura Playwright. Isso ainda nao comprova cobertura funcional completa dos casos de uso; E2E navegador depende de host com dependencias nativas do browser instaladas e backend local saudavel.

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

Variaveis:

- `E2E_BASE_URL`: URL do frontend, fallback `http://localhost:5173`.
- `E2E_API_URL`: URL do backend, fallback `http://localhost:8000`.

### Specs criadas

| Spec | UC/CT alvo | Status nesta revisao | Observacao |
|---|---|---|---|
| `contract.spec.ts` | E2E-CONTRACT; `/api/health`, `X-Request-ID`, ausencia de `/api/api` | blocked | Browser nao abriu neste host por dependencia nativa ausente. |
| `uc01-login.spec.ts` | UC01 login/sessao/navegacao protegida | blocked | Teste criado; execucao depende de Chromium funcional. |
| `uc02-uc03-cadastros.spec.ts` | UC02 jogador; UC03 turma | blocked | Testes criam jogador/turma pela UI quando API esta saudavel. |
| `uc04-uc05-dia-evento.spec.ts` | UC04 dia; UC05 evento/aula | blocked | Seed por API prepara turma/dia; criacao do evento e feita pela UI. |
| `uc06-uc09.spec.ts` | UC06 a UC09 | pending | Specs `test.skip` com motivo: exigem fixtures completas de participantes, equipes, partidas e lances. |
| `uc10-dashboard.spec.ts` | UC10 dashboard/indicadores | blocked | Teste criado para validar indicadores ou estado operacional vazio/erro. |

### Status E2E por UC

| UC | Status E2E | Leitura |
|---|---|---|
| UC01 | blocked | Spec criada; host atual nao consegue abrir Chromium. |
| UC02 | blocked | Spec criada para cadastro UI de jogador; depende de browser e API local. |
| UC03 | blocked | Spec criada para cadastro UI de turma; depende de browser e API local. |
| UC04 | blocked | Spec criada para abrir dia; depende de browser e API local. |
| UC05 | blocked | Spec criada para criar evento/aula pela UI; depende de browser e API local. |
| UC06 | pending | Fluxo UI de presenca/check-in requer fixture completa e estabilizacao futura. |
| UC07 | pending | Fluxo UI de equipes/rotacao requer fixture completa e criterios de testabilidade. |
| UC08 | pending | Fluxo UI de partida requer fixture completa de equipes/partida. |
| UC09 | pending | Fluxo UI de lances requer partida em andamento e jogadores elegiveis. |
| UC10 | blocked | Spec criada; depende de browser funcional para validar dashboard. |

Motivo do blocked E2E neste ambiente: `E2E_API_URL` default (`http://localhost:8000/api/health`) nao respondeu, e `npm run test:e2e` iniciou o webServer/coletou 11 testes, mas o Chromium headless falhou ao abrir por dependencia nativa ausente: `libnspr4.so: cannot open shared object file`. `npx playwright install` concluiu com aviso de host pedindo dependencias como `libasound2t64`; `sudo` nao esta disponivel sem senha neste ambiente.

## Matriz UC -> CT -> teste -> evidencia

| ID do caso de uso | Nome do caso de uso | Objetivo | Casos de teste associados | Tipo de teste | Arquivo de teste | Comando de execucao | Status | Evidencia | Observacoes |
|---|---|---|---|---|---|---|---|---|---|
| UC01 | Autenticar usuario/perfil | Login, perfil e autorizacao. | CT-01 login e `/api/auth/me` com bearer; CT-02 compatibilidade headers legados; CT-03 perfil `/api/usuarios/me` e RBAC de inicio de evento. | integracao API, e2e | `test_auth_jwt_rbac.py`, `test_usuarios_api.py`; `uc01-login.spec.ts` | `python -m pytest -q -m uc01`; `npm run test:e2e` | covered-api/blocked-e2e | Incluido no full pytest: `44 passed, 2 skipped`; E2E bloqueado por dependencia nativa do browser no host. | Cobertura backend suficiente para login/perfil basico; UI de login tem spec criada, ainda sem execucao neste host. |
| UC02 | Manter jogadores | Cadastro e consulta de jogadores. | CT-04 alias/listagem `/jogadores/` e `/api/jogadores/`; CT-05 criacao de jogador no fluxo MVP; CT-06 update/delete/validacoes negativas. | contrato, integracao API | `test_api_standardization_aliases.py`, `test_mvp_flow.py` | `python -m pytest -q -m uc02` | skipped/parcial | `test_mvp_flow.py` pula sem `DATABASE_URL_TEST`; alias roda no full pytest. | CT-06 permanece pending. |
| UC03 | Manter turmas/vinculos | Cadastro de turma e vinculos jogador-turma. | CT-07 criacao de turma no fluxo MVP; CT-08 contrato/listagem `/api/turmas`; CT-09 adicionar/remover vinculos de turma. | contrato, integracao API | `test_mvp_flow.py`, `test_smoke_api.py` | `python -m pytest -q -m uc03` | skipped/parcial | Teste funcional de turma depende de `DATABASE_URL_TEST`. | CT-09 permanece pending; smoke de rota nao comprova fluxo funcional. |
| UC04 | Consultar/criar dias | Consulta e criacao implicita de dia. | CT-10 get-or-create de dia por `data_iso`; CT-11 alias `/dias` e `/api/dias`; CT-12 servico `get_evento_no_dia_or_404`. | contrato, unitario, integracao API | `test_api_standardization_aliases.py`, `test_slice02_services.py`, `test_mvp_flow.py` | `python -m pytest -q -m uc04` | passed/parcial | Alias e service cobertos no full pytest; fluxo MVP de dia fica skipped sem `DATABASE_URL_TEST`. | Ainda falta negativo funcional completo de data/agenda. |
| UC05 | Criar/agendar evento/aula | Criacao, tipo, agenda e inicio de evento. | CT-13 criar evento/aula; CT-14 regras de tipo (`JOGO_LIVRE` sem turma e `AULA` com turma); CT-15 inicio autorizado/status; CT-16 validacoes temporais de agenda. | integracao API, unitario | `test_mvp_flow.py`, `test_auth_jwt_rbac.py`, `test_eventos_api.py`, `test_partidas_lifecycle_api.py`, `test_slice02_services.py`, `test_workspace_evento.py` | `python -m pytest -q -m uc05` | passed/parcial | Comando agrupado `python -m pytest -q -m "uc05 or uc06 or uc07"`: `19 passed, 2 skipped, 24 deselected`. | CT-16 permanece pending; criacao detalhada depende parcialmente de `DATABASE_URL_TEST`. |
| UC06 | Registrar presencas/check-in/RSVP | RSVP, check-in, check-out e presenca. | CT-17 RSVP; CT-18 check-in/check-out/cancelamento; CT-19 check-in por treinador e ordem de presentes invalida; CT-20 negativos de duplicidade/estado. | integracao API | `test_eventos_api.py` | `python -m pytest -q -m uc06` | passed/parcial | Coberto no comando agrupado: `19 passed, 2 skipped, 24 deselected`. | CT-20 permanece pending se exigir duplicidade/estado especifico. |
| UC07 | Formar equipes | Equipes, rotacao, fila e snapshots. | CT-21 estado de equipes/snapshot; CT-22 estado de rotacao e indicadores; CT-23 preview/confirmacao de sorteio; CT-24 update de fila/proximos times/team size; CT-25 reconciliacao e avisos de times. | integracao API | `test_mvp_flow.py`, `test_eventos_api.py`, `test_eventos_rotacao_api.py`, `test_workspace_evento.py` | `python -m pytest -q -m uc07` | passed/parcial | Coberto no comando agrupado: `19 passed, 2 skipped, 24 deselected`. | Parte de CT-21 fica skipped sem `DATABASE_URL_TEST`; demais rodam em SQLite in-memory. |
| UC08 | Criar e operar partidas | Seed, inicio, encerramento e gates. | CT-26 seed/criacao de partida; CT-27 start/end; CT-28 negativos de lifecycle; CT-29 finalizar evento com partida ativa/reconciliacao. | integracao API, e2e pending | `test_eventos_api.py`, `test_partidas_lifecycle_api.py`, `test_workspace_evento.py`; `uc06-uc09.spec.ts` | `python -m pytest -q -m uc08`; `npm run test:e2e` | covered-api/pending-e2e | Incluido no full pytest: `44 passed, 2 skipped`; E2E marcado `test.skip`. | UI E2E requer fixture completa de equipes/partida. |
| UC09 | Registrar lances/estatisticas | Lances, filtros, placar e estatisticas. | CT-30 registrar e consultar lances; CT-31 filtros invalidos; CT-32 conversao/rejeicao de jogador; CT-33 placar e estatisticas em service/workspace. | unitario, integracao API, e2e pending | `test_eventos_api.py`, `test_partidas_lifecycle_api.py`, `test_slice02_services.py`, `test_workspace_evento.py`; `uc06-uc09.spec.ts` | `python -m pytest -q -m uc09`; `npm run test:e2e` | covered-api/pending-e2e | Incluido no full pytest: `44 passed, 2 skipped`; E2E marcado `test.skip`. | UI E2E requer partida em andamento e jogadores elegiveis. |
| UC10 | Consultar dashboards/indicadores | Dashboards e indicadores agregados. | CT-34 contratos de rotas de dashboard e KPIs agregados de workspace; CT-35 dashboard funcional com dados reais. | contrato, integracao API, e2e | `test_api_standardization_aliases.py`, `test_workspace_evento.py`; `uc10-dashboard.spec.ts` | `python -m pytest -q -m uc10`; `npm run test:e2e` | partial/blocked-e2e | KPIs de workspace rodam no full pytest; spec de dashboard criada, mas bloqueada por dependencia nativa do browser no host. | CT-35 permanece partial ate E2E rodar em host habilitado. |

## Testes existentes, planejados, pendentes e bloqueados

### Ja existentes

- Backend `pytest` com 45 itens coletados em `backend/jubileu-api-fastapi/tests`.
- Testes de smoke/startup: `test_smoke_api.py`.
- Testes de contrato/API: `test_api_standardization_aliases.py` e parte de `test_smoke_api.py`.
- Testes de dominio/eventos: `test_eventos_api.py`, `test_eventos_rotacao_api.py`, `test_partidas_lifecycle_api.py`, `test_workspace_evento.py`.
- Testes de auth/perfil: `test_auth_jwt_rbac.py`, `test_usuarios_api.py`.
- Testes de services: `test_slice02_services.py`.
- Testes de fluxo MVP: `test_mvp_flow.py`, dependentes de `DATABASE_URL_TEST`.
- Check frontend/API: `npm run check:api-contract`.
- Infraestrutura Playwright E2E em `frontend/jubileu-web/e2e`, com specs iniciais por UC/CT.

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
- Relatorio de `coverage` por branch.
- Execucao bem-sucedida de pelo menos um fluxo E2E com navegador em host com dependencias Playwright instaladas.

### Bloqueados por ambiente

- `test_mvp_flow.py` depende de `DATABASE_URL_TEST`; nesta revisao os 2 testes desse arquivo ficaram skipped.
- `coverage run --branch -m pytest` esta bloqueado porque o modulo `coverage` nao esta instalado no venv local.
- `npm run test:e2e` esta bloqueado no host atual: `http://localhost:8000/api/health` nao responde e Chromium headless nao abre porque falta `libnspr4.so`; `npx playwright install` tambem avisou falta de dependencias de sistema, incluindo `libasound2t64`.

## Evidencia informada/observada

Resultados abaixo sao evidencia local desta revisao, nao resultado definitivo do projeto em todos os ambientes.

| Comando | Resultado observado | Status |
|---|---|---|
| `cd backend/jubileu-api-fastapi && .venv/bin/python -m pytest -q -rs` | `44 passed, 2 skipped, 1 warning in 8.53s`; skipped por `DATABASE_URL_TEST nao definido` em `test_mvp_flow.py`. | passed/parcial |
| `.venv/bin/python -m pytest -q -m smoke -rs` | `4 passed, 42 deselected, 1 warning in 0.79s`. | passed |
| `.venv/bin/python -m pytest -q -m contract -rs` | `5 passed, 41 deselected, 1 warning in 0.54s`. | passed |
| `cd frontend/jubileu-web && npm install` | `added 3 packages`; `4 vulnerabilities` reportadas pelo npm audit. | passed/com observacao |
| `npm run lint` | `eslint .` concluiu com exit code 0. | passed |
| `npm run build` | Vite build concluiu com `983 modules transformed` e `built in 1m 29s`. | passed |
| `npm run check:api-contract` | `API contract check OK: no suspicious service calls, /api/api, or Vite rewrite found.` | passed |
| `npx playwright install` | Browsers baixados; aviso de host sem dependencias nativas (`libasound2t64`). | passed/com warning |
| `npm run test:e2e` | 11 testes coletados; `7 failed`, `4 skipped`; falha por Chromium nao abrir: `libnspr4.so` ausente. | blocked |

## Scripts de checagem

Os scripts abaixo foram localizados no estado atual do workspace, mas nao foram registrados como passed nesta revisao porque a evidencia exigida para eles nao foi executada aqui.

| Script | Objetivo | Comando sugerido | Status nesta revisao |
|---|---|---|---|
| `scripts/dev/check_frontend_api_prefixes.sh` | Procurar chamadas provaveis de backend sem prefixo `/api` nos services do frontend. | `C:\Program Files\Git\bin\bash.exe scripts/dev/check_frontend_api_prefixes.sh` | localizado, nao executado como evidencia desta entrega |
| `scripts/server/check_api_contracts.sh` | Validar contrato de borda NGINX/SPA/API em uma instancia HTTP ativa. | `C:\Program Files\Git\bin\bash.exe scripts/server/check_api_contracts.sh` | localizado, pendente de ambiente server em `127.0.0.1:80` |

## Analise do commit HEAD fe06768

| Dimensao | Analise |
|---|---|
| Comportamento funcional | Mantem regras de dominio e adiciona testabilidade; `data-testid` nao altera comportamento. |
| Contrato de API | Consolida `/api`, `/api/health`, ausencia de `/api/api`, `X-Request-ID` e check frontend/API. |
| Documentacao | Atualiza rastreabilidade para backend/API, contrato frontend/API e camada E2E inicial. |
| Runtime/deploy | Playwright inicia Vite local e usa `E2E_API_URL`; backend real precisa estar saudavel para E2E de integracao. |
| Testes | Mantem pytest, adiciona Playwright configurado e specs iniciais; execucao E2E bloqueada neste host por dependencia nativa ausente. |

## Metricas

| Metrica | Valor | Observacao |
|---|---:|---|
| Casos de uso mapeados | 10 | UC01 a UC10. |
| Casos de teste planejados | 35 | CT-01 a CT-35. |
| Itens pytest coletados | 45 | Coleta local do backend. |
| Testes executaveis no ambiente padrao | 44 | Passaram sem `DATABASE_URL_TEST`. |
| Testes dependentes de `DATABASE_URL_TEST`/PostgreSQL externo | 2 | `test_mvp_flow.py`. |
| Cobertura planejada por UC | 100% | Todos os 10 UCs possuem CTs planejados. |
| Cobertura automatizada estimada | parcial | Ha testes backend para todos os UCs e specs E2E iniciais para UC01-UC05/UC10; execucao browser ainda blocked neste host. |
| Cobertura comprovada nesta revisao | parcial | Limitada aos comandos executados e registrados acima. |
| Coverage report | nao gerado | Bloqueado porque `coverage` nao esta instalado no venv local. |
| E2E navegador | configurado/blocked | Playwright e specs criados; Chromium nao abre neste host por falta de `libnspr4.so`. |

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

```powershell
cd backend/jubileu-api-fastapi
python -m pytest -q
python -m pytest -q -m smoke
python -m pytest -q -m contract
python -m pytest -q -m "uc05 or uc06 or uc07"
coverage run --branch -m pytest
coverage report -m
```

Se `coverage` nao estiver instalado:

```powershell
python -m pip install coverage
```

Frontend:

```powershell
cd frontend/jubileu-web
npm install
npm run lint
npm run build
npm run check:api-contract
npx playwright install
npm run test:e2e
```

Server/contrato de borda, quando a stack estiver ativa:

```powershell
C:\Program Files\Git\bin\bash.exe scripts/dev/check_frontend_api_prefixes.sh
C:\Program Files\Git\bin\bash.exe scripts/server/check_api_contracts.sh
```

## Conclusao

- Cobertura planejada: 10 UCs e 35 CTs documentados.
- Cobertura automatizada: existe uma base real de testes backend, check frontend/API e Playwright E2E configurado.
- Cobertura comprovada: pytest, lint, build e `check:api-contract` passaram; E2E browser ficou blocked por dependencia do host.
- Cobertura pendente: execucao Playwright em host habilitado, dashboards funcionais completos, relatorio `coverage` e fluxos UC06-UC09 com participantes/equipes/partidas/lances.
- Proximo PR recomendado: habilitar dependencias de host do Playwright no ambiente/CI e ampliar UC06-UC09 com fixtures completas.
