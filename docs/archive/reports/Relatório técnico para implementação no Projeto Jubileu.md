> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# RelatÃ³rio tÃ©cnico para implementaÃ§Ã£o no Projeto Jubileu

## Resumo executivo

O repositÃ³rio **FelipeDalMolin/projeto-jubileu** jÃ¡ tem uma direÃ§Ã£o arquitetural relativamente clara: backend em FastAPI com transiÃ§Ã£o incremental de um domÃ­nio persistido em **Aula** para uma semÃ¢ntica mais ampla de **Evento**, frontend em React/Vite/TypeScript, banco em PostgreSQL com Alembic, e um read-model versionado de **WorkspaceAula** para atender a UI. Essa direÃ§Ã£o nÃ£o estÃ¡ apenas no cÃ³digo; ela tambÃ©m aparece no backlog do îˆ€entityîˆ‚["company","Linear","project management software"]îˆ, especialmente nas decisÃµes sobre read-model, estado versionado e manutenÃ§Ã£o de polling, sem adoÃ§Ã£o imediata de tempo real. îˆ€fileciteîˆ‚turn173file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn139file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn177file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn175file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn176file0îˆ‚L1-L1îˆ

A melhor estratÃ©gia para uma tarefa ainda nÃ£o especificada Ã© **compatibility-first**: manter a persistÃªncia atual centrada em `Aula`, implementar novas regras em serviÃ§os ou mÃ³dulos, preservar contratos pÃºblicos jÃ¡ consumidos pelo frontend e introduzir migraÃ§Ãµes apenas quando o ganho de modelagem justificar o custo operacional. Essa abordagem Ã© coerente com as decisÃµes arquiteturais registradas no backlog, com o `main.py` mantendo rotas legadas e aliases `/api`, e com a prÃ³pria evoluÃ§Ã£o recente de TeamConfig, WorkspaceAula e UI modular. îˆ€fileciteîˆ‚turn175file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn176file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn177file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn139file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn179file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn178file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn180file0îˆ‚L1-L1îˆ

Os principais riscos hoje nÃ£o estÃ£o na ausÃªncia de base tÃ©cnica, e sim em **drift**: drift entre documentaÃ§Ã£o e cÃ³digo, drift entre schema e modelos, drift entre estratÃ©gia de autenticaÃ§Ã£o documentada e implementada, drift entre UI utilitÃ¡ria moderna e pÃ¡ginas ainda com estilos inline ou classes de Bootstrap sem dependÃªncia declarada, e drift entre o que Ã© validado em testes SQLite e o que realmente roda em PostgreSQL. Em outras palavras, o projeto jÃ¡ consegue receber bem uma nova tarefa, mas precisa de uma disciplina operacional maior para manter consistÃªncia Ã  medida que evolui. îˆ€fileciteîˆ‚turn174file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn166file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn167file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn171file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn145file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn160file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn161file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn130file0îˆ‚L1-L1îˆ

A conclusÃ£o prÃ¡tica Ã© simples: se a prÃ³xima tarefa for de back-end, banco, integraÃ§Ã£o ou front-end, o caminho mais seguro Ã© encaixÃ¡-la na arquitetura jÃ¡ emergente â€” **read-model para UI, serviÃ§o para regra, migration explÃ­cita para persistÃªncia, teste de regressÃ£o para contrato** â€” em vez de criar um atalho pontual dentro de router ou componente de pÃ¡gina. Isso maximiza previsibilidade e reduz retrabalho futuro. îˆ€fileciteîˆ‚turn175file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn176file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn177file0îˆ‚L1-L1îˆ

## Leitura arquitetural do repositÃ³rio

No îˆ€entityîˆ‚["company","GitHub","code hosting platform"]îˆ pÃºblico, o repositÃ³rio aparece com branch principal operacional `jubileu-v2`, cerca de 77 commits visÃ­veis na interface, estrutura inicial organizada em `backend/`, `frontend/`, `docs/`, `scripts/` e um `docker-compose.yml`, alÃ©m de zero issues e zero pull requests abertas no momento da captura pÃºblica. O README descreve o sistema como uma aplicaÃ§Ã£o para gerenciamento de eventos esportivos, jogadores, partidas e estatÃ­sticas, e documenta uma topologia conceitual React/Vite/TypeScript â†’ NGINX â†’ FastAPI â†’ PostgreSQL. îˆ€citeîˆ‚turn10view1îˆ

Na prÃ¡tica, o backend jÃ¡ estÃ¡ mais modular do que parte da documentaÃ§Ã£o sugere. O `main.py` cria a aplicaÃ§Ã£o FastAPI, injeta CORS e registra rotas legadas e aliases `/api` para boa parte dos routers. HÃ¡ um mÃ³dulo de autenticaÃ§Ã£o em `app/modules/auth/*`, uma camada de configuraÃ§Ã£o em `app/core/config.py`, sessÃ£o em `app/db/session.py`, bridge de compatibilidade em `app/database.py` e um `env.py` do Alembic que aponta `target_metadata` para `Base.metadata` e importa `app.models`, exatamente no padrÃ£o recomendado pela documentaÃ§Ã£o oficial do Alembic para autogeraÃ§Ã£o e sincronizaÃ§Ã£o de metadata. îˆ€fileciteîˆ‚turn139file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn129file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn128file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn165file0îˆ‚L1-L1îˆ îˆ€citeîˆ‚turn5view0îˆ‚turn5view1îˆ

O domÃ­nio persistido atual Ã© nitidamente centrado em `Dia`, `Aula`, `TimeAula`, `JogadorAula`, `Partida`, `EstatisticaJogadorPartida`, `EventoParticipante`, `Lance` e `TeamConfig`. A documentaÃ§Ã£o de domÃ­nio reconhece explicitamente que a persistÃªncia ainda Ã© â€œAula-cÃªntricaâ€, enquanto a direÃ§Ã£o semÃ¢ntica desejada Ã© â€œEvento-cÃªntricaâ€, e que `JogadorAula` e `EventoParticipante` ainda coexistem numa zona de sobreposiÃ§Ã£o conceitual controlada. O cÃ³digo confirma isso: `Aula` agrega times, jogadores, partidas, participantes, lances e configs versionadas; `TeamConfig` guarda snapshots versionados de equipes; `EventoParticipante` e `Lance` introduzem histÃ³rico operacional no estilo append-only. îˆ€fileciteîˆ‚turn173file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn133file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn135file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn136file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn137file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn138file0îˆ‚L1-L1îˆ

O frontend tambÃ©m mostra um estado de transiÃ§Ã£o. O `package.json` Ã© enxuto, com React 19, React Router, Tailwind e ESLint, sem TanStack Query e sem dependÃªncia declarada de Bootstrap. As rotas principais estÃ£o em `AppRoutes.tsx` e cobrem login, dias, aulas, eventos, turmas, jogadores e dashboards. O consumo de API Ã© majoritariamente manual, com hooks e services prÃ³prios; o workspace de aula, por exemplo, usa `fetch`, `since_version` e polling com `setTimeout`, em vez de uma biblioteca de server state. O backlog do Linear deixa claro que essa foi uma decisÃ£o deliberada: read-model estruturado para UI, polling versionado e, por ora, sem MQTT/WebSocket como mecanismo principal. îˆ€fileciteîˆ‚turn158file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn121file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn147file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn148file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn175file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn181file0îˆ‚L1-L1îˆ

As migrations mostram uma histÃ³ria realista de evoluÃ§Ã£o: a base `0001` cria o desenho inicial; `0003` remove `defesas`; `0007` corrige `aulas.turma_id` de `varchar` para `integer` com FK; `0009` adiciona versionamento a `aula_equipes_estado`; `e4f71ddd9d18` resolve merge heads; `0010` cria `team_configs`; `0011` adiciona status de partidas, participantes de evento e lances. Isso confirma duas coisas: o projeto jÃ¡ resolveu parte importante da modelagem que uma tarefa nova pode reutilizar, mas o histÃ³rico de migrations Ã© suficientemente complexo para exigir rollback claro, teste real em PostgreSQL e atenÃ§Ã£o a drift de schema. Os testes cobrem workspace, auth JWT/RBAC e fluxo de eventos, mas a fixture principal usa SQLite em memÃ³ria, mesmo com o cÃ³digo de produÃ§Ã£o proibindo SQLite como banco real. îˆ€fileciteîˆ‚turn166file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn172file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn167file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn168file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn171file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn169file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn170file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn130file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn149file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn150file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn151file0îˆ‚L1-L1îˆ

```mermaid
erDiagram
    Dia ||--o{ Aula : agrega
    Turma ||--o{ Aula : origina
    Aula ||--o{ TeamConfig : versiona
    Aula ||--o{ TimeAula : possui
    Aula ||--o{ JogadorAula : convoca
    TimeAula ||--o{ JogadorAula : aloca
    Aula ||--o{ Partida : organiza
    Partida ||--o{ EstatisticaJogadorPartida : consolida
    Aula ||--o{ EventoParticipante : registra
    Aula ||--o{ Lance : contextualiza
    Partida ||--o{ Lance : recebe
    Turma ||--o{ TurmaJogador : vincula
    Jogador ||--o{ TurmaJogador : vincula
```

O diagrama acima resume a topologia persistida mais relevante encontrada no cÃ³digo e na documentaÃ§Ã£o, e deixa claro um ponto importante para tarefas futuras: o eixo tÃ©cnico real do sistema ainda Ã© `Dia -> Aula -> TeamConfig/TimeAula/JogadorAula/Partida`, enquanto `Evento` funciona hoje mais como linguagem de produto, endpoints especÃ­ficos e backlog arquitetural do que como renomeaÃ§Ã£o completa da persistÃªncia. îˆ€fileciteîˆ‚turn173file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn135file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn136file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn137file0îˆ‚L1-L1îˆ

## Lacunas, inconsistÃªncias e dÃ­vida tÃ©cnica

A inconsistÃªncia mais visÃ­vel Ã© de **versÃ£o e documentaÃ§Ã£o**. O README pÃºblico apresenta `0.2.0` como versÃ£o atual em abril de 2026, o backend expÃµe `APP_VERSION = "0.1.0"`, e o frontend declara `"version": "0.0.0"` em `package.json`. Em paralelo, o README e a arquitetura documentam NGINX como parte do fluxo de implantaÃ§Ã£o, mas o artefato operacional presente no repositÃ³rio raiz Ã© um `docker-compose.yml` com apenas um serviÃ§o PostgreSQL. Isso nÃ£o torna o projeto errado, mas diminui a confiabilidade da documentaÃ§Ã£o como â€œfonte Ãºnica da verdadeâ€ para implementaÃ§Ã£o de novas tarefas. îˆ€citeîˆ‚turn10view1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn158file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn157file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn174file0îˆ‚L1-L1îˆ

A Ã¡rea de **autenticaÃ§Ã£o** Ã© hoje o hotspot mais crÃ­tico. No backend, hÃ¡ contas default codificadas no source (`admin/admin123`, `coach/coach123`, etc.), JWT assinado manualmente com HMAC e `JWT_SECRET` default como `"CHANGE_ME"`. No frontend, `AuthContext` persiste sessÃ£o em `localStorage` e, se o login JWT falha, faz fallback silencioso para modo legado, permitindo entrar como `user` local mesmo sem bearer token. Isso Ã© Ã³timo para desenvolvimento rÃ¡pido e compatibilidade, mas introduz risco de comportamento ambÃ­guo, enfraquece a validaÃ§Ã£o de fluxo real e dificulta distinguir bug de autenticaÃ§Ã£o de fallback de conveniÃªncia. îˆ€fileciteîˆ‚turn125file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn126file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn145file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn146file0îˆ‚L1-L1îˆ

A dÃ­vida de **UI e design system** tambÃ©m Ã© significativa. O repositÃ³rio configurou Tailwind, utilitÃ¡rios (`clsx`, `tailwind-merge`) e atÃ© um `Button` utilitÃ¡rio consistente, mas pÃ¡ginas importantes ainda usam estilos inline extensivos e classes tÃ­picas de Bootstrap (`container`, `btn`, `card`, `form-control`) sem que `bootstrap` apareÃ§a no `package.json`. Isso sugere uma UI em transiÃ§Ã£o: parte antiga, parte nova, com fragmentaÃ§Ã£o de padrÃµes e maior custo de manutenÃ§Ã£o cada vez que uma tarefa de front precisa tocar componentes compartilhados. îˆ€fileciteîˆ‚turn158file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn159file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn160file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn161file0îˆ‚L1-L1îˆ

No banco e em migrations, a dÃ­vida Ã© menos conceitual e mais **operacional**. O histÃ³rico evidencia correÃ§Ãµes de schema, remoÃ§Ã£o de colunas, merge de heads e criaÃ§Ã£o de estruturas idempotentes para resolver drift anterior. Isso Ã© perfeitamente administrÃ¡vel, mas significa que qualquer tarefa que altere persistÃªncia precisa nascer jÃ¡ com estratÃ©gia de migraÃ§Ã£o, teste em PostgreSQL e rollback. A documentaÃ§Ã£o de arquitetura reconhece isso explicitamente, e os testes atuais ainda nÃ£o cobrem integralmente diferenÃ§as de PostgreSQL como enums, defaults e DDL transacional porque a suÃ­te central usa SQLite em memÃ³ria. îˆ€fileciteîˆ‚turn166file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn167file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn171file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn174file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn130file0îˆ‚L1-L1îˆ

HÃ¡ ainda inconsistÃªncias pequenas, mas com alto valor de correÃ§Ã£o: o `requirements.txt` e o `.env.example` do backend usam `psycopg`/psycopg3, enquanto o Quick Start documenta `psycopg2` no exemplo de `DATABASE_URL`; no frontend, o `.env.example` usa `VITE_API_BASE_URL`, enquanto o Quick Start mostra `VITE_API_URL`; o README e parte da arquitetura ainda descrevem estado anterior da modularizaÃ§Ã£o, enquanto o cÃ³digo jÃ¡ avanÃ§ou para `app/core`, `app/db` e `app/modules/auth`. Esses detalhes parecem cosmÃ©ticos, mas sÃ£o exatamente o tipo de ruÃ­do que faz uma tarefa simples consumir horas em setup, onboarding ou troubleshooting. îˆ€fileciteîˆ‚turn154file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn155file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn156file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn153file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn174file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn139file0îˆ‚L1-L1îˆ

## Plano de implementaÃ§Ã£o priorizado

Como o problema exato, a camada-alvo e a natureza da mudanÃ§a ainda nÃ£o foram especificados, o plano abaixo foi desenhado como **roteiro adaptÃ¡vel**, mas amarrado aos pontos reais do repositÃ³rio. A prioridade nÃ£o Ã© â€œmexer primeiro no cÃ³digoâ€; Ã© **congelar critÃ©rio de aceite e contrato**, depois tocar a menor superfÃ­cie possÃ­vel. Essa sequÃªncia Ã© a que mais respeita a arquitetura e evita regressÃµes em um repositÃ³rio jÃ¡ em transiÃ§Ã£o incremental. îˆ€fileciteîˆ‚turn175file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn176file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn177file0îˆ‚L1-L1îˆ

| Tipo de tarefa provÃ¡vel | Arquivos mais provÃ¡veis | EsforÃ§o | MigraÃ§Ã£o | ObservaÃ§Ã£o |
|---|---|---:|---|---|
| Ajuste de regra em Aula/Evento/Workspace | `backend/jubileu-api-fastapi/app/routers/dias.py`, `app/routers/eventos.py`, novo `app/services/...`, `tests/test_workspace_aula.py`, `tests/test_eventos_api.py` | M | NÃ£o, em geral | Melhor caminho para regra de negÃ³cio ou DTO |
| Nova entidade persistida ligada a Aula/Evento | `app/models/dia_aula_*.py` ou novo model, `alembic/versions/*`, router/service correspondente, testes de API e migration | Mâ€“L | Sim | SÃ³ abra migration se a regra precisa durar no banco |
| MudanÃ§a de autenticaÃ§Ã£o/autorizaÃ§Ã£o | `app/modules/auth/*`, `app/deps_auth.py`, `frontend/src/context/AuthContext.tsx`, `frontend/src/services/authService.ts`, `.env.example` | M | NÃ£o | Prioridade alta de seguranÃ§a, baixa de produto |
| IntegraÃ§Ã£o de UI em tela existente | `frontend/src/pages/...`, `frontend/src/hooks/...`, `frontend/src/services/...`, `src/routes/AppRoutes.tsx` | Sâ€“M | NÃ£o | Preferir composiÃ§Ã£o por service/hook, nÃ£o lÃ³gica na pÃ¡gina |
| Hardening de infra/dev experience | `docker-compose.yml`, `scripts/setup_backend.sh`, `docs/QUICK_START.md`, `.env.example`, pipeline de teste | Sâ€“M | NÃ£o | Alto retorno, baixo risco |
| EvoluÃ§Ã£o de timeline/eventos append-only | `app/models/dia_aula_event.py`, `app/routers/eventos.py`, `app/routers/partidas.py`, migration nova, `tests/test_eventos_api.py`, UI de partidas | L | Sim | JÃ¡ hÃ¡ backlog explÃ­cito no Linear para isso |

A recomendaÃ§Ã£o prÃ¡tica Ã© tratar a prÃ³xima tarefa em **cinco fases curtas**. Primeiro, determinar se ela altera sÃ³ contrato/read-model ou se exige esquema novo. Segundo, atacar a regra em serviÃ§o e deixar o router o mais fino possÃ­vel. Terceiro, abrir migration apenas se a persistÃªncia nova for inevitÃ¡vel; se a mudanÃ§a puder ser representada como read-model derivado, evite custo de schema. Quarto, integrar no frontend por `service + hook + page`, e nÃ£o por fetch local espalhado. Quinto, fechar com teste e atualizaÃ§Ã£o de documentaÃ§Ã£o operacional. Esse fluxo Ã© exatamente o que o prÃ³prio backlog do Linear jÃ¡ materializa em TeamConfig, WorkspaceAula e UI da Aula. îˆ€fileciteîˆ‚turn179file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn178file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn180file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn181file0îˆ‚L1-L1îˆ

```mermaid
flowchart LR
    A[Definir problema e aceite] --> B[Mapear agregado afetado]
    B --> C{Precisa mudar schema?}
    C -- NÃ£o --> D[Implementar serviÃ§o e DTO]
    C -- Sim --> E[Model + migration + rollback]
    D --> F[Teste de contrato e regressÃ£o]
    E --> F
    F --> G[IntegraÃ§Ã£o React por service/hook]
    G --> H[Smoke test em PostgreSQL]
    H --> I[Atualizar docs e setup]
```

Se eu precisasse priorizar **uma** melhoria estrutural antes de quase qualquer nova tarefa, seria: criar uma trilha de teste mÃ­nima em PostgreSQL real para migrations e contratos principais. O segundo investimento com melhor retorno seria endurecer auth para remover fallback silencioso e segredos default. O terceiro seria consolidar o padrÃ£o de front â€” ou Tailwind/utilitÃ¡rios, ou outro sistema â€” para que novas telas nÃ£o continuem ampliando a fragmentaÃ§Ã£o existente. îˆ€fileciteîˆ‚turn130file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn125file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn145file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn158file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn159file0îˆ‚L1-L1îˆ

## PadrÃµes, snippets e alternativas

Os snippets abaixo nÃ£o assumem a tarefa final do usuÃ¡rio; eles mostram **o jeito certo de ligar uma mudanÃ§a full-stack a este repositÃ³rio**. Usei como exemplo um subrecurso `evento_notas`, porque ele Ã© simples, cabe no domÃ­nio atual e demonstra o que costuma ser necessÃ¡rio em model, migration, router, integraÃ§Ã£o React e Compose. O padrÃ£o foi derivado do desenho atual de modelos, auth modular, rotas `/api` e serviÃ§os React prÃ³prios. îˆ€fileciteîˆ‚turn135file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn137file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn140file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn146file0îˆ‚L1-L1îˆ

```python
# backend/jubileu-api-fastapi/app/models/evento_nota.py
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class EventoNota(Base):
    __tablename__ = "evento_notas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    aula_id: Mapped[int] = mapped_column(ForeignKey("aulas.id"), nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String(120), nullable=False)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    aula = relationship("Aula")
```

```python
# backend/jubileu-api-fastapi/alembic/versions/xxxx_evento_notas.py
from alembic import op
import sqlalchemy as sa

revision = "xxxx_evento_notas"
down_revision = "0011_evento_participantes_lances"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "evento_notas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("aula_id", sa.Integer(), sa.ForeignKey("aulas.id"), nullable=False),
        sa.Column("titulo", sa.String(length=120), nullable=False),
        sa.Column("conteudo", sa.Text(), nullable=False),
        sa.Column("created_by_user_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_evento_notas_aula_id", "evento_notas", ["aula_id"])

def downgrade() -> None:
    op.drop_index("ix_evento_notas_aula_id", table_name="evento_notas")
    op.drop_table("evento_notas")
```

```python
# backend/jubileu-api-fastapi/app/routers/evento_notas.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.deps import get_db
from app.modules.auth.deps import get_current_user, AuthUser
from app.models.evento_nota import EventoNota
from app.models.dia_aula import Aula

router = APIRouter(prefix="/api/eventos", tags=["Eventos"])

class EventoNotaIn(BaseModel):
    titulo: str = Field(min_length=1, max_length=120)
    conteudo: str = Field(min_length=1)

class EventoNotaOut(BaseModel):
    id: int
    aula_id: int
    titulo: str
    conteudo: str
    created_by_user_id: str | None

@router.get("/{evento_id}/notas", response_model=list[EventoNotaOut])
def listar_notas(
    evento_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
):
    aula = db.get(Aula, evento_id)
    if not aula:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento nÃ£o encontrado")

    notas = (
        db.query(EventoNota)
        .filter(EventoNota.aula_id == evento_id)
        .order_by(EventoNota.id.desc())
        .all()
    )
    return notas

@router.post("/{evento_id}/notas", response_model=EventoNotaOut, status_code=status.HTTP_201_CREATED)
def criar_nota(
    evento_id: int,
    payload: EventoNotaIn,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
):
    aula = db.get(Aula, evento_id)
    if not aula:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento nÃ£o encontrado")

    nota = EventoNota(
        aula_id=evento_id,
        titulo=payload.titulo.strip(),
        conteudo=payload.conteudo.strip(),
        created_by_user_id=user.user_id,
    )
    db.add(nota)
    db.commit()
    db.refresh(nota)
    return nota
```

```ts
// frontend/jubileu-web/src/services/eventos/notasService.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function buildUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export type EventoNota = {
  id: number;
  aula_id: number;
  titulo: string;
  conteudo: string;
  created_by_user_id: string | null;
};

export async function listarNotasEvento(eventoId: number, token?: string) {
  const resp = await fetch(buildUrl(`/api/eventos/${eventoId}/notas`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!resp.ok) throw new Error(`Erro ao listar notas: ${resp.status}`);
  return (await resp.json()) as EventoNota[];
}

export async function criarNotaEvento(
  eventoId: number,
  input: { titulo: string; conteudo: string },
  token?: string,
) {
  const resp = await fetch(buildUrl(`/api/eventos/${eventoId}/notas`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!resp.ok) throw new Error(`Erro ao criar nota: ${resp.status}`);
  return (await resp.json()) as EventoNota;
}
```

```tsx
// ponto de integraÃ§Ã£o em EventoPage.tsx
import { useEffect, useState } from "react";
import { criarNotaEvento, listarNotasEvento, type EventoNota } from "../../services/eventos/notasService";
import { useAuth } from "../../context/AuthContext";

function EventoNotasPanel({ eventoId }: { eventoId: number }) {
  const { user } = useAuth();
  const [notas, setNotas] = useState<EventoNota[]>([]);

  useEffect(() => {
    void listarNotasEvento(eventoId, user?.accessToken ?? undefined).then(setNotas);
  }, [eventoId, user?.accessToken]);

  async function onSubmit() {
    const nova = await criarNotaEvento(
      eventoId,
      { titulo: "ObservaÃ§Ã£o", conteudo: "Texto da anotaÃ§Ã£o" },
      user?.accessToken ?? undefined,
    );
    setNotas((prev) => [nova, ...prev]);
  }

  return (
    <section>
      <button onClick={onSubmit}>Adicionar nota</button>
      <ul>{notas.map((n) => <li key={n.id}>{n.titulo}</li>)}</ul>
    </section>
  );
}
```

O `docker-compose.yml` atual Ã© suficiente para levantar um PostgreSQL local, mas estÃ¡ minimalista e usa a chave `version`, que a especificaÃ§Ã£o atual do Docker trata como obsoleta. Como o prÃ³prio Docker documenta, o ideal Ã© usar Compose Specification, remover a dependÃªncia do campo `version` e, quando houver serviÃ§o de API no stack, usar `healthcheck` com `depends_on.condition: service_healthy` para evitar race condition na subida. îˆ€fileciteîˆ‚turn157file0îˆ‚L1-L1îˆ îˆ€citeîˆ‚turn9search0îˆ‚turn7search0îˆ‚turn9search1îˆ

```yaml
name: jubileu

services:
  db:
    image: postgres:16
    container_name: jubileu_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: jubileu
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

volumes:
  postgres_data:
```

Para evoluÃ§Ã£o de leitura e sincronizaÃ§Ã£o de estado no frontend, eu recomendo avaliar a tabela abaixo antes de comeÃ§ar qualquer refactor maior. Hoje o repositÃ³rio usa polling manual com `since_version`; isso Ã© coerente com o backlog do Linear e com a existÃªncia de read-model orientado Ã  UI. O React oficial observa que buscar dados diretamente em `useEffect` Ã© uma abordagem muito manual, com riscos de waterfall e ausÃªncia de cache; jÃ¡ o TanStack Query fornece cache, refetch controlado e polling nativo. Meu diagnÃ³stico Ã©: **nÃ£o** iria direto para WebSocket/MQTT agora; primeiro consolidaria REST versionado e, se o front ficar mais complexo, migraria o polling manual para TanStack Query. îˆ€fileciteîˆ‚turn175file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn181file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn147file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn148file0îˆ‚L1-L1îˆ îˆ€citeîˆ‚turn6search4îˆ‚turn6search1îˆ‚turn6search5îˆ

| PadrÃ£o | SituaÃ§Ã£o no repo | Vantagens | Desvantagens | RecomendaÃ§Ã£o |
|---|---|---|---|---|
| Polling manual com `fetch` + `since_version` | JÃ¡ implementado | Baixo custo, sem nova dependÃªncia, combina com WorkspaceAula | Mais boilerplate, cache manual, mais propenso a inconsistÃªncia | Bom default de curto prazo |
| TanStack Query sobre as mesmas rotas REST | NÃ£o implementado | Cache, invalidaÃ§Ã£o, polling declarativo, retry e controle de staleness | Introduz biblioteca e padrÃ£o novo de estado | Melhor evoluÃ§Ã£o de mÃ©dio prazo |
| MQTT/WebSocket/tempo real ativo | Deliberadamente adiado | Menor latÃªncia percebida | Maior custo de infra, observabilidade e sincronizaÃ§Ã£o | NÃ£o priorizar agora |

## Comandos operacionais e limitaÃ§Ãµes

Os comandos realmente documentados no repositÃ³rio mostram um fluxo simples para desenvolvimento. No backend, o setup shell instala dependÃªncias, roda `alembic upgrade head` e recomenda iniciar com `uvicorn app.main:app --reload`; o Quick Start tambÃ©m documenta `pytest tests/ -v`. No frontend, os scripts declarados sÃ£o `dev`, `build`, `lint` e `preview`. No Docker, o artefato de raiz hoje levanta apenas o banco PostgreSQL. îˆ€fileciteîˆ‚turn144file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn153file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn158file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn157file0îˆ‚L1-L1îˆ

```bash
# backend
cd backend/jubileu-api-fastapi
python -m venv .venv
source .venv/bin/activate   # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
pytest tests/ -v
```

```bash
# frontend
cd frontend/jubileu-web
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

```bash
# banco local
docker compose up -d db
docker compose ps
docker compose logs -f db
docker compose down
```

Eu nÃ£o encontrei, nos arquivos inspecionados, um comando de lint equivalente para o backend como hÃ¡ no frontend; portanto, se a prÃ³xima tarefa tiver impacto relevante em Python, vale incluir no mesmo pacote de mudanÃ§a um padrÃ£o explÃ­cito de lint/format para backend, mesmo que isso seja feito depois em PR separado. O mesmo vale para pipeline de teste em PostgreSQL: hoje a suÃ­te Ãºtil existe, mas nÃ£o fecha completamente a lacuna entre ambiente de teste e ambiente de produÃ§Ã£o. îˆ€fileciteîˆ‚turn158file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn154file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn130file0îˆ‚L1-L1îˆ

Como limitaÃ§Ãµes desta pesquisa, trÃªs dados continuam abertos porque nÃ£o vieram especificados pelo pedido original: qual Ã© o problema exato a resolver, em qual camada ele cai primeiro e se a tarefa Ã© extensÃ£o de um fluxo jÃ¡ existente ou recurso novo. Sem isso, o plano acima Ã© o melhor â€œarcabouÃ§o de implementaÃ§Ã£oâ€ possÃ­vel, mas nÃ£o escolhe sozinho entre, por exemplo, tocar `dias.py`, `eventos.py`, `partidas.py`, `AuthContext.tsx` ou abrir nova migration. Ainda assim, o diagnÃ³stico de alto nÃ­vel Ã© robusto: o caminho mais seguro para qualquer tarefa futura Ã© respeitar o eixo `Aula` persistida + `Evento` semÃ¢ntico + `WorkspaceAula` como read-model + `TeamConfig` como snapshot versionado, e corrigir em paralelo os principais pontos de drift que hoje elevam o custo de mudanÃ§a. îˆ€fileciteîˆ‚turn173file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn177file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn179file0îˆ‚L1-L1îˆ
