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

Marco integrado mais recente antes do ciclo de dashboards: `35e868c DEV-51: Close operational flow QA and reconciliation (#34)`.

Estado consolidado:

- Backend FastAPI preserva `/api` como contrato canonico de gateway.
- `/health` e `/api/health` existem para diagnostico.
- Middleware de `X-Request-ID` gera ou preserva o id de correlacao e devolve o header na response.
- Frontend possui `apiClient` minimo com base relativa `/api` e `X-Request-ID`.
- `npm run check:api-contract` valida separacao entre rotas SPA e chamadas de API.
- `pytest` cobre smoke, contratos e fluxos backend/API.
- Playwright cobre o fluxo operacional AULA/JOGO_LIVRE, polling/auth e dashboards no compose dev
  usando Chromium nativo do Alpine via `E2E_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser`.
- GitHub Actions passa a ser o gate oficial minimo de CI para backend, frontend e contratos.
- Vercel pode aparecer no historico por integracao externa, mas nao e gate oficial de qualidade ou runtime do projeto.

## Marco Ativo

O marco ativo e a estabilizacao operacional com validacao auditavel de UC/CT:

- provar que o app continua buildando;
- provar que contratos backend/API nao quebram;
- provar que o frontend nao chama `/api/api`;
- iniciar cobertura E2E de navegador com Playwright;
- registrar lacunas honestamente quando a UI ou o ambiente ainda nao permitem automacao completa.

## Trilhas de Execucao

### Backend/API

Foco:

- preservar rotas canonicas sob `/api`;
- manter rotas legadas apenas por compatibilidade, sem trata-las como contrato novo;
- manter `/health` e `/api/health`;
- manter `X-Request-ID` em responses;
- ampliar testes `pytest` por UC/CT;
- validar integracao real com PostgreSQL quando `DATABASE_URL_TEST` estiver disponivel;
- nao alterar migrations, models ou regras de dominio fora de slices explicitamente planejadas.

### Frontend

Foco:

- manter rotas SPA separadas das chamadas de dados;
- migrar services gradualmente para `apiClient`, sem big bang;
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
| Playwright E2E | passed-e2e-dev | Fluxos AULA/JOGO_LIVRE e workspace operacional possuem fixtures executáveis. |
| PostgreSQL real | passed-local/pending-CI | Concorrência de próxima partida passou localmente; falta tornar PostgreSQL gate do CI. |
| GitHub Actions | Operacional | Backend, frontend, docs sync e preflight são gates de PR para `jubileu-v2`. |
| UC06-UC09 E2E | passed-e2e-dev | Presença/RSVP, fila, partida, lance e próxima partida cobertos no compose dev. |

## Regras de Compatibilidade

- Preservar o contrato de gateway `/api`.
- Nao criar `/api/api`.
- Manter o backend como fonte de verdade para autorizacao.
- Nao reintroduzir `/aulas`, `aulaId`, `aula_id` ou `WorkspaceAula`.
- Migrations historicas podem conter nomes antigos; contratos publicos e modelos ativos devem seguir `Evento`.
- `OUTRO` continua reservado para preparacao de modelagem ate existir fluxo operacional dedicado.
- Rotas legadas sem `/api` podem existir por compatibilidade, mas nao devem orientar novo desenvolvimento frontend.

## Proximas Entregas

1. Entregar rastreabilidade Dia -> Evento -> Partida nos dashboards (DEV-48).
2. Corrigir o cleanup Tailwind dos dashboards em issue própria, sem rebranding.
3. Executar auth hardening (DEV-43).
4. Tornar PostgreSQL, Alembic e Playwright operacional gates bloqueantes do CI (DEV-44).
5. Executar smoke e preparar a tag `v0.3.0` (DEV-45).

## Trabalho Adiado

- Deep-link puro `/eventos/:eventoId` sem contexto de Dia.
- Fluxo realtime com WebSocket/MQTT.
- Remocao da compatibilidade de auth por headers legados.
- Redesign visual amplo de Turmas, Turma detalhe, dashboards ou workspace.
- Cobertura E2E completa de UC06-UC09 sem fixtures auditaveis.
