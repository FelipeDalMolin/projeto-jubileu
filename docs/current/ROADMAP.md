# Roadmap do Projeto Jubileu

## Direcao

O Projeto Jubileu usa `Evento` como entidade operacional canonica:

```text
Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas
```

`AULA` permanece apenas como modo/tipo de evento (`Evento.tipo = AULA`). Novos trabalhos nao devem criar modelos publicos, rotas publicas ou payloads baseados em uma entidade `Aula`.

O contrato publico de dados deve preservar o gateway `/api`. Rotas de navegacao da SPA, como `/dias`, sao diferentes de rotas de dados, como `/api/dias`.

## Estado Atual

Base integrada: `origin/jubileu-v2`.

Marco integrado mais recente: `4664eba DEV-21: extrai partidas, estatisticas e lances (#44)`.

Estado consolidado:

- Backend FastAPI preserva `/api` como contrato canonico de gateway.
- `/health` e `/api/health` existem para diagnostico.
- Middleware de `X-Request-ID` gera ou preserva o id de correlacao e devolve o header na response.
- Frontend possui `apiClient` minimo com base relativa `/api` e `X-Request-ID`.
- `npm run check:api-contract` valida separacao entre rotas SPA e chamadas de API.
- `pytest` cobre smoke, contratos e fluxos backend/API.
- Playwright cobre a suite completa UC01-UC10, auth, contratos, AULA/JOGO_LIVRE, polling e
  dashboards pelo NGINX canonico, sem declaracoes de skip.
- GitHub Actions passa a ser o gate oficial minimo de CI para backend, frontend e contratos.
- Vercel pode aparecer no historico por integracao externa, mas nao e gate oficial de qualidade ou runtime do projeto.

## Marco Ativo

O marco ativo e o fechamento formal da v0.3.0. A decisao permanece `NO-GO` e o projeto `atRisk`
ate o Security Gate DEV-21 e o rollback DEV-27 produzirem evidencia. A ordem bloqueante e:

1. quatro PRs DEV-21 para autorizacao e decomposicao do dominio;
2. PR DEV-27 para qualidade e runtime de release;
3. `v0.3.0-rc.3` imutavel por digest;
4. ensaio isolado de upgrade desde a revisao produtiva `0016`, restore e rollback;
5. pedido de `GO v0.3.0` humano antes de qualquer operacao produtiva.

## Trilhas de Execucao

### Backend/API

Foco:

- preservar exclusivamente rotas canonicas de dados sob `/api`;
- manter aliases sem `/api` removidos e sem redirect automatico de barra;
- manter `/health` e `/api/health`;
- manter `X-Request-ID` em responses;
- ampliar testes `pytest` por UC/CT;
- validar integracao real com PostgreSQL quando `DATABASE_URL_TEST` estiver disponivel;
- nao alterar migrations, models ou regras de dominio fora de slices explicitamente planejadas.

### Frontend

Foco:

- manter rotas SPA separadas das chamadas de dados;
- manter todos os services HTTP ativos no `apiClient` comum;
- manter `npm run check:api-contract`;
- adicionar `data-testid` apenas como camada minima de testabilidade;
- evitar refatoracao visual fora de escopo; quando o slice for de UI/UX, justificar a
  escolha de Tailwind puro, biblioteca existente ou dependencia nova por consistencia,
  acessibilidade, manutencao, velocidade e risco;
- ampliar Playwright para fluxos reais pela UI.

### Testes e Qualidade

Foco:

- `pytest` continua sendo a fonte para regras e contratos backend/API;
- `check:api-contract` continua protegendo o contrato frontend/API;
- Playwright valida experiencia de usuario e integracao browser -> Vite -> `/api` -> backend;
- seed por API prepara cenario, mas nao conta como cobertura E2E de fluxo de usuario;
- UC06 a UC09 so devem ser marcados como cobertos por E2E quando houver fixtures completas e fluxo UI real.

### Infra/Runtime

Foco:

- topologia oficial: `Cloudflare -> NGINX -> React SPA + FastAPI /api -> PostgreSQL`;
- NGINX e o unico ponto publico;
- FastAPI e PostgreSQL nao devem ser expostos diretamente;
- Vite dev proxy deve preservar `/api`;
- logs devem permitir correlacao por `X-Request-ID`;
- Playwright no ambiente/CI precisa de dependencias nativas instaladas;
- gate oficial: GitHub Actions + smoke server + runtime `Cloudflare Tunnel -> NGINX -> React/Vite estatico + FastAPI /api -> PostgreSQL`.

## Janela Atual de Fechamento

| Area | Status | Observacao |
|---|---|---|
| Contrato `/api` | Implementado | `/api/health`, rotas canonicas e guarda contra `/api/api`. |
| Correlacao de requests | Implementado | `X-Request-ID` no frontend/base client, middleware FastAPI e docs operacionais. |
| Backend pytest | Operacional | Suite completa e contratos de dashboard executados em cada PR. |
| Backend smoke | Operacional | Marker smoke: `4 passed`. |
| Backend contract | Operacional | Marker contract: `5 passed`. |
| Frontend lint/build | Operacional | `npm run lint` e `npm run build` passam. |
| Contrato frontend/API | Operacional | `npm run check:api-contract` passa. |
| Smoke server | Operacional | Smoke local em `127.0.0.1` e publico em `https://app.jubileuweb.com` passam pelo runtime NGINX/API. |
| Playwright E2E | gate bloqueante | Suite integral pelo NGINX, resultado JSON e zero skips/flaky. |
| PostgreSQL real | gate bloqueante | Banco limpo, `0019 -> head`, `0016 -> head`, integracao e concorrencia. |
| GitHub Actions | Operacional | Seis required checks com nomes estaveis. |
| UC06-UC09 E2E | coberto | Fixtures auditaveis de presenca/RSVP, fila, partida, lance e proxima partida. |

## Regras de Compatibilidade

- Preservar o contrato de gateway `/api`.
- Nao criar `/api/api`.
- Manter o backend como fonte de verdade para autorizacao.
- Nao reintroduzir `/aulas`, `aulaId`, `aula_id` ou `WorkspaceAula`.
- Migrations historicas podem conter nomes antigos; contratos publicos e modelos ativos devem seguir `Evento`.
- `OUTRO` continua reservado para preparacao de modelagem ate existir fluxo operacional dedicado.
- Rotas de dados sem `/api` retornam `404` e nao sao compatibilidade suportada.

## Proximas Entregas

1. DEV-21 PR 1: Security Gate e matriz de autorizacao — integrado no PR #41 (`ffbc290`).
2. DEV-21 PR 2: contratos canonicos, lifecycle e participantes — integrado no PR #42 (`2cdfc02`).
3. DEV-21 PR 3: equipes/rotacao — integrado no PR #43 (`a19927e`).
4. DEV-21 PR 4: partidas/lances — integrado no PR #44 (`4664eba`); DEV-21 concluida.
5. DEV-27: Playwright sem skips, runtime promovivel, bundle e ensaio rollback — slice ativo.
6. RC3 e evidencias isoladas; producao somente apos `GO v0.3.0` humano.

## Trabalho Adiado

- Deep-link puro `/eventos/:eventoId` sem contexto de Dia.
- Fluxo realtime com WebSocket/MQTT.
- Remocao da compatibilidade de auth por headers legados.
- Redesign visual amplo de Turmas, Turma detalhe, dashboards ou workspace.
