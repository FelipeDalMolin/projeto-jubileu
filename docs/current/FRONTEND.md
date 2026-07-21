# Frontend Atual

Este documento descreve a organizacao viva do frontend React/Vite. Para rotas e chamadas
API extraidas do codigo, confira [`../generated/code-map.md`](../generated/code-map.md).

## Stack

- React + Vite + TypeScript.
- Rotas com `react-router-dom`.
- Estado remoto parcialmente em services diretos e parcialmente em TanStack Query.
- E2E com Playwright em `frontend/jubileu-web/e2e`.

## Estrutura Principal

| Caminho | Papel |
|---|---|
| `src/App.tsx` | Shell com `AuthProvider`, `BrowserRouter`, `Navbar` e `AppRoutes`. |
| `src/routes/AppRoutes.tsx` | Rotas SPA canonicas. |
| `src/context/AuthContext.tsx` | Sessao/autenticacao no frontend. |
| `src/lib/apiClient.ts` | Cliente minimo com base `/api` e `X-Request-ID`. |
| `src/services/` | Chamadas ao backend e mapeamento DTO. |
| `src/types/` | Tipos de dominio e DTOs frontend. |
| `src/pages/` | Paginas por area funcional. |
| `src/workspaces/evento/` | Workspace operacional do evento. |
| `src/components/` | Componentes reutilizaveis e paineis. |

## Padrao Visual

- Tailwind CSS e componentes locais em `src/components/ui` e `src/components/layout`
  sao o padrao para novas telas e refactors visuais.
- Bootstrap nao e dependencia do projeto; classes como `container`, `row`, `col-*`,
  `btn-*`, `form-control`, `alert` e `badge bg-*` nao devem ser usadas como contrato
  de UI nova.
- Nao instalar Bootstrap, shadcn/ui ou biblioteca visual nova neste slice. Qualquer
  dependencia futura deve justificar consistencia, velocidade, acessibilidade,
  manutencao, impacto visual e risco de dependencia.
- A UI deve ser operacional, densa e responsiva: formularios e listas empilham no
  mobile, tabelas usam overflow controlado e estados de erro/loading ficam visiveis.

## Rotas SPA Canonicas

- `/login`
- `/dias`
- `/dias/:dataIso`
- `/dias/:dataIso/eventos/:eventoId`
- `/turmas`, `/turmas/nova`, `/turmas/:turmaId`
- `/jogadores`
- `/dashboard`, `/dashboard/jogadores`, `/dashboard/partidas`, `/dashboard/estatisticas`
- `/usuario`

Nao reintroduzir `/dias/:dataIso/aulas/:aulaId`, `/aulas`, `aulaId` ou `WorkspaceAula`
em codigo ativo. `AULA` e somente valor de `Evento.tipo`.

## Contrato Frontend/API

- Chamadas de dados devem usar `/api/...`.
- Rotas de tela como `/dias` sao diferentes de rotas de dados como `/api/dias`.
- `npm run check:api-contract` protege contra `/api/api` e chamadas suspeitas sem `/api`.
- O frontend pode mostrar affordances por papel, mas autorizacao critica pertence ao backend.
- Services devem preservar `Evento`, `eventoId` e `evento_id` como linguagem publica.

## Estado, Polling E Workspace

Padrao aprovado:

```text
estado local imediato -> persistencia por comando/evento -> polling agora -> WebSocket futuro
```

Aplicacao pratica:

- interacoes de equipes podem atualizar localmente para responsividade;
- comandos persistem via services para backend;
- workspace/estado usa polling com versao ou TanStack Query;
- evitar fan-out, hidden-tab churn e loops repetidos de `401`;
- WebSocket/MQTT permanece futuro, nao default atual.

## Direcao De Evolucao

- Migrar services gradualmente para um cliente comum sem big bang.
- Manter mappers nos services quando backend usa snake_case e frontend camelCase.
- Adicionar testes Playwright quando mudar navegacao, formularios, auth ou workspace operacional.
- Atualizar `docs/generated/code-map.md` quando rotas ou services mudarem.
- Revisar chamadas legadas apontadas no mapa gerado antes de trata-las como contrato ativo.

## Calendario

`/dias` funciona como hub de eventos usando o contrato atual `GET /api/dias`.
O calendario pode mostrar dots por evento, filtros locais por tipo/status e navegacao
para `/dias/:dataIso/eventos/:eventoId`.

Campos como quadra, capacidade e minha participacao exigem read-model futuro antes de
virarem UI de calendario.

## Validacao

```bash
cd frontend/jubileu-web
npm run lint
npm run build
npm run check:api-contract
```

Quando possivel:

```bash
cd frontend/jubileu-web
npm run test:e2e
```

Se Playwright falhar por ambiente, registrar se o bloqueio e browser, dependencia nativa,
Vite, API local ou runtime NGINX.

Quando rotas ou services mudarem, gere novamente o mapa do codigo:

```bash
python3 scripts/docs/generate_code_map.py
```
