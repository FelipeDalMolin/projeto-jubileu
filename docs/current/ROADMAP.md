# Roadmap do Projeto Jubileu

## Direcao

O Projeto Jubileu usa `Evento` como entidade operacional canonica:

```text
Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas
```

`AULA` permanece apenas como modo/tipo de evento (`Evento.tipo = AULA`). Novos trabalhos nao devem criar modelos publicos, rotas publicas ou payloads baseados em uma entidade `Aula`.

O contrato publico de dados deve preservar o gateway `/api`. Rotas de navegacao da SPA, como `/dias`, sao diferentes de rotas de dados, como `/api/dias`.

## Estado Atual

Branch de trabalho: `jubileu-v2`.

Marco tecnico mais recente: `fe06768 Ajuste em routes da API`.

Estado consolidado:

- Backend FastAPI preserva `/api` como contrato canonico de gateway.
- `/health` e `/api/health` existem para diagnostico.
- Middleware de `X-Request-ID` gera ou preserva o id de correlacao e devolve o header na response.
- Frontend possui `apiClient` minimo com base relativa `/api` e `X-Request-ID`.
- `npm run check:api-contract` valida separacao entre rotas SPA e chamadas de API.
- `pytest` cobre smoke, contratos e fluxos backend/API.
- Playwright esta configurado para E2E inicial, mas a execucao local atual ficou bloqueada por dependencias nativas do browser e API local indisponivel.

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
- evitar refatoracao visual fora de escopo;
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
- Playwright no ambiente/CI precisa de dependencias nativas instaladas.

## Janela Atual de Fechamento

| Area | Status | Observacao |
|---|---|---|
| Contrato `/api` | Implementado | `/api/health`, rotas canonicas e guarda contra `/api/api`. |
| Correlacao de requests | Implementado | `X-Request-ID` no frontend/base client, middleware FastAPI e docs operacionais. |
| Backend pytest | Operacional | Baseline atual: `44 passed, 2 skipped`; skips por `DATABASE_URL_TEST`. |
| Frontend build | Operacional | `npm run build` passa. |
| Contrato frontend/API | Operacional | `npm run check:api-contract` passa. |
| Playwright E2E | Configurado/blocked | Specs criadas; execucao local bloqueada por `libnspr4.so` ausente e API local desligada. |
| UC06-UC09 E2E | Pendente | Requer fixtures completas de participantes, equipes, partidas e lances. |

## Regras de Compatibilidade

- Preservar o contrato de gateway `/api`.
- Nao criar `/api/api`.
- Manter o backend como fonte de verdade para autorizacao.
- Nao reintroduzir `/aulas`, `aulaId`, `aula_id` ou `WorkspaceAula`.
- Migrations historicas podem conter nomes antigos; contratos publicos e modelos ativos devem seguir `Evento`.
- `OUTRO` continua reservado para preparacao de modelagem ate existir fluxo operacional dedicado.
- Rotas legadas sem `/api` podem existir por compatibilidade, mas nao devem orientar novo desenvolvimento frontend.

## Proximas Entregas

1. Habilitar Playwright no ambiente/CI:
   - instalar dependencias nativas (`npx playwright install-deps` ou equivalente);
   - subir backend local saudavel em `E2E_API_URL`;
   - executar `npm run test:e2e` ate pelo menos UC01/contrato passarem.

2. Ampliar E2E de UC02 a UC05:
   - criar jogador e turma pela UI;
   - abrir dia pela UI;
   - criar evento/aula pela UI;
   - validar requests `/api/...` e ausencia de `/api/api`.

3. Preparar fixtures completas para UC06-UC09:
   - participantes e usuarios vinculados;
   - presenca/check-in;
   - equipes/rotacao;
   - partidas em andamento;
   - lances e estatisticas.

4. Migrar services gradualmente para `apiClient`:
   - manter headers de auth/compatibilidade;
   - preservar `/api`;
   - validar com `check:api-contract` e Playwright.

5. Validar PostgreSQL real:
   - definir `DATABASE_URL_TEST`;
   - rodar testes hoje skipped;
   - registrar evidencia no `TEST_PLAN.md`.

## Trabalho Adiado

- Deep-link puro `/eventos/:eventoId` sem contexto de Dia.
- Fluxo realtime com WebSocket/MQTT.
- Remocao da compatibilidade de auth por headers legados.
- Redesign visual amplo de Turmas, Turma detalhe, dashboards ou workspace.
- Cobertura E2E completa de UC06-UC09 sem fixtures auditaveis.
