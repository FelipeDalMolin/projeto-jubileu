> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# RelatÃ³rio de arquitetura e plano de refatoraÃ§Ã£o do Projeto Jubileu

## Executive summary

A base atual do backend do Jubileu (em `backend/jubileu-api-fastapi/app/`) jÃ¡ contÃ©m peÃ§as importantes que estÃ£o **alinhadas com os princÃ­pios do â€œProjeto Jubileu Coreâ€** (separaÃ§Ã£o entre *estado*, *eventos* e *snapshot*, e read-model orientado Ã  UI). Isso aparece claramente no **WorkspaceAula** (read-model) e no uso de **TeamConfig** como versionamento de snapshot de equipes, alÃ©m do endpoint de â€œlancesâ€ que jÃ¡ se parece com um log append-only. îˆ€fileciteîˆ‚turn23file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn22file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn10file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file19îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file18îˆ‚L1-L1îˆ

O maior gargalo â€œde saÃºdeâ€ hoje nÃ£o Ã© a inexistÃªncia de â€œservicesâ€ (hÃ¡ `app/services/*`), e sim:

1) **CoesÃ£o e modularizaÃ§Ã£o**: regras e escrituras de domÃ­nio estÃ£o espalhadas em routers grandes (principalmente `routers/dias.py` e `routers/partidas.py`) e em um â€œmega-modeloâ€ (`models/dia_aula.py`) com muitas entidades nÃ£o coesas no mesmo arquivo. îˆ€fileciteîˆ‚turn12file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn14file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ

2) **ConfiguraÃ§Ã£o e sessÃ£o de banco**: existe um `app/database.py` que carrega `.env` com `python-dotenv`, cria `engine` e `SessionLocal`, e Ã© consumido por `deps.py`. Funciona, mas dificulta padronizar *settings*, *logging*, *CORS*, *auth* e deploy. îˆ€fileciteîˆ‚turn29file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn28file0îˆ‚L1-L1îˆ

3) **Migrations possivelmente incompletas/desalinhadas**: a migration `0001_jubileu_v2_base.py` nÃ£o reflete vÃ¡rias estruturas presentes nos modelos atuais (por exemplo, tipos/campos e entidades que o cÃ³digo jÃ¡ usa). Isso Ã© risco operacional alto porque â€œrodar do zeroâ€ pode quebrar. îˆ€fileciteîˆ‚turn49file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ

4) **Versionamento de release**: no îˆ€entityîˆ‚["organization","GitHub","code hosting platform"]îˆ nÃ£o hÃ¡ releases publicados para o repositÃ³rio (no momento do acesso). Isso impede um fluxo â€œprofissionalâ€ de deploy/rastreabilidade via tags + changelog. îˆ€citeîˆ‚turn3view0îˆ

A recomendaÃ§Ã£o Ã© uma refatoraÃ§Ã£o **incremental** e compatÃ­vel com os princÃ­pios CORE: criar uma estrutura `app/core`, `app/db` e `app/modules` (ou `app/domains`) que **nÃ£o muda o comportamento** no primeiro ciclo (apenas move cÃ³digo e cria camadas), e em ciclos seguintes ataca migraÃ§Ãµes, padronizaÃ§Ã£o de rotas (`/api`), e autenticaÃ§Ã£o JWT. O ponto-chave: **o â€œCoreâ€ do Jubileu (decisÃµes conceituais)** nÃ£o Ã© a mesma coisa que a pasta `app/core` (infra transversal). A documentaÃ§Ã£o precisa deixar isso explÃ­cito para nÃ£o gerar ambiguidade. îˆ€fileciteîˆ‚turn54file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file19îˆ‚L1-L1îˆ

## EvidÃªncias, arquivos inspecionados e suposiÃ§Ãµes

### Escopo e branch analisada

A anÃ¡lise de cÃ³digo foi feita sobre o repositÃ³rio `FelipeDalMolin/projeto-jubileu` na branch `jubileu-v2` (default configurado no conector). îˆ€fileciteîˆ‚turn2file0îˆ‚L1-L1îˆ

### Arquivos inspecionados

Backend (principais):

- `backend/jubileu-api-fastapi/app/main.py` îˆ€fileciteîˆ‚turn9file0îˆ‚L1-L1îˆ
- `backend/jubileu-api-fastapi/app/database.py`, `app/deps.py`, `app/deps_auth.py` îˆ€fileciteîˆ‚turn29file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn28file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn30file0îˆ‚L1-L1îˆ
- Routers: `app/routers/{dias.py,partidas.py,jogadores.py,turmas.py,eventos.py}` îˆ€fileciteîˆ‚turn12file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn14file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn11file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn13file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn10file0îˆ‚L1-L1îˆ
- Modelos: `app/models/dia_aula.py`, `app/models/jogador_turma.py`, `app/models/__init__.py` îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn17file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn43file0îˆ‚L1-L1îˆ
- Schemas: `app/schemas/{dia_aula.py,eventos.py,workspace.py}` îˆ€fileciteîˆ‚turn19file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn18file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn51file0îˆ‚L1-L1îˆ
- Services: `app/services/{estado_equipes.py,workspace_aula.py}` îˆ€fileciteîˆ‚turn22file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn23file0îˆ‚L1-L1îˆ
- Dashboards: `app/api/dashboards/*` + `app/services/dashboards/*` îˆ€fileciteîˆ‚turn24file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn25file0îˆ‚L1-L1îˆ

MigraÃ§Ãµes e setup:

- `backend/jubileu-api-fastapi/alembic/env.py`, `alembic.ini`, `alembic/versions/0001_jubileu_v2_base.py` îˆ€fileciteîˆ‚turn42file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn41file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn49file0îˆ‚L1-L1îˆ
- `.env.example`, `requirements.txt`, `docker-compose.yml` îˆ€fileciteîˆ‚turn38file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn39file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn34file0îˆ‚L1-L1îˆ
- Scripts: `scripts/setup_backend_structure.ps1`, `setup_backend.ps1`, etc. îˆ€fileciteîˆ‚turn54file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn37file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn36file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn35file0îˆ‚L1-L1îˆ

Frontend (mÃ­nimo para deploy):

- `frontend/jubileu-web/package.json` îˆ€fileciteîˆ‚turn52file0îˆ‚L1-L1îˆ

Documentos:

- `README.md`, `docs/SETUP_DEV_WINDOWS.md` îˆ€fileciteîˆ‚turn3file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn4file0îˆ‚L1-L1îˆ

Conector Linear (decisÃµes CORE e issues DEV relevantes):

- CORE-1, CORE-2, CORE-3, CORE-4, CORE-5, CORE-6 e DEV-5, DEV-10, DEV-11, DEV-13, DEV-14, DEV-15 etc. îˆ€fileciteîˆ‚turn50file19îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file18îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file17îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file16îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file12îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file7îˆ‚L1-L1îˆ

### SuposiÃ§Ãµes e limitaÃ§Ãµes

- NÃ£o hÃ¡ releases publicados no repositÃ³rio no GitHub (confirmado via pÃ¡gina do repo). îˆ€citeîˆ‚turn3view0îˆ
- NÃ£o foi possÃ­vel confirmar via web a lista de tags do repo por limitaÃ§Ãµes do crawler (portanto, **tags existentes/nÃ£o existentes** nÃ£o foram assertadas; apenas â€œreleasesâ€ foi confirmado).
- HÃ¡ indÃ­cios fortes de **desalinhamento entre schema real e modelos**, porque a migration base nÃ£o cria vÃ¡rias entidades/campos que aparecem no cÃ³digo atual. A recomendaÃ§Ã£o inclui um passo explÃ­cito para â€œfecharâ€ essa lacuna com migraÃ§Ãµes novas e/ou `alembic stamp` + migraÃ§Ã£o corretiva (detalhado no plano). îˆ€fileciteîˆ‚turn49file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ

## Modelo de domÃ­nio atual e pontos de confusÃ£o

### VisÃ£o conceitual alinhada ao Jubileu Core

As decisÃµes CORE definem explicitamente:

- **Estado**: fotografia consolidada e versionada (para a UI).
- **Evento**: histÃ³rico append-only.
- **Snapshot**: materializaÃ§Ã£o do estado em um ponto no tempo. îˆ€fileciteîˆ‚turn50file18îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file19îˆ‚L1-L1îˆ

No cÃ³digo, isso aparece como:

- `WorkspaceAulaOut` e `build_workspace_aula()` como **read-model** (monta meta/header/kpis/equipes/partidas/warnings). îˆ€fileciteîˆ‚turn51file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn23file0îˆ‚L1-L1îˆ
- `TeamConfig` + `create_team_config()` / `rebuild_estado_equipes()` como **snapshot versionado** de equipes (com `version` incremental e `is_active`). îˆ€fileciteîˆ‚turn22file0îˆ‚L1-L1îˆ
- `Lance` + endpoints em `routers/eventos.py` sugerindo **event log** (append mostrado via `created_at`, `client_event_id`, etc.). îˆ€fileciteîˆ‚turn18file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn10file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ

### Entidades e relacionamentos atuais (ERD em Mermaid)

```mermaid
erDiagram
  JOGADOR ||--o{ TURMA_JOGADOR : "pertence"
  TURMA ||--o{ TURMA_JOGADOR : "contÃ©m"

  DIA ||--o{ AULA : "tem"
  TURMA ||--o{ AULA : "origem"

  AULA ||--o{ JOGADOR_AULA : "snapshot-presenÃ§a"
  JOGADOR ||--o{ JOGADOR_AULA : "pode referenciar (opcional)"

  AULA ||--o{ TIME_AULA : "teams"
  AULA ||--o{ TEAM_CONFIG : "snapshots equipes"
  AULA ||--o{ PARTIDA : "jogos"

  TIME_AULA ||--o{ PARTIDA : "time_a_id/time_b_id"
  PARTIDA ||--o{ ESTATISTICA_JOGADOR_PARTIDA : "stats"
  JOGADOR_AULA ||--o{ ESTATISTICA_JOGADOR_PARTIDA : "stats por jogador-na-aula"

  AULA ||--o{ EVENTO_PARTICIPANTE : "rsvp/checkin"
  JOGADOR ||--o{ EVENTO_PARTICIPANTE : "participa"

  PARTIDA ||--o{ LANCE : "log de eventos"
  AULA ||--o{ LANCE : "escopo da aula"
  JOGADOR ||--o{ LANCE : "autor opcional"
```

Fontes do modelo (classes SQLAlchemy/mapeamentos e schemas): îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn17file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn19file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn18file0îˆ‚L1-L1îˆ

### Esclarecendo as entidades que geraram dÃºvida

#### JogadorAula

Nos schemas, fica explÃ­cito que **JogadorAula nÃ£o Ã© o Jogador global**, mas sim um **snapshot do â€œjogador dentro da aulaâ€** (com status e vÃ­nculo a time dentro da aula). Isso aparece tanto na ideia do `PresencaJogadorDiaOut` (â€œsnapshot do jogador dentro da aulaâ€) quanto em `JogadorAulaOut`. îˆ€fileciteîˆ‚turn19file0îˆ‚L1-L1îˆ

Por que isso existe?

- Permite registrar presenÃ§as/ausÃªncias e stats da sessÃ£o sem â€œsujarâ€ o `Jogador` global.
- Permite que uma mesma pessoa (Jogador global) tenha mÃºltiplas presenÃ§as histÃ³ricas, uma por aula/dia.
- TambÃ©m permite casos em que `JogadorAula.jogador_id` seja `NULL` (ex.: convidado, registro manual, ou legado). îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ

#### EventoParticipante

Hoje, â€œEventoParticipanteâ€ parece cumprir o papel de **participaÃ§Ã£o operacional no evento (RSVP / check-in / check-out)**, separado do snapshot de presenÃ§a usado no Workspace.

Exemplos no router `eventos.py`:

- `POST /api/eventos/{evento_id}/rsvp` (`rsvp_self`)
- `POST /api/eventos/{evento_id}/checkin` (`checkin_self`)
- `POST /api/eventos/{evento_id}/checkout` etc. îˆ€fileciteîˆ‚turn10file0îˆ‚L1-L1îˆ

E no schema `EventoParticipanteOut` aparecem campos tÃ­picos desse fluxo (status, timestamps, arrival_seq). îˆ€fileciteîˆ‚turn18file0îˆ‚L1-L1îˆ

**InterpretaÃ§Ã£o de domÃ­nio**:
- `JogadorAula` = presenÃ§a/participaÃ§Ã£o no contexto do planejamento de aula e times/partidas.
- `EventoParticipante` = presenÃ§a fÃ­sica/operacional no evento (confirmou? chegou em qual ordem? fez check-in?), Ãºtil para â€œJogo Livreâ€ com fila/ordem e para geraÃ§Ã£o de partidas automaticamente.

Isso sugere que vocÃª estÃ¡ caminhando para um domÃ­nio â€œEvento (Aula/Jogo Livre)â€, mas ainda existe uma duplicidade semÃ¢ntica: *presenÃ§a* aparece em dois lugares (status em `JogadorAula` e status em `EventoParticipante`). Isso Ã© ok no curto prazo, mas no longo prazo convÃ©m definir â€œfonte da verdadeâ€ (ex.: `EventoParticipante` governa o check-in e alimenta um snapshot em `JogadorAula`, ou vice-versa).

#### ParticipacaoEvento (inexistente como nome, mas existe como conceito)

VocÃª citou â€œParticipacaoEventoâ€. No cÃ³digo, o nome concreto Ã© `EventoParticipante`. îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn18file0îˆ‚L1-L1îˆ

Um bom passo de refatoraÃ§Ã£o Ã© padronizar o vocabulÃ¡rio:

- PersistÃªncia: `evento_participantes` (tabela) / `EventoParticipante` (modelo)
- DomÃ­nio (docs): â€œParticipaÃ§Ã£o no Eventoâ€
- API: `/api/eventos/{id}/participantes` etc. (jÃ¡ existe listagem). îˆ€fileciteîˆ‚turn10file0îˆ‚L1-L1îˆ

### Onde o domÃ­nio atual conflita com a estrutura â€œidealâ€

1) O arquivo `models/dia_aula.py` concentra muitas classes diferentes (Dia, Aula, TimeAula, JogadorAula, Partida, EstatisticaJogadorPartida, EventoParticipante, Lance, enums). Isso reduz coesÃ£o e aumenta acoplamento. îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ

2) Os routers, especialmente `dias.py`, misturam: validaÃ§Ã£o HTTP, queries SQLAlchemy, regras de negÃ³cio (ex.: versionamento, rebuild de snapshots, regras de status), e atÃ© montagem de payloads. îˆ€fileciteîˆ‚turn12file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn14file0îˆ‚L1-L1îˆ

3) O â€œCoreâ€ do Jubileu (decisÃµes CORE-1/2/3) pede rastreabilidade e separaÃ§Ã£o entre decisÃµes e execuÃ§Ã£o. Hoje, hÃ¡ documentaÃ§Ã£o conceitual no Linear, mas falta consolidar isso em docs no repositÃ³rio (README aponta `docs/ARCHITECTURE.md` e `docs/DOMAIN_MODEL.md`, mas esses arquivos nÃ£o existem). îˆ€fileciteîˆ‚turn3file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file19îˆ‚L1-L1îˆ

## Comparativo de estrutura atual vs estrutura-alvo e impacto

A seguir, uma proposta que respeita:

- PrincÃ­pios CORE (read-model, evento vs estado vs snapshot). îˆ€fileciteîˆ‚turn50file19îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file18îˆ‚L1-L1îˆ
- A intenÃ§Ã£o do script `setup_backend_structure.ps1` (core/db/modules), porÃ©m ajustada para a realidade do cÃ³digo atual. îˆ€fileciteîˆ‚turn54file0îˆ‚L1-L1îˆ
- O fato de jÃ¡ existir `app/services/*` e `app/api/dashboards/*` (portanto, nÃ£o Ã© â€œcomeÃ§ar do zeroâ€, Ã© reorganizar). îˆ€fileciteîˆ‚turn23file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn24file0îˆ‚L1-L1îˆ

### Tabela comparativa

| Estrutura atual (exemplos reais) | Estrutura-alvo proposta (modules/core/db) | Impacto na refatoraÃ§Ã£o (risco, esforÃ§o, testes/migrations, compat) |
|---|---|---|
| `app/main.py` cria `FastAPI()` e registra routers diretamente, incluindo dashboards. îˆ€fileciteîˆ‚turn9file0îˆ‚L1-L1îˆ | `app/main.py` vira â€œcomposition rootâ€: `create_app()` + inclusÃ£o de routers por mÃ³dulo; configs e middlewares em `core/`. | **Risco baixo** (mudanÃ§a mecÃ¢nica). **EsforÃ§o**: pequeno/mÃ©dio. **Testes**: smoke test de rotas. **Compat**: total (mesmas rotas). |
| `app/database.py` carrega `.env` via `dotenv`, valida `DATABASE_URL`, cria `engine`, `SessionLocal`, `Base`. îˆ€fileciteîˆ‚turn29file0îˆ‚L1-L1îˆ | `app/core/config.py` (Pydantic Settings) centraliza env; `app/db/session.py` cria engine/session; `app/db/base.py` mantÃ©m import de modelos. | **Risco baixo/mÃ©dio** (se mexer em import order). **EsforÃ§o**: mÃ©dio. **Testes**: startup + DB connect test. **Compat**: total se `DATABASE_URL` mantido. Fontes: Pydantic Settings îˆ€citeîˆ‚turn22search0îˆ e SQLAlchemy session lifecycle îˆ€citeîˆ‚turn22search4îˆ. |
| `app/models/dia_aula.py` contÃ©m muitas entidades. îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ | `app/modules/aulas/models.py`, `modules/partidas/models.py`, `modules/eventos/models.py` etc; cada mÃ³dulo exporta seus modelos; `db/base.py` importa todos. | **Risco mÃ©dio** (alembic autogenerate depende de import). **EsforÃ§o**: mÃ©dio/alto. **Testes**: migrations autogenerate sanity + queries principais. **Compat**: total (mesmas tabelas). Alembic autogenerate requer `target_metadata` com modelos importados îˆ€citeîˆ‚turn23search0îˆ. |
| Routers grandes (`routers/dias.py`, `routers/partidas.py`) com regras e queries acopladas. îˆ€fileciteîˆ‚turn12file0îˆ‚L1-L1îˆ | `modules/dias/routes.py` sÃ³ HTTP; `modules/dias/service.py` regras; `modules/dias/repo.py` (opcional) para queries. | **Risco baixo/mÃ©dio**. **EsforÃ§o**: alto (mas incremental). **Testes**: unit tests de services + integration tests de endpoints. **Compat**: manter payloads do front (Workspace DTO). CORE-3/DEV-5 reforÃ§am read-model estÃ¡vel. îˆ€fileciteîˆ‚turn50file17îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file15îˆ‚L1-L1îˆ |
| `deps_auth.py` usa headers `X-User-Id`, `X-Role`, `X-Jogador-Id` (auth â€œmockâ€). îˆ€fileciteîˆ‚turn30file0îˆ‚L1-L1îˆ | `modules/auth` com `users` + JWT, `OAuth2PasswordBearer` e hashing de senha; headers viram compatibilidade temporÃ¡ria (feature flag). | **Risco mÃ©dio** (mudanÃ§a de contrato). **EsforÃ§o**: mÃ©dio/alto. **Testes**: auth flow + RBAC tests. **Compat**: fornecer modo â€œlegacy headersâ€ por um ciclo. FastAPI security docs existem (OAuth2 + JWT). îˆ€citeîˆ‚turn26view0îˆ |
| `routers/eventos.py` estÃ¡ em `/api/*`, mas outros routers nÃ£o; API base inconsistente. îˆ€fileciteîˆ‚turn10file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn11file0îˆ‚L1-L1îˆ | Padronizar `/api` para tudo (com redirect/alias temporÃ¡rio). | **Risco mÃ©dio** (front). **EsforÃ§o**: mÃ©dio. **Testes**: contract tests. **Compat**: manter antigas rotas por um ciclo com `include_router` duplicado ou redirects 307. |
| Alembic: existe `env.py` apontando `Base.metadata` e importando `app.models`. îˆ€fileciteîˆ‚turn42file0îˆ‚L1-L1îˆ | Manter o padrÃ£o, mas garantir que `db/base.py` importa todos os mÃ³dulos; migrations corretivas para divergÃªncias. | **Risco alto** se DB real divergir. **EsforÃ§o**: alto dependendo do estado do DB. **Testes**: migration tests em DB limpo + staging. OperaÃ§Ãµes de rename/alter sÃ£o suportadas. îˆ€citeîˆ‚turn25search0îˆ |
| NÃ£o hÃ¡ releases no GitHub (â€œNo releases publishedâ€). îˆ€citeîˆ‚turn3view0îˆ | Introduzir SemVer + tags + release notes + `RELEASES.md`. | **Risco baixo** (processual). **EsforÃ§o**: pequeno. **Testes**: checklist de release. Fonte: docs GitHub releases. îˆ€citeîˆ‚turn2search3îˆ |

## Plano de execuÃ§Ã£o priorizado

O plano estÃ¡ organizado em fases, para manter o projeto sempre â€œrodandoâ€ e reduzir risco (princÃ­pio de evoluÃ§Ã£o incremental do CORE-1). îˆ€fileciteîˆ‚turn50file19îˆ‚L1-L1îˆ

### Fase de estabilizaÃ§Ã£o e inventÃ¡rio

Objetivo: garantir que sabemos â€œo que existeâ€ e reduzir risco de quebrar ambiente.

Tarefas:

- Criar `docs/DOMAIN_MODEL.md` e `docs/ARCHITECTURE.md` (faltam hoje, apesar do README sugerir). îˆ€fileciteîˆ‚turn3file0îˆ‚L1-L1îˆ
- Escrever um script de smoke test (pytest) que:
  - sobe app (`TestClient`)
  - verifica `/health` (adicionar endpoint)
  - lista rotas essenciais (dias/aulas/turmas/jogadores/eventos/workspace/dashboards).
- Validar a trabalhabilidade do Alembic:
  - Rodar `alembic upgrade head` em um banco vazio e rodar o backend, verificando se tabelas usadas pelo cÃ³digo existem.
  - Se falhar (provÃ¡vel, dado o gap entre migration e modelos), escolher uma estratÃ©gia:
    - **EstratÃ©gia A (mais segura)**: criar nova migration corretiva (sem apagar a base).
    - **EstratÃ©gia B (se DB de produÃ§Ã£o nÃ£o existe)**: â€œresetâ€ das migrations e recriar baseline consistente (somente se nÃ£o hÃ¡ dados reais).
  EvidÃªncia do baseline atual: `0001_jubileu_v2_base.py`. îˆ€fileciteîˆ‚turn49file0îˆ‚L1-L1îˆ

Git workflow:

- Branch: `chore/stabilize-tests-and-docs`
- PR checklist:
  - [ ] app sobe com `uvicorn app.main:app` (como docs sugerem) îˆ€fileciteîˆ‚turn4file0îˆ‚L1-L1îˆ
  - [ ] `pytest` passa
  - [ ] docs geradas

### Fase de modularizaÃ§Ã£o sem alterar comportamento

Objetivo: reorganizar em `core/db/modules` sem mudar o contrato.

Tarefas (ordem recomendada):

1) Criar `app/core/config.py` usando `pydantic-settings` (jÃ¡ estÃ¡ no `requirements.txt` como dependÃªncia recomendada). îˆ€fileciteîˆ‚turn39file0îˆ‚L1-L1îˆ îˆ€citeîˆ‚turn22search0îˆ
2) Criar `app/db/session.py` e `app/db/base.py`.
   - `base.py` deve importar os modelos (ou mÃ³dulos) para garantir `Base.metadata` completo (ponto crÃ­tico para Alembic autogenerate). îˆ€fileciteîˆ‚turn42file0îˆ‚L1-L1îˆ îˆ€citeîˆ‚turn23search0îˆ
3) Ajustar `app/deps.py` para usar `SessionLocal` de `db/session.py`. PadrÃ£o de â€œlifecycle externoâ€ do SQLAlchemy Ã© recomendado (gerenciar sessÃ£o fora da lÃ³gica). îˆ€fileciteîˆ‚turn28file0îˆ‚L1-L1îˆ îˆ€citeîˆ‚turn22search4îˆ
4) Refatorar `main.py` para `create_app()` + inclusÃ£o de routers agrupados.
5) Migrar aos poucos serviÃ§os existentes para `modules/*/service.py`, comeÃ§ando por:
   - `modules/aulas` (Workspace e estado)
   - `modules/eventos` (RSVP/check-in/lances)
   - `modules/dashboards` (jÃ¡ Ã© â€œquase mÃ³duloâ€)

Git workflow:

- Branch: `refactor/modularize-app-shell`
- Tags (internas, sem release ainda): `v0.2.0-dev.1` (apenas tag anotada) â€” se adotarem SemVer.

### Fase de reorganizaÃ§Ã£o por domÃ­nio e reduÃ§Ã£o do â€œmega-modeloâ€

Objetivo: aumentar coesÃ£o e diminuir acoplamento.

Tarefas:

- Quebrar `models/dia_aula.py` em mÃºltiplos arquivos por domÃ­nio:
  - `modules/dias/models.py` â†’ `Dia`
  - `modules/aulas/models.py` â†’ `Aula`, `JogadorAula`, `TimeAula`, `TeamConfig`
  - `modules/partidas/models.py` â†’ `Partida`, `EstatisticaJogadorPartida`
  - `modules/eventos/models.py` â†’ `EventoParticipante`, `Lance`
- Criar â€œbarrel importsâ€ em `db/base.py` e remover `app/models/__init__.py` como â€œregistrador globalâ€ (ou manter, mas apontando para `db/base.py`). Hoje `app/models/__init__.py` jÃ¡ cumpre esse papel para Alembic. îˆ€fileciteîˆ‚turn43file0îˆ‚L1-L1îˆ

Testes:

- Unit tests de service (sem FastAPI).
- Integration tests com `TestClient` (endpoints).
- Migration tests: subir DB limpo, aplicar migrations, rodar queries bÃ¡sicas.

### Fase de rotas `/api`, compatibilidade e contrato

Objetivo: padronizar e preparar NGINX/Front.

Tarefas:

- Definir API base:
  - opÃ§Ã£o recomendada: tudo sob `/api`, e manter rotas antigas por 1 release (redirect 307 ou alias).
- Documentar em `API.md` o contrato do Workspace e endpoints principais (CORE-3). îˆ€fileciteîˆ‚turn50file17îˆ‚L1-L1îˆ
- Ajustar front gradualmente se necessÃ¡rio (DEV-6/DEV-15 mostram histÃ³rico de mudanÃ§as no consumo do Workspace). îˆ€fileciteîˆ‚turn50file14îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file4îˆ‚L1-L1îˆ

### Fase de autenticaÃ§Ã£o definitiva e RBAC

Objetivo: substituir `deps_auth.py` (headers) por JWT, mantendo modo legacy temporÃ¡rio.

Tarefas:

- Criar `modules/auth`:
  - `models.py`: `User` (e possivelmente `UserSession`/refresh tokens).
  - `service.py`: `hash_password`, `verify_password`, `create_access_token`, `decode_token`.
  - `routes.py`: `/api/auth/login`, `/api/auth/me`, `/api/auth/register` (ou convite).
- Migrar endpoints sensÃ­veis para `Depends(get_current_user)` e `require_roles`.
- Manter compatibilidade: por um tempo, permitir â€œauth por headerâ€ se `settings.AUTH_MODE=legacy`.

### Alembic: passos concretos para rename de tabelas/colunas

Se a mudanÃ§a â€œsignificativa no domÃ­nioâ€ incluir renomear camada de persistÃªncia (por exemplo, `aulas` â†’ `eventos`), use migraÃ§Ãµes explÃ­citas com `op.rename_table()` e `op.alter_column(new_column_name=...)`. îˆ€citeîˆ‚turn25search0îˆ

SequÃªncia recomendada (PostgreSQL):

1) `alembic revision -m "rename aulas to eventos"`
2) Na migration:
   - `op.rename_table("aulas", "eventos")`
   - `op.alter_column("jogadores_aula", "aula_id", new_column_name="evento_id")`
   - atualizar FKs/constraints conforme necessÃ¡rio
3) Atualizar modelos para refletir novos nomes
4) Rodar `alembic upgrade head` em staging
5) Validar que o read-model (Workspace) continua igual (contrato com front)

**Nota**: renames sÃ£o manuais; autogenerate nÃ£o detecta renome com seguranÃ§a (tende a propor drop+add). Por isso o passo manual Ã© obrigatÃ³rio. Base conceitual de operaÃ§Ãµes de rename: Alembic Operations API. îˆ€citeîˆ‚turn25search0îˆ

## Snippets de cÃ³digo recomendados

Os exemplos abaixo focam no â€œesqueletoâ€ modular e em boas prÃ¡ticas de config/sessÃ£o, preservando a stack atual (FastAPI + SQLAlchemy 2 + Pydantic v2).

### `app/main.py` (composition root + factory)

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules import api_router  # agregador de routers

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.APP_VERSION,
        openapi_url=f"{settings.API_PREFIX}/openapi.json",
        docs_url=f"{settings.API_PREFIX}/docs",
        redoc_url=f"{settings.API_PREFIX}/redoc",
    )

    # CORS (configure estritamente em produÃ§Ã£o)
    if settings.CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.CORS_ORIGINS,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(api_router, prefix=settings.API_PREFIX)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app

app = create_app()
```

ReferÃªncia do middleware CORS e parÃ¢metros: FastAPI `CORSMiddleware` na documentaÃ§Ã£o oficial. îˆ€citeîˆ‚turn26view0îˆ

### `app/core/config.py` (Pydantic Settings)

```python
# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    PROJECT_NAME: str = "Jubileu API"
    APP_VERSION: str = "0.2.0-dev"
    API_PREFIX: str = "/api"

    DATABASE_URL: str = Field(..., description="postgresql+psycopg://...")

    # SeguranÃ§a / Auth
    JWT_SECRET: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Deploy
    CORS_ORIGINS: List[str] = []

settings = Settings()
```

Pydantic Settings `BaseSettings` e `env_file`: documentaÃ§Ã£o oficial do Pydantic. îˆ€citeîˆ‚turn22search0îˆ

### `app/db/session.py` e `app/db/base.py`

```python
# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # evita conexÃµes mortas
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    future=True,
)
```

`pool_pre_ping` Ã© uma prÃ¡tica recomendada na docs do SQLAlchemy (connection pooling). îˆ€citeîˆ‚turn22search6îˆ

```python
# app/db/base.py
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# IMPORTANTE: importar mÃ³dulos de models para registrar no metadata
from app.modules.aulas import models as aulas_models  # noqa
from app.modules.dias import models as dias_models  # noqa
from app.modules.jogadores import models as jogadores_models  # noqa
from app.modules.eventos import models as eventos_models  # noqa
from app.modules.partidas import models as partidas_models  # noqa
```

O ponto-chave aqui Ã© garantir que `target_metadata` do Alembic veja todas as tabelas (importar modelos). îˆ€citeîˆ‚turn23search0îˆ

### `app/deps.py` (get_db)

```python
# app/deps.py
from typing import Generator
from sqlalchemy.orm import Session
from app.db.session import SessionLocal

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Isso Ã© equivalente ao estilo atual (`deps.py` jÃ¡ existe), apenas movendo a origem do `SessionLocal`. îˆ€fileciteîˆ‚turn28file0îˆ‚L1-L1îˆ

### Exemplo de mÃ³dulo: `app/modules/eventos/`

Estrutura sugerida:

```
app/modules/eventos/
  __init__.py
  models.py
  schemas.py
  service.py
  routes.py
```

`routes.py` (exemplo simplificado):

```python
# app/modules/eventos/routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db
from app.modules.auth.deps import get_current_user  # JWT
from app.modules.eventos import schemas, service

router = APIRouter(prefix="/eventos", tags=["Eventos"])

@router.post("/{evento_id}/checkin", response_model=schemas.EventoParticipanteOut)
def checkin_self(
    evento_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    return service.checkin_self(db=db, evento_id=evento_id, jogador_id=user.jogador_id)
```

A lÃ³gica real hoje estÃ¡ diretamente no router `app/routers/eventos.py`; o objetivo Ã© mover para `service.py`. îˆ€fileciteîˆ‚turn10file0îˆ‚L1-L1îˆ

## Deploy, seguranÃ§a e operaÃ§Ã£o

### NGINX: servir React (Vite build) e proxy para FastAPI

O frontend Ã© um projeto Vite/React (`vite build`) e por padrÃ£o gera `dist/`. îˆ€fileciteîˆ‚turn52file0îˆ‚L1-L1îˆ

Exemplo de server block NGINX:

```nginx
server {
    listen 80;
    server_name jubileu.example.com;

    # Frontend (Vite build)
    root /var/www/jubileu-web/dist;
    index index.html;

    # SPA routing: qualquer rota desconhecida cai no index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Base tÃ©cnica:
- `try_files` na doc do NGINX (core module) îˆ€citeîˆ‚turn21search3îˆ
- `proxy_pass` e regras de mapeamento na doc oficial do mÃ³dulo proxy îˆ€citeîˆ‚turn21search4îˆ
- Guia NGINX reverse proxy (admin guide) îˆ€citeîˆ‚turn21search6îˆ

Se futuramente houver WebSocket (por MQTT via WebSocket), adicionar headers `Upgrade`/`Connection` conforme doc oficial do NGINX sobre WebSocket proxying. îˆ€citeîˆ‚turn19search6îˆ

### Process manager: systemd unit (Gunicorn/ASGI ou Uvicorn)

**OpÃ§Ã£o A (recomendada para produÃ§Ã£o)**: Gunicorn com worker ASGI nativo (menos dependÃªncia de worker externo). îˆ€citeîˆ‚turn19search5îˆ
**OpÃ§Ã£o B**: Uvicorn multiprocess (`--workers`) ou Gunicorn + uvicorn-worker (atenÃ§Ã£o ao aviso de depreciaÃ§Ã£o em algumas docs do Uvicorn). îˆ€citeîˆ‚turn19search0îˆ

Exemplo com Gunicorn ASGI (`/etc/systemd/system/jubileu-api.service`):

```ini
[Unit]
Description=Jubileu API (FastAPI)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/projeto-jubileu/backend/jubileu-api-fastapi
EnvironmentFile=/opt/projeto-jubileu/backend/jubileu-api-fastapi/.env
ExecStart=/opt/projeto-jubileu/backend/jubileu-api-fastapi/.venv/bin/gunicorn \
  app.main:app \
  --worker-class asgi \
  --workers 4 \
  --bind 127.0.0.1:8000 \
  --access-logfile - \
  --error-logfile -

Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

ReferÃªncias:
- `Restart=on-failure` e comportamento de service restart: systemd docs. îˆ€citeîˆ‚turn20search8îˆ
- Conceitos de unit file e seÃ§Ãµes `ExecStart`, `WorkingDirectory`, etc: Red Hat docs (boa explicaÃ§Ã£o estruturada). îˆ€citeîˆ‚turn20search4îˆ

### HTTPS com Certbot

- Certbot Ã© recomendado pela Letâ€™s Encrypt como cliente ACME. îˆ€citeîˆ‚turn20search6îˆ
- O fluxo â€œcertbot + nginxâ€ Ã© documentado e amplamente usado; para instruÃ§Ãµes especÃ­ficas, usar o gerador oficial do Certbot. îˆ€citeîˆ‚turn21search1îˆ

Checklist de hosting (alto nÃ­vel):

- [ ] `DEBUG` desligado (se existir), logs estruturados
- [ ] CORS restrito ao domÃ­nio do front (nÃ£o `*` em produÃ§Ã£o), conforme parÃ¢metros oficiais do CORSMiddleware. îˆ€citeîˆ‚turn26view0îˆ
- [ ] `X-Forwarded-*` corretamente setado e app confiando apenas no proxy local (Uvicorn tem seÃ§Ã£o especÃ­fica de forwarded headers). îˆ€citeîˆ‚turn19search0îˆ
- [ ] Secrets fora do Git (usar `.env` e permissÃµes de arquivo)
- [ ] Backup de Postgres e migraÃ§Ãµes testadas

## Auth, versionamento de releases e documentaÃ§Ã£o

### Arquitetura de usuÃ¡rios/autenticaÃ§Ã£o recomendada

Hoje existe um auth â€œde cabeÃ§alhoâ€ (`X-User-Id`, `X-Role`, `X-Jogador-Id`). Isso Ã© Ãºtil como *stub* local, mas nÃ£o Ã© adequado para produÃ§Ã£o. îˆ€fileciteîˆ‚turn30file0îˆ‚L1-L1îˆ

RecomendaÃ§Ã£o:

- `users` (autenticaÃ§Ã£o) â‰  `jogadores` (domÃ­nio do futebol)
- Um `User` pode (opcionalmente) estar ligado a um `Jogador` (`user.jogador_id`) para habilitar â€œaÃ§Ãµes do jogadorâ€ (ex.: check-in self).
- Roles: `admin`, `treinador`, `auxiliar`, `user` (vocabulÃ¡rio jÃ¡ existe no stub). îˆ€fileciteîˆ‚turn30file0îˆ‚L1-L1îˆ

Fluxo JWT (resumo):

```mermaid
flowchart LR
  A[POST /api/auth/login] --> B[verifica senha + role]
  B --> C[gera JWT access token]
  C --> D[Front armazena token]
  D --> E[Requests com Authorization: Bearer]
  E --> F[Depends(get_current_user)]
  F --> G[RBAC / require_roles]
```

FastAPI possui documentaÃ§Ã£o de middleware e seguranÃ§a (inclui OAuth2/JWT) na doc oficial. îˆ€citeîˆ‚turn26view0îˆ

Endpoints mÃ­nimos:

- `POST /api/auth/login` â†’ retorna `{access_token, token_type}`
- `GET /api/auth/me` â†’ retorna profile + role + jogador_id
- (Opcional) `POST /api/auth/register` ou convite/admin-only

Hash de senha:

- Adicionar dependÃªncia: `passlib[bcrypt]` (ou `bcrypt`).
- Nunca armazenar senha em texto puro.

### Releases, versionamento e tags

SituaÃ§Ã£o atual:

- No GitHub, **nÃ£o hÃ¡ releases publicados** para o repositÃ³rio neste momento. îˆ€citeîˆ‚turn3view0îˆ

Proposta de modelo â€œprofissionalâ€:

- SemVer: `vMAJOR.MINOR.PATCH` + sufixos `-alpha.N`, `-beta.N`, `-rc.N`.
- Tags anotadas e PRs com checklist.
- `RELEASES.md` com changelog por versÃ£o.

ReferÃªncia oficial de como GitHub entende e gerencia releases: documentaÃ§Ã£o â€œManaging releasesâ€. îˆ€citeîˆ‚turn2search3îˆ

### O que documentar e templates sugeridos

Criar (na pasta `docs/`):

1) `DOMAIN_MODEL.md`
   - vocabulÃ¡rio (â€œAulaâ€ vs â€œEventoâ€), fonte da verdade para presenÃ§a, relaÃ§Ã£o entre `TeamConfig`/`Lance`/`WorkspaceAula`.
2) `ARCHITECTURE.md`
   - princÃ­pios CORE-1 (rastreabilidade), e como o cÃ³digo implementa (mÃ³dulos, read-model, eventos). îˆ€fileciteîˆ‚turn50file19îˆ‚L1-L1îˆ
3) `API.md`
   - contrato do Workspace DTO (CORE-3/DEV-5) e rotas (/api). îˆ€fileciteîˆ‚turn50file17îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file15îˆ‚L1-L1îˆ
4) `RELEASES.md`
   - changelog e polÃ­tica de compatibilidade.

### TODO priorizado com donos, estimativas e critÃ©rios de aceite

| Prioridade | TODO | Dono (papel) | Tamanho | Aceite |
|---|---|---:|---:|---|
| P0 | Criar docs `DOMAIN_MODEL.md` + `ARCHITECTURE.md` com decisÃµes CORE incorporadas | Tech Lead | M | Docs referenciam CORE-1/2/3; descrevem entidades atuais e regras de estado/evento/snapshot |
| P0 | Testes smoke + CI local (`pytest`) | Backend | M | `pytest` valida startup, DB connection, endpoints crÃ­ticos |
| P0 | Fechar gap de migrations vs modelos (migraÃ§Ã£o corretiva ou reset controlado) | Backend | G | DB â€œzeradoâ€ sobe e app roda sem erro; staging aplica migrations com sucesso |
| P1 | Introduzir `core/config.py` + `db/session.py` + `db/base.py` sem mudar comportamento | Backend | M | Rotas e respostas iguais; `DATABASE_URL` centralizado |
| P1 | Modularizar routers: mover lÃ³gica para `modules/*/service.py` | Backend | G | Routers finos; services unit-testÃ¡veis; read-model preservado |
| P1 | Padronizar `/api` com compat temporÃ¡ria | Fullstack | M | Front funciona; rotas antigas mantidas por 1 versÃ£o |
| P2 | Implementar auth JWT + RBAC, com â€œlegacy headers modeâ€ temporÃ¡rio | Backend | G | Login retorna JWT; endpoints protegidos; modo antigo disponÃ­vel por flag |
| P2 | Deploy Linux: NGINX + systemd + HTTPS (Certbot) + checklist | DevOps | M | App estÃ¡vel, logs, restart on-failure, HTTPS ok |

## ReferÃªncias prioritÃ¡rias

- RepositÃ³rio e cÃ³digo do projeto (arquivos citados acima via conector GitHub). îˆ€fileciteîˆ‚turn9file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn16file0îˆ‚L1-L1îˆ
- DecisÃµes e princÃ­pios no Linear (CORE-1/2/3/4/5/6) e issues DEV relacionadas. îˆ€fileciteîˆ‚turn50file19îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file18îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn50file17îˆ‚L1-L1îˆ
- FastAPI middleware/CORS (doc oficial). îˆ€citeîˆ‚turn26view0îˆ
- SQLAlchemy 2.0 Session basics e pooling (`pool_pre_ping`). îˆ€citeîˆ‚turn22search4îˆ îˆ€citeîˆ‚turn22search6îˆ
- Alembic autogenerate e Operations API (rename_table etc). îˆ€citeîˆ‚turn23search0îˆ îˆ€citeîˆ‚turn25search0îˆ
- NGINX docs (`try_files`, `proxy_pass`, reverse proxy guide, WebSocket proxying). îˆ€citeîˆ‚turn21search3îˆ îˆ€citeîˆ‚turn21search4îˆ îˆ€citeîˆ‚turn21search6îˆ îˆ€citeîˆ‚turn19search6îˆ
- Uvicorn deployment e proxies/forwarded headers. îˆ€citeîˆ‚turn19search0îˆ
- Gunicorn ASGI worker e guia de deploy. îˆ€citeîˆ‚turn19search5îˆ îˆ€citeîˆ‚turn19search3îˆ
- systemd.service e documentaÃ§Ã£o Red Hat de unit files. îˆ€citeîˆ‚turn20search8îˆ îˆ€citeîˆ‚turn20search4îˆ
- Letâ€™s Encrypt (recomendaÃ§Ã£o do Certbot) e gerador oficial do Certbot. îˆ€citeîˆ‚turn20search6îˆ îˆ€citeîˆ‚turn21search1îˆ
