# Plano canonico de testes e rastreabilidade

## Estado analisado

- Repositorio: `FelipeDalMolin/projeto-jubileu`
- Branch local: `jubileu-v2`
- HEAD analisado: `4736427 Teste no server`
- Data desta revisao: 2026-06-01
- Escopo desta entrega: documentacao, rastreabilidade, markers pytest e evidencia de comandos.
- Fora de escopo: alteracoes funcionais, models, migrations, services, frontend, rotas e contratos existentes.

Este documento corrige a leitura de cobertura do projeto: o commit `4736427` avanca principalmente no alinhamento tecnico entre frontend e API por meio de prefixos `/api` e scripts de checagem, mas nao comprova sozinho cobertura funcional completa dos casos de uso.

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

## Matriz UC -> CT -> teste -> evidencia

| ID do caso de uso | Nome do caso de uso | Objetivo | Casos de teste associados | Tipo de teste | Arquivo de teste | Comando de execucao | Status | Evidencia | Observacoes |
|---|---|---|---|---|---|---|---|---|---|
| UC01 | Autenticar usuario/perfil | Login, perfil e autorizacao. | CT-01 login e `/api/auth/me` com bearer; CT-02 compatibilidade headers legados; CT-03 perfil `/api/usuarios/me` e RBAC de inicio de evento. | integracao API | `test_auth_jwt_rbac.py`, `test_usuarios_api.py` | `python -m pytest -q -m uc01` | passed | Incluido no full pytest: `43 passed, 2 skipped`; markers por funcao. | Cobertura backend suficiente para login/perfil basico; nao cobre UI de login. |
| UC02 | Manter jogadores | Cadastro e consulta de jogadores. | CT-04 alias/listagem `/jogadores/` e `/api/jogadores/`; CT-05 criacao de jogador no fluxo MVP; CT-06 update/delete/validacoes negativas. | contrato, integracao API | `test_api_standardization_aliases.py`, `test_mvp_flow.py` | `python -m pytest -q -m uc02` | skipped/parcial | `test_mvp_flow.py` pula sem `DATABASE_URL_TEST`; alias roda no full pytest. | CT-06 permanece pending. |
| UC03 | Manter turmas/vinculos | Cadastro de turma e vinculos jogador-turma. | CT-07 criacao de turma no fluxo MVP; CT-08 contrato/listagem `/api/turmas`; CT-09 adicionar/remover vinculos de turma. | contrato, integracao API | `test_mvp_flow.py`, `test_smoke_api.py` | `python -m pytest -q -m uc03` | skipped/parcial | Teste funcional de turma depende de `DATABASE_URL_TEST`. | CT-09 permanece pending; smoke de rota nao comprova fluxo funcional. |
| UC04 | Consultar/criar dias | Consulta e criacao implicita de dia. | CT-10 get-or-create de dia por `data_iso`; CT-11 alias `/dias` e `/api/dias`; CT-12 servico `get_evento_no_dia_or_404`. | contrato, unitario, integracao API | `test_api_standardization_aliases.py`, `test_slice02_services.py`, `test_mvp_flow.py` | `python -m pytest -q -m uc04` | passed/parcial | Alias e service cobertos no full pytest; fluxo MVP de dia fica skipped sem `DATABASE_URL_TEST`. | Ainda falta negativo funcional completo de data/agenda. |
| UC05 | Criar/agendar evento/aula | Criacao, tipo, agenda e inicio de evento. | CT-13 criar evento/aula; CT-14 regras de tipo (`JOGO_LIVRE` sem turma e `AULA` com turma); CT-15 inicio autorizado/status; CT-16 validacoes temporais de agenda. | integracao API, unitario | `test_mvp_flow.py`, `test_auth_jwt_rbac.py`, `test_eventos_api.py`, `test_partidas_lifecycle_api.py`, `test_slice02_services.py`, `test_workspace_evento.py` | `python -m pytest -q -m uc05` | passed/parcial | Comando agrupado `python -m pytest -q -m "uc05 or uc06 or uc07"`: `19 passed, 2 skipped, 24 deselected`. | CT-16 permanece pending; criacao detalhada depende parcialmente de `DATABASE_URL_TEST`. |
| UC06 | Registrar presencas/check-in/RSVP | RSVP, check-in, check-out e presenca. | CT-17 RSVP; CT-18 check-in/check-out/cancelamento; CT-19 check-in por treinador e ordem de presentes invalida; CT-20 negativos de duplicidade/estado. | integracao API | `test_eventos_api.py` | `python -m pytest -q -m uc06` | passed/parcial | Coberto no comando agrupado: `19 passed, 2 skipped, 24 deselected`. | CT-20 permanece pending se exigir duplicidade/estado especifico. |
| UC07 | Formar equipes | Equipes, rotacao, fila e snapshots. | CT-21 estado de equipes/snapshot; CT-22 estado de rotacao e indicadores; CT-23 preview/confirmacao de sorteio; CT-24 update de fila/proximos times/team size; CT-25 reconciliacao e avisos de times. | integracao API | `test_mvp_flow.py`, `test_eventos_api.py`, `test_eventos_rotacao_api.py`, `test_workspace_evento.py` | `python -m pytest -q -m uc07` | passed/parcial | Coberto no comando agrupado: `19 passed, 2 skipped, 24 deselected`. | Parte de CT-21 fica skipped sem `DATABASE_URL_TEST`; demais rodam em SQLite in-memory. |
| UC08 | Criar e operar partidas | Seed, inicio, encerramento e gates. | CT-26 seed/criacao de partida; CT-27 start/end; CT-28 negativos de lifecycle; CT-29 finalizar evento com partida ativa/reconciliacao. | integracao API | `test_eventos_api.py`, `test_partidas_lifecycle_api.py`, `test_workspace_evento.py` | `python -m pytest -q -m uc08` | passed | Incluido no full pytest: `43 passed, 2 skipped`. | Nao ha E2E navegador. |
| UC09 | Registrar lances/estatisticas | Lances, filtros, placar e estatisticas. | CT-30 registrar e consultar lances; CT-31 filtros invalidos; CT-32 conversao/rejeicao de jogador; CT-33 placar e estatisticas em service/workspace. | unitario, integracao API | `test_eventos_api.py`, `test_partidas_lifecycle_api.py`, `test_slice02_services.py`, `test_workspace_evento.py` | `python -m pytest -q -m uc09` | passed | Incluido no full pytest: `43 passed, 2 skipped`. | Cobertura backend boa; sem UI/E2E. |
| UC10 | Consultar dashboards/indicadores | Dashboards e indicadores agregados. | CT-34 contratos de rotas de dashboard e KPIs agregados de workspace; CT-35 dashboard funcional com dados reais. | contrato, integracao API, e2e | `test_api_standardization_aliases.py`, `test_workspace_evento.py`; e2e pendente | `python -m pytest -q -m uc10` | pending/parcial | KPIs de workspace rodam no full pytest, mas nao equivalem a dashboard funcional. | CT-35 permanece pending; UC10 nao deve ser tratado como coberto plenamente. |

## Testes existentes, planejados, pendentes e bloqueados

### Ja existentes

- Backend `pytest` com 45 itens coletados em `backend/jubileu-api-fastapi/tests`.
- Testes de smoke/startup: `test_smoke_api.py`.
- Testes de contrato/API: `test_api_standardization_aliases.py` e parte de `test_smoke_api.py`.
- Testes de dominio/eventos: `test_eventos_api.py`, `test_eventos_rotacao_api.py`, `test_partidas_lifecycle_api.py`, `test_workspace_evento.py`.
- Testes de auth/perfil: `test_auth_jwt_rbac.py`, `test_usuarios_api.py`.
- Testes de services: `test_slice02_services.py`.
- Testes de fluxo MVP: `test_mvp_flow.py`, dependentes de `DATABASE_URL_TEST`.

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
- Pelo menos um fluxo E2E com navegador.

### Bloqueados por ambiente

- `test_mvp_flow.py` depende de `DATABASE_URL_TEST`; nesta revisao os 2 testes desse arquivo ficaram skipped.
- `coverage run --branch -m pytest` esta bloqueado porque o modulo `coverage` nao esta instalado no venv local.

## Evidencia informada/observada

Resultados abaixo sao evidencia local desta revisao, nao resultado definitivo do projeto em todos os ambientes.

| Comando | Resultado observado | Status |
|---|---|---|
| `cd backend/jubileu-api-fastapi; .\.venv\Scripts\python.exe -m pytest -q -rs` | `43 passed, 2 skipped, 1 warning in 6.07s`; skipped por `DATABASE_URL_TEST nao definido` em `test_mvp_flow.py`. | passed/parcial |
| `.\.venv\Scripts\python.exe -m pytest -q -m smoke` | `3 passed, 42 deselected, 1 warning in 1.45s`. | passed |
| `.\.venv\Scripts\python.exe -m pytest -q -m contract` | `4 passed, 41 deselected, 1 warning in 1.08s`. | passed |
| `.\.venv\Scripts\python.exe -m pytest -q -m "uc05 or uc06 or uc07" -rs` | `19 passed, 2 skipped, 24 deselected, 1 warning in 4.31s`; skipped por `DATABASE_URL_TEST nao definido`. | passed/parcial |
| `.\.venv\Scripts\python.exe -m coverage --version` | `No module named coverage`. | blocked |
| `cd frontend/jubileu-web; npm.cmd run lint` | `eslint .` concluiu com exit code 0. | passed |
| `cd frontend/jubileu-web; npm.cmd run build` | Vite build concluiu com `982 modules transformed` e `built in 11.46s`. | passed |

## Scripts de checagem

Os scripts abaixo foram localizados no estado atual do workspace, mas nao foram registrados como passed nesta revisao porque a evidencia exigida para eles nao foi executada aqui.

| Script | Objetivo | Comando sugerido | Status nesta revisao |
|---|---|---|---|
| `scripts/dev/check_frontend_api_prefixes.sh` | Procurar chamadas provaveis de backend sem prefixo `/api` nos services do frontend. | `C:\Program Files\Git\bin\bash.exe scripts/dev/check_frontend_api_prefixes.sh` | localizado, nao executado como evidencia desta entrega |
| `scripts/server/check_api_contracts.sh` | Validar contrato de borda NGINX/SPA/API em uma instancia HTTP ativa. | `C:\Program Files\Git\bin\bash.exe scripts/server/check_api_contracts.sh` | localizado, pendente de ambiente server em `127.0.0.1:80` |

## Analise do commit HEAD 4736427

| Dimensao | Analise |
|---|---|
| Comportamento funcional | Altera URLs chamadas pelo frontend para usar `/api/...`; isso afeta roteamento HTTP, mas nao altera regras de dominio no backend. |
| Contrato de API | Avanca a padronizacao frontend/API e separa chamadas API de rotas SPA. |
| Documentacao | Nao cria plano de testes nem matriz de rastreabilidade. |
| Runtime/deploy | Adiciona scripts de verificacao para prefixos frontend e contrato NGINX/API, dependentes de ambiente adequado para execucao. |
| Testes | Nao adiciona nem altera testes `pytest`, Vitest ou Playwright. Os scripts shell sao checagens auxiliares, nao cobertura funcional completa dos UCs. |

## Metricas

| Metrica | Valor | Observacao |
|---|---:|---|
| Casos de uso mapeados | 10 | UC01 a UC10. |
| Casos de teste planejados | 35 | CT-01 a CT-35. |
| Itens pytest coletados | 45 | Coleta local do backend. |
| Testes executaveis no ambiente padrao | 43 | Passaram sem `DATABASE_URL_TEST`. |
| Testes dependentes de `DATABASE_URL_TEST`/PostgreSQL externo | 2 | `test_mvp_flow.py`. |
| Cobertura planejada por UC | 100% | Todos os 10 UCs possuem CTs planejados. |
| Cobertura automatizada estimada | parcial | Ha testes backend para todos os UCs, mas UC02, UC03, UC05 e UC10 ainda tem lacunas relevantes. |
| Cobertura comprovada nesta revisao | parcial | Limitada aos comandos executados e registrados acima. |
| Coverage report | nao gerado | Bloqueado porque `coverage` nao esta instalado no venv local. |
| E2E navegador | nao configurado | Sem Playwright/Cypress configurado nesta entrega. |

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
npm.cmd run lint
npm.cmd run build
```

Server/contrato de borda, quando a stack estiver ativa:

```powershell
C:\Program Files\Git\bin\bash.exe scripts/dev/check_frontend_api_prefixes.sh
C:\Program Files\Git\bin\bash.exe scripts/server/check_api_contracts.sh
```

## Conclusao

- Cobertura planejada: 10 UCs e 35 CTs documentados.
- Cobertura automatizada: existe uma base real de testes backend, agora mapeada por markers.
- Cobertura comprovada: limitada aos comandos executados e evidencias registradas nesta revisao.
- Cobertura pendente: dashboards funcionais, relatorio `coverage` e pelo menos um fluxo E2E com navegador.
- Proximo PR recomendado: adicionar um E2E validavel para o fluxo critico `criar/agendar evento -> registrar presenca -> formar equipe -> operar partida -> registrar lance`.
