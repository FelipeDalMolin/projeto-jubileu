> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# InvestigaÃ§Ã£o tÃ©cnica do Projeto Jubileu com foco em migraÃ§Ã£o do Frontend para Eventos e Workspace unificado

## DiagnÃ³stico executivo e aderÃªncia Ã s premissas

O repositÃ³rio na branch **`jubileu-v2`** estÃ¡ em um estado de **transiÃ§Ã£o explÃ­cita** entre um modelo â€œDia â†’ Aulaâ€ (persistÃªncia/rotas clÃ¡ssicas) e um modelo â€œDia â†’ Eventoâ€ (camada canÃ´nica), onde **Evento jÃ¡ existe como API canÃ´nica**, mas **a navegaÃ§Ã£o e UI do frontend ainda permanecem centradas em `/dias` e `/aulas`**. Isso Ã© coerente com o documento de domÃ­nio (que assume persistÃªncia em `Aula` e introduÃ§Ã£o gradual de â€œEventoâ€) îˆ€fileciteîˆ‚turn42file0îˆ e com o â€œexecution planâ€ (que descreve uma padronizaÃ§Ã£o e migraÃ§Ã£o incremental) îˆ€fileciteîˆ‚turn43file0îˆ.

### Premissas arquiteturais â€” confirmaÃ§Ã£o/contradiÃ§Ã£o por evidÃªncia

**Evento deve ser a unidade operacional principal**
âœ” **Confirmado no backend e na documentaÃ§Ã£o**, mas **nÃ£o no frontend**.
O backend expÃµe um conjunto de operaÃ§Ãµes explicitamente sob â€œeventosâ€ (`/api/eventos/...`): RSVP, check-in, start/end/cancel, seed de partida, e criaÃ§Ã£o de lance îˆ€fileciteîˆ‚turn32file0îˆ. A documentaÃ§Ã£o do domÃ­nio coloca â€œEventosâ€ como o prÃ³ximo nÃ­vel apÃ³s â€œDiasâ€ na direÃ§Ã£o canÃ´nica îˆ€fileciteîˆ‚turn42file0îˆ. JÃ¡ o frontend nÃ£o tem rota `/eventos` e nÃ£o tem page/workspace por evento îˆ€fileciteîˆ‚turn4file0îˆ.

**Dia deve ser apenas contexto (agrupador)**
âœ” **Confirmado como intenÃ§Ã£o e como estrutura predominante**.
O backend mantÃ©m â€œDiaâ€ como agregado de referÃªncia (ex.: `/dias/{data_iso}` retorna dia + aulas) îˆ€fileciteîˆ‚turn36file0îˆ e o docs/DOMAIN_MODEL fala em â€œDia â†’ Eventosâ€ canÃ´nico, o que implica dia como agrupador/contexto îˆ€fileciteîˆ‚turn42file0îˆ.

**Aula deve ser tratada como um TIPO de evento (nÃ£o como entidade raiz de navegaÃ§Ã£o)**
âœ” **Confirmado no backend, parcialmente no frontend**.
No backend, â€œEventoâ€ Ã© uma projeÃ§Ã£o canÃ´nica sobre a entidade persistida â€œAulaâ€: `evento_id` na API canÃ´nica corresponde a uma `AulaModel` carregada por `get_evento_or_404` îˆ€fileciteîˆ‚turn32file0îˆ, e o mapper do mÃ³dulo `eventos` converte `TipoEventoAulaEnum.JOGO` em `EventoTipoCanonical.JOGO_LIVRE` îˆ€fileciteîˆ‚turn40file0îˆ.
No frontend, ainda â€œAulaâ€ Ã© o nÃºcleo de roteamento (`/dias/:dataIso/aulas/:aulaId`) îˆ€fileciteîˆ‚turn4file0îˆ, embora jÃ¡ exista um tipo â€œEventoâ€ (`src/types/evento.ts`) sugerindo a migraÃ§Ã£o îˆ€fileciteîˆ‚turn25file0îˆ.

**Deve existir um Ãºnico `WorkspaceEvento` com renderizaÃ§Ã£o condicional por tipo**
âš  **Parcialmente correto** (estrutura suportÃ¡vel, implementaÃ§Ã£o inexistente).
Existe **WorkspaceAula** (frontend e backend), com `meta.tipo` e estrutura de snapshot/painÃ©is; mas nÃ£o existe um â€œWorkspaceEventoâ€ formal nem no backend nem no frontend îˆ€fileciteîˆ‚turn20file0îˆ‚turn34file0îˆ. A estrutura atual permite **evoluir** `WorkspaceAula` para ser o `WorkspaceEvento` (conceitualmente), porque `meta.tipo` jÃ¡ Ã© enum (â€œAULA/JOGO/OUTROâ€) îˆ€fileciteîˆ‚turn34file0îˆ‚turn41file0îˆ.

**RenderizaÃ§Ã£o condicional baseada em capabilities (nÃ£o if espalhado)**
âŒ **NÃ£o implementado hoje**.
O cÃ³digo atual tem lÃ³gica condicional local (ex.: painÃ©is e botÃµes variando por estado), mas nÃ£o hÃ¡ um mecanismo central de capabilities para decidir â€œo que renderizar por tipo/role/statusâ€. Isso precisarÃ¡ ser introduzido como parte do plano (recomendaÃ§Ã£o fundamentada pelo objetivo e pelo fato de ainda nÃ£o haver UI por outros tipos de evento).

**Rotas alvo (`/eventos/{eventoId}`, `/dias/{dataIso}/eventos/{eventoId}`, `/dias/{dataIso}/aulas/{aulaId}`)**
âš  **Parcialmente correto**: hÃ¡ compatibilidade sÃ³ para `/dias/{dataIso}/aulas/{aulaId}` hoje.
O frontend tem apenas as rotas `/dias` e `/dias/:dataIso/aulas/:aulaId` como nÃºcleo îˆ€fileciteîˆ‚turn4file0îˆ.
No backend, hÃ¡ endpoints canÃ´nicos de aÃ§Ãµes de evento sob `/api/eventos/{evento_id}/...`, mas **nÃ£o hÃ¡ evidÃªncia de um GET canÃ´nico para resolver evento â†’ dia/dataIso**; o router de eventos lista apenas aÃ§Ãµes e listagens derivadas (participants/presentes), nÃ£o uma leitura do evento em si îˆ€fileciteîˆ‚turn32file0îˆ. Isso impacta diretamente a viabilidade de `/eventos/{eventoId}` como deep link sem ajustes no backend.

## DiagnÃ³stico do frontend

### Rotas atuais e â€œcentro de gravidadeâ€ do app

O roteamento principal do frontend (`AppRoutes`) confirma que o app estÃ¡ organizado em torno de:

- `/dias` (lista/visÃ£o de dias)
- `/dias/:dataIso/aulas/:aulaId` (pÃ¡gina de aula/workspace)
- rotas auxiliares: `/turmas`, `/jogadores`, `/usuario`, `/login`, `/`(dashboard) îˆ€fileciteîˆ‚turn4file0îˆ

A presenÃ§a de `PrivateRoute.tsx` sugere intenÃ§Ã£o de proteÃ§Ã£o de rotas, mas `AppRoutes` implementa um wrapper prÃ³prio (`RotaProtegida`) e nÃ£o referencia `PrivateRoute.tsx`, caracterizando provÃ¡vel redundÃ¢ncia/arquivo â€œÃ³rfÃ£oâ€ îˆ€fileciteîˆ‚turn4file0îˆ‚turn45file0îˆ.

### Estrutura de pÃ¡ginas/containers e acoplamentos centrais

A pÃ¡gina â€œde trabalhoâ€ Ã© `AulaPage`, que recebe `dataIso` e `aulaId` via `useParams`, carrega o workspace e renderiza painÃ©is de equipes/partidas/header (componentes em `src/components/aula/...`) îˆ€fileciteîˆ‚turn11file0îˆ‚turn61file0îˆ. Isso confirma:

- **Acoplamento forte com Aula como raiz de navegaÃ§Ã£o** (URL e nomes de componentes).
- **UI orientada a â€œequipes/partidasâ€ como nÃºcleo**, o que funciona bem para `AULA`, mas nÃ£o cobre funcionalidades canÃ´nicas recentes de evento (RSVP/check-in/seed/lances).

### EvidÃªncia de suporte a â€œEventoâ€ ainda nÃ£o utilizado

Apesar de nÃ£o existir rota `/eventos`, o frontend jÃ¡ possui:

- `src/types/evento.ts` (definiÃ§Ãµes `EventoTipo` e `EventoStatus`) îˆ€fileciteîˆ‚turn25file0îˆ
- `src/services/eventosService.ts` com chamadas para `/api/eventos/{id}/...` (RSVP, check-in, start/end/cancel, seed partida, create_lance) e autenticaÃ§Ã£o por headers (`X-User-Id`, `X-Role`, `X-Jogador-Id`) îˆ€fileciteîˆ‚turn23file0îˆ

PorÃ©m, **nÃ£o hÃ¡ evidÃªncia de consumo real dessa service por pÃ¡ginas/components** (o que, na prÃ¡tica, significa que o â€œevento canÃ´nicoâ€ ainda nÃ£o entrou no fluxo de UI).

### Riscos concretos de quebra durante a migraÃ§Ã£o (baseados em arquivo)

**Risco de ambiente/dev: proxy rewritando `/api` pode quebrar `/api/eventos`**
HÃ¡ evidÃªncia de ajuste de proxy na configuraÃ§Ã£o do Vite para reescrever paths removendo prefixo `/api` (isso aparece no diff do commit â€œFix com Codexâ€) îˆ€fileciteîˆ‚turn82file0îˆ.
Esse padrÃ£o funciona para rotas legadas (`/api/dias` â†’ `/dias`) porque o backend expÃµe ambas (legacy e `/api`) para **dias/turmas/jogadores/partidas** via `include_router(..., prefix="/api")` îˆ€fileciteîˆ‚turn28file0îˆ.
Mas o router de eventos no backend **jÃ¡ nasce com `prefix="/api"` internamente** îˆ€fileciteîˆ‚turn32file0îˆ; logo, reescrever `/api/eventos/...` para `/eventos/...` tende a gerar 404. Isso precisa ser tratado como **bloqueio tÃ©cnico** para a migraÃ§Ã£o real para Eventos.

**Mismatch de tipos de status (frontend vs backend) para Evento**
O frontend define `EventoStatus` como `"PLANEJADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA"` îˆ€fileciteîˆ‚turn25file0îˆ, mas a API canÃ´nica retorna `EventoStatusCanonical` como `"PLANEJADO" | "EM_ANDAMENTO" | "ENCERRADO" | "CANCELADO"` îˆ€fileciteîˆ‚turn37file0îˆ (ex.: um evento concluÃ­do vira â€œENCERRADOâ€ via mapper) îˆ€fileciteîˆ‚turn40file0îˆ. Sem alinhar isso, o frontend quebrarÃ¡ por tipagem ou por lÃ³gica condicional incorreta.

**Auth/UI de usuÃ¡rio nÃ£o fornece os headers exigidos pelo modo compatÃ­vel**
O frontend atual implementa login â€œfakeâ€ via `AuthContext` (qualquer email/senha seta um objeto user em localStorage) îˆ€fileciteîˆ‚turn7file0îˆ.
Para usar RSVP/check-in como â€œselfâ€, a API requer `user.jogador_id` (e no modo compatÃ­vel isso vem de `X-Jogador-Id`) îˆ€fileciteîˆ‚turn52file0îˆ‚turn40file0îˆ. Hoje nÃ£o existe fluxo de UI operacional que selecione/amarre `JogadorId` ao â€œusuÃ¡rio/sessÃ£oâ€, e a pÃ¡gina `/usuario` Ã© apenas placeholder îˆ€fileciteîˆ‚turn8file0îˆ.

## DiagnÃ³stico backend â†’ frontend (gaps de integraÃ§Ã£o)

### Endpoints canÃ´nicos existentes e impacto direto na UI

O router de eventos expÃµe, com evidÃªncia direta:

- RSVP: `POST /api/eventos/{evento_id}/rsvp` e `DELETE /api/eventos/{evento_id}/rsvp` îˆ€fileciteîˆ‚turn32file0îˆ
- Check-in: `POST /api/eventos/{evento_id}/checkin` e `DELETE /api/eventos/{evento_id}/checkin` îˆ€fileciteîˆ‚turn32file0îˆ
- AÃ§Ãµes admin/treinador: `POST /api/eventos/{evento_id}/start|end|cancel` (guardadas por `require_roles("admin","treinador")`) îˆ€fileciteîˆ‚turn32file0îˆ
- Listagens: `GET /api/eventos/{evento_id}/participants` e `/presentes` îˆ€fileciteîˆ‚turn32file0îˆ
- â€œSeedâ€ de partida: `POST /api/eventos/{evento_id}/partidas/seed` îˆ€fileciteîˆ‚turn32file0îˆ
- Lances: `POST /api/partidas/{partida_id}/lances` îˆ€fileciteîˆ‚turn32file0îˆ

O frontend atual **nÃ£o consome** isso no fluxo principal (workspace). Hoje ele opera com rotas e endpoints â€œdia/aulaâ€ para equipes/partidas/stats.

### AutenticaÃ§Ã£o: compatibilidade existe, mas a seguranÃ§a e o fluxo nÃ£o estÃ£o fechados

O backend suporta autenticaÃ§Ã£o por:
- Bearer JWT **ou**
- headers legados `X-User-Id`, `X-Role`, `X-Jogador-Id` (modo compatÃ­vel) îˆ€fileciteîˆ‚turn52file0îˆ

Por padrÃ£o, `AUTH_MODE` = `jwt_compat` e `JWT_SECRET` = `"CHANGE_ME"` îˆ€fileciteîˆ‚turn54file0îˆ, o que Ã© uma fragilidade (especialmente se esse default vazar para produÃ§Ã£o). Isso aparece como ponto crÃ­tico no prÃ³prio â€œartefatoâ€ de anÃ¡lise e deve ser tratado como parte da validaÃ§Ã£o/plan.

### Workspace: hÃ¡ suporte real, mas nÃ£o existe â€œtimeline/eventosâ€ ainda

Existe endpoint de workspace em `dias.py`:
`GET /dias/{data_iso}/aulas/{aula_id}/workspace?since_version=...`, com retorno 204 se nÃ£o mudou îˆ€fileciteîˆ‚turn34file0îˆ.

PorÃ©m:
- `build_workspace_aula` retorna `eventos=[]` explicitamente (lista vazia) îˆ€fileciteîˆ‚turn35file0îˆ, ou seja: **nÃ£o hÃ¡ timeline/event feed real no workspace atual**.
- O `version` do workspace Ã© calculado combinando `TeamConfig.version` e CRC32 das partidas îˆ€fileciteîˆ‚turn35file0îˆ, logo mudanÃ§as via RSVP/check-in/lances nÃ£o aparecem nesse versionamento (gap para â€œevento-centric UIâ€ se ela depender de refresh por workspace).

### Funcionalidades do backend que jÃ¡ existem, mas o frontend nÃ£o usa

1. RSVP/check-in + listagens de participantes/presentes (nÃ£o hÃ¡ UI atual consumindo) îˆ€fileciteîˆ‚turn32file0îˆ‚turn23file0îˆ
2. Start/end/cancel canÃ´nicos e role-based (frontend usa start/finish via serviÃ§o legado `aulaLifecycleService`) îˆ€fileciteîˆ‚turn65file0îˆ‚turn32file0îˆ
3. Seed de partida por evento e criaÃ§Ã£o de lance (nÃ£o hÃ¡ UI em produÃ§Ã£o para isso) îˆ€fileciteîˆ‚turn32file0îˆ‚turn23file0îˆ

## DecisÃ£o arquitetural: WorkspaceEvento Ãºnico, estratÃ©gia de rotas e papel de Aula

### Existe ou nÃ£o suporte real a WorkspaceEvento hoje?

**Fato confirmado:** existe suporte a *workspace agregado* apenas no formato `WorkspaceAulaOut`/`WorkspaceAula` îˆ€fileciteîˆ‚turn34file0îˆ‚turn20file0îˆ.
**Fato confirmado:** `meta.tipo` jÃ¡ distingue tipos (â€œAULA/JOGO/OUTROâ€) no backend îˆ€fileciteîˆ‚turn41file0îˆ e no workspace de saÃ­da îˆ€fileciteîˆ‚turn34file0îˆ, o que permite que a UI trate â€œAulaâ€ **como tipo**, nÃ£o como raiz.
**Fato confirmado:** o mÃ³dulo de eventos Ã© canÃ´nico mas se ancora na entidade persistida â€œAulaâ€ (evento Ã© `AulaModel`) îˆ€fileciteîˆ‚turn40file0îˆ‚turn39file0îˆ.

### DecisÃ£o obrigatÃ³ria: um Ãºnico `WorkspaceEvento` com composiÃ§Ã£o

**DecisÃ£o (recomendaÃ§Ã£o tÃ©cnica): usar um Ãºnico `WorkspaceEvento` (frontend) com composiÃ§Ã£o/capabilities.**

Justificativa baseada em evidÃªncia:
- O backend trabalha com **um Ãºnico agregado persistido** (`Aula`) que representa o â€œeventoâ€ e jÃ¡ distingue `tipo` por enum îˆ€fileciteîˆ‚turn39file0îˆ‚turn41file0îˆ.
- O workspace existente jÃ¡ Ã© â€œcapazâ€ de descrever estados de equipes/partidas para qualquer `aula_id`, e o `tipo` estÃ¡ disponÃ­vel para chavear UI îˆ€fileciteîˆ‚turn34file0îˆ.
- Criar workspaces separados por tipo exigiria duplicar plumbing (polling, layout, rotas) e, no estado atual do repo, nÃ£o hÃ¡ evidÃªncia de endpoints ou schemas mÃºltiplos de workspace que justifiquem â€œworkspaces separadosâ€.

**HipÃ³tese (com base em gaps observados):** o backend precisarÃ¡ evoluir o workspace (ou criar endpoints complementares) para incluir timeline/participantes/lances de forma versionada, se a UI quiser â€œtempo realâ€ completo por evento e nÃ£o apenas por equipe/partida îˆ€fileciteîˆ‚turn35file0îˆ‚turn32file0îˆ.

### EstratÃ©gia de rotas: implementar o alvo sem romper compatibilidade

**Fato confirmado:** hoje sÃ³ existe `/dias/:dataIso/aulas/:aulaId` îˆ€fileciteîˆ‚turn4file0îˆ.
**Fato confirmado:** nÃ£o hÃ¡ endpoint GET canÃ´nico para â€œevento por idâ€ no router de eventos (apenas aÃ§Ãµes/listagens) îˆ€fileciteîˆ‚turn32file0îˆ. Isso torna `/eventos/{eventoId}` inviÃ¡vel como deep link estÃ¡vel **sem ajuste** no backend.

RecomendaÃ§Ã£o incremental (executÃ¡vel pelo Codex):
- Implementar primeiro `/dias/{dataIso}/eventos/{eventoId}` como rota â€œcontextual canÃ´nicaâ€ (eventoId = aulaId) no frontend. Isso nÃ£o exige backend novo, pois o workspace e o dia jÃ¡ sÃ£o carregÃ¡veis via `dataIso` e `aulaId` îˆ€fileciteîˆ‚turn34file0îˆ‚turn36file0îˆ.
- Manter `/dias/{dataIso}/aulas/{aulaId}` como compatibilidade temporÃ¡ria, mas redirecionar internamente para a rota de eventos (ou renderizar o mesmo `WorkspaceEventoPage`).
- SÃ³ habilitar `/eventos/{eventoId}` (canÃ´nica) quando houver um endpoint mÃ­nimo no backend para resolver `eventoId â†’ dataIso|dia_id` (ex.: `GET /api/eventos/{eventoId}`), porque hoje o router de eventos nÃ£o fornece isso îˆ€fileciteîˆ‚turn32file0îˆ.

### Papel de Aula: â€œAULA ativa contexto de turma?â€

Sim â€” e isso estÃ¡ alinhado ao que o cÃ³digo sugere.

- O tipo persistido `TipoEventoAulaEnum` distingue â€œAULA/JOGO/OUTROâ€ îˆ€fileciteîˆ‚turn41file0îˆ.
- A camada canÃ´nica transforma â€œJOGOâ€ em â€œJOGO_LIVREâ€ para API de eventos îˆ€fileciteîˆ‚turn40file0îˆ, preservando â€œAULAâ€ como um tipo relevante.
- O workspace expÃµe `meta.turma_id` e `meta.turma_nome` îˆ€fileciteîˆ‚turn34file0îˆ, o que reforÃ§a que â€œturmaâ€ Ã© um contexto associado ao evento. Portanto, **o tipo AULA Ã© um bom â€œgateâ€ arquitetural** para habilitar UI que depende do contexto de turma.

## RenderizaÃ§Ã£o condicional: validaÃ§Ã£o e modelo correto com capabilities

### Estado atual (validaÃ§Ã£o)

- **Fato confirmado:** no frontend atual, a renderizaÃ§Ã£o do workspace Ã© estruturalmente fixa (painÃ©is de equipes, partidas etc.) e acoplada Ã  rota de aula îˆ€fileciteîˆ‚turn11file0îˆ‚turn62file0îˆ‚turn64file0îˆ.
- **Fato confirmado:** o backend Ã© capaz de distinguir tipo e status no objeto do evento/â€™aulaâ€™ e no workspace (`meta.tipo`, `meta.status`) îˆ€fileciteîˆ‚turn34file0îˆ‚turn41file0îˆ.
- **Fato confirmado:** a API canÃ´nica tem regras por tipo (ex.: RSVP Ã© apenas para `JOGO_LIVRE`) îˆ€fileciteîˆ‚turn40file0îˆ‚turn32file0îˆ.

### Modelo recomendado (capabilities)

**RecomendaÃ§Ã£o:** introduzir um â€œregistryâ€ central de capabilities por tipo de evento, e derivar UI e aÃ§Ãµes a partir dele, em vez de `if (tipo === ...)` espalhados.

Um desenho mÃ­nimo e rastreÃ¡vel:
- `capabilities/eventoCapabilities.ts`: define quais capacidades existem (ex.: `RSVP`, `CHECKIN`, `EQUIPES`, `PARTIDAS_STATS`, `SEED_PARTIDA`, `LANCES`) e um mapa `EventoTipo â†’ Set<Capability>`.
- `workspaces/WorkspaceEventoPage.tsx`: decide o que carregar/renderizar consultando esse set.
- Regras dependentes de role/status devem ser tratadas como **capabilities derivadas** (ex.: `CAN_START` sÃ³ para `admin`/`treinador` e status â€œPLANEJADOâ€) usando o modelo de auth atual do backend îˆ€fileciteîˆ‚turn32file0îˆ‚turn52file0îˆ.

Isso respeita a premissa â€œcapabilities, nÃ£o if espalhadoâ€ e se ancora na evidÃªncia de que `tipo` e `status` jÃ¡ existem no contrato do backend îˆ€fileciteîˆ‚turn37file0îˆ‚turn34file0îˆ.

## Jogador/User: estado atual, separaÃ§Ã£o e proposta

### EvidÃªncia do estado atual

No frontend:
- Existe rota `/usuario` mas a pÃ¡gina Ã© um placeholder îˆ€fileciteîˆ‚turn8file0îˆ‚turn4file0îˆ.
- A autenticaÃ§Ã£o atual Ã© â€œfake loginâ€ em `AuthContext` (sem role/jogadorId) îˆ€fileciteîˆ‚turn7file0îˆ.
- A navegaÃ§Ã£o (`Navbar`) nÃ£o reflete sessÃ£o/role, apenas links estÃ¡ticos e um â€œEntrarâ€ îˆ€fileciteîˆ‚turn46file0îˆ.

No backend:
- Existe `/api/auth/login` e `/api/auth/me` îˆ€fileciteîˆ‚turn55file0îˆ.
- O â€œcurrent userâ€ pode vir via JWT ou via headers legados (incluindo `X-Jogador-Id`) îˆ€fileciteîˆ‚turn52file0îˆ.
- A API de eventos exige `jogador_id` para aÃ§Ãµes â€œselfâ€ (rsvp/checkin) îˆ€fileciteîˆ‚turn40file0îˆ.
- Jogadores tÃªm endpoints CRUD/listagem em `/api/jogadores` îˆ€fileciteîˆ‚turn56file0îˆ.

### Proposta clara: separar UserProfile e JogadorProfile (e por quÃª)

**RecomendaÃ§Ã£o:** sim, separar conceitualmente, porque o backend jÃ¡ separa â€œusuÃ¡rioâ€ (auth identity) e â€œjogadorâ€ (entidade de domÃ­nio com presenÃ§a/participaÃ§Ã£o).
Na prÃ¡tica do repo, o modo compatÃ­vel permite que â€œum userâ€ opere como â€œum jogadorâ€ por header `X-Jogador-Id` îˆ€fileciteîˆ‚turn52file0îˆ, o que reforÃ§a a necessidade de uma UI explÃ­cita para selecionar/associar jogador.

Estrutura sugerida:
- `UserProfilePage` (`/usuario`): exibir sessÃ£o atual (userId, role, modo de auth), permitir selecionar `role` e o `jogadorId ativo` (buscando lista de jogadores via `/api/jogadores`) îˆ€fileciteîˆ‚turn56file0îˆ‚turn23file0îˆ. Armazenar isso no contexto/localStorage e usar para montar headers.
- `JogadorProfilePage` (`/jogadores/:id`): exibir detalhes e histÃ³rico do jogador (com o que o backend jÃ¡ fornece hoje via endpoints de jogadores; para â€œhistÃ³rico em eventosâ€, ainda faltam endpoints, entÃ£o isso deve ser tratado como lacuna). O router atual de jogadores suporta obter por ID îˆ€fileciteîˆ‚turn56file0îˆ.

## Arquivos que devem ser desmembrados com justificativa e divisÃ£o concreta

### Frontend

`frontend/jubileu-web/src/components/aula/WorkspaceEquipesPanel.tsx`
Problema: concentra regras de UI, chamadas de serviÃ§os (`diasService`, `aulaLifecycleService`), controle de estado e fluxos crÃ­ticos (start/finish, mover jogadores, salvar estado) em um Ãºnico componente extenso îˆ€fileciteîˆ‚turn62file0îˆ‚turn65file0îˆ.
DivisÃ£o concreta recomendada:
- `workspaces/evento/panels/EquipesPanel/EquipesPanel.tsx` (container)
- `.../EquipesPanel/EquipeCard.tsx`
- `.../EquipesPanel/JogadorLista.tsx`
- `.../EquipesPanel/actions.ts` (comandos: mover, salvar, iniciar/finalizar)
- `.../EquipesPanel/selectors.ts` (derivaÃ§Ãµes)

`frontend/jubileu-web/src/components/aula/WorkspacePartidasPanel.tsx`
Problema: mistura renderizaÃ§Ã£o de tabela/placar, formulÃ¡rios e fluxo de persistÃªncia de estatÃ­sticas, com chamadas diretas ao serviÃ§o de dias/partidas îˆ€fileciteîˆ‚turn64file0îˆ‚turn66file0îˆ.
DivisÃ£o concreta recomendada:
- `PartidasPanel.tsx` (container)
- `PartidaCard.tsx` (render)
- `StatsEditor.tsx` (form)
- `partidasCommands.ts` (persistÃªncia)

`frontend/jubileu-web/src/routes/PrivateRoute.tsx`
Problema: duplicaÃ§Ã£o conceitual com `RotaProtegida` embutido em `AppRoutes` e provÃ¡vel nÃ£o-uso real îˆ€fileciteîˆ‚turn45file0îˆ‚turn4file0îˆ.
AÃ§Ã£o: remover ou consolidar em um Ãºnico padrÃ£o.

### Backend (impacto indireto na migraÃ§Ã£o para eventos)

`backend/jubileu-api-fastapi/app/routers/eventos.py` + gaps de leitura
Problema: router canÃ´nico de eventos expÃµe aÃ§Ãµes, mas nÃ£o expÃµe leitura canÃ´nica simples (`GET /api/eventos/{id}`), o que dificulta implementar `/eventos/{eventoId}` no frontend îˆ€fileciteîˆ‚turn32file0îˆ.
DivisÃ£o concreta recomendada:
- `GET /api/eventos/{evento_id}` (mÃ­nimo: `{id, dia_id, data_iso, tipo, status, horario_inicio, horario_fim}`)
- opcional: `GET /api/eventos/{evento_id}/workspace` se desejarem um workspace realmente canÃ´nico.

## ValidaÃ§Ã£o do artefato enviado (comparaÃ§Ã£o com o estado real)

Como o repositÃ³rio contÃ©m um documento de anÃ¡lise/refatoraÃ§Ã£o (`docs/refactors/relatorio-arquitetura-plano-refatoracao.md`) îˆ€fileciteîˆ‚turn47file0îˆ, a validaÃ§Ã£o abaixo compara **afirmaÃ§Ãµes tÃ­picas** desse artefato com o cÃ³digo atual.

âœ” **Confirmado**
- **Backend possui API canÃ´nica de eventos** (RSVP, check-in, start/end/cancel, seed, lances) îˆ€fileciteîˆ‚turn32file0îˆ.
- **Existe compatibilidade de auth via headers legados**, alÃ©m de JWT, no modo `jwt_compat` îˆ€fileciteîˆ‚turn52file0îˆ‚turn54file0îˆ.
- **Frontend ainda estÃ¡ centrado em `/dias` e `/aulas`** no roteamento principal îˆ€fileciteîˆ‚turn4file0îˆ.
- **HÃ¡ histÃ³rico de mudanÃ§as â€œcom Codexâ€** em commits (ex.: commit â€œFix com Codexâ€) îˆ€fileciteîˆ‚turn82file0îˆ.

âš  **Parcialmente correto**
- â€œWorkspace/timeline/eventosâ€: existe endpoint de workspace, mas **nÃ£o existe timeline real** (`eventos=[]`) îˆ€fileciteîˆ‚turn35file0îˆ. Se o artefato assume timeline jÃ¡ pronta, isso Ã© apenas parcialmente verdadeiro.
- â€œDocumentaÃ§Ã£o ausenteâ€: o README contÃ©m vÃ¡rios `#todo`, mas existe `docs/ARCHITECTURE.md` e `docs/DOMAIN_MODEL.md` îˆ€fileciteîˆ‚turn48file0îˆ‚turn42file0îˆ‚turn49file0îˆ.

âŒ **Incorreto**
- Qualquer alegaÃ§Ã£o de que â€œdocs/ARCHITECTURE.md nÃ£o existeâ€ Ã© incorreta no estado atual do repositÃ³rio îˆ€fileciteîˆ‚turn48file0îˆ.

â— **Ausente/importante (para o objetivo atual)**
- O artefato (e o repo) nÃ£o fecham um plano completo para o **frontend evento-cÃªntrico**: nÃ£o hÃ¡ rota `/eventos`, nÃ£o hÃ¡ `WorkspaceEvento`, e hÃ¡ divergÃªncias de tipos/status entre front/back que precisam ser endereÃ§adas îˆ€fileciteîˆ‚turn4file0îˆ‚turn37file0îˆ‚turn25file0îˆ.

## Plano executÃ¡vel para o Codex em fases

Abaixo estÃ¡ um plano **orientado a evidÃªncias do repo**, com entregas pequenas e rastreÃ¡veis, respeitando compatibilidade.

### Fase 1 â€” Auditoria

Objetivo: â€œcongelarâ€ contratos e remover bloqueios imediatos para consumir `/api/eventos`.

Arquivos impactados:
- `frontend/jubileu-web/vite.config.ts` (proxy/rewrite) â€” evidÃªncia de rewrite no commit â€œFix com Codexâ€ îˆ€fileciteîˆ‚turn82file0îˆ
- `frontend/jubileu-web/src/types/evento.ts` (status/tipos) îˆ€fileciteîˆ‚turn25file0îˆ
- `backend/jubileu-api-fastapi/app/routers/eventos.py` (confirmar rotas existentes) îˆ€fileciteîˆ‚turn32file0îˆ

Riscos:
- Manter rewrite de `/api` pode bloquear a integraÃ§Ã£o com `/api/eventos` no dev (404).
- Tipos `EventoStatus` divergentes podem causar bugs silenciosos.

CritÃ©rios de aceite:
- Frontend consegue chamar ao menos `GET /api/eventos/{id}/participants` sem rewrite quebrando path (em ambiente dev/proxy).
- Tipos do frontend refletem exatamente `EventoTipoCanonical` e `EventoStatusCanonical` do backend îˆ€fileciteîˆ‚turn37file0îˆ‚turn40file0îˆ.

### Fase 2 â€” Rotas

Objetivo: introduzir rotas evento-cÃªntricas sem quebrar links antigos.

Arquivos impactados:
- `frontend/jubileu-web/src/routes/AppRoutes.tsx` îˆ€fileciteîˆ‚turn4file0îˆ
- Nova page: `frontend/jubileu-web/src/pages/eventos/EventoPage.tsx` (a criar, reutilizando AulaPage como base)
- `frontend/jubileu-web/src/pages/aula/AulaPage.tsx` (virar wrapper/redirect ou reutilizar componente comum) îˆ€fileciteîˆ‚turn11file0îˆ

Riscos:
- `/eventos/{eventoId}` nÃ£o Ã© deep-link viÃ¡vel sem endpoint de leitura no backend (hoje nÃ£o existe) îˆ€fileciteîˆ‚turn32file0îˆ.
- Redirecionamentos mal feitos podem quebrar navegaÃ§Ã£o e histÃ³rico do browser.

CritÃ©rios de aceite:
- Existe rota `/dias/:dataIso/eventos/:eventoId` renderizando o workspace (mesma tela atual).
- Rota antiga `/dias/:dataIso/aulas/:aulaId` continua funcionando (compatibilidade), mas Ã© marcada como â€œlegacyâ€ e aponta para o mesmo componente.

### Fase 3 â€” WorkspaceEvento

Objetivo: criar um **Ãºnico** â€œworkspaceâ€ de UI (`WorkspaceEvento`) com capacidades por tipo.

Arquivos impactados:
- Migrar/refatorar `src/pages/aula/AulaPage.tsx` îˆ€fileciteîˆ‚turn11file0îˆ
- Criar `src/workspaces/evento/WorkspaceEventoPage.tsx`
- Criar `src/workspaces/evento/capabilities.ts`
- Refatorar `src/components/aula/*` para `src/workspaces/evento/panels/*` (ou manter e criar facade)

Riscos:
- RefatoraÃ§Ã£o grande nos componentes de workspace (equipes/partidas) pode introduzir regressÃµes.
- Se nÃ£o houver um â€œregistryâ€ de capabilities, o cÃ³digo tende a ficar com `if` espalhado e difÃ­cil de manter.

CritÃ©rios de aceite:
- `WorkspaceEventoPage` recebe `{dataIso?, eventoId}` e decide painÃ©is por capabilities (pelo menos `AULA` vs `JOGO_LIVRE`).
- Para `AULA`, a UI atual (equipes/partidas) permanece funcional (sem perda).

### Fase 4 â€” IntegraÃ§Ã£o backend

Objetivo: consumir de fato as operaÃ§Ãµes canÃ´nicas de evento no frontend, priorizando JOGO_LIVRE.

Arquivos impactados:
- `frontend/jubileu-web/src/services/eventosService.ts` (jÃ¡ existe) îˆ€fileciteîˆ‚turn23file0îˆ
- `frontend/jubileu-web/src/services/aulaLifecycleService.ts` (avaliar migraÃ§Ã£o para `/api/eventos/{id}/start|end|cancel`) îˆ€fileciteîˆ‚turn65file0îˆ‚turn32file0îˆ
- `backend/jubileu-api-fastapi/app/modules/auth/*` (se necessÃ¡rio ajustar fluxo de sessÃ£o) îˆ€fileciteîˆ‚turn52file0îˆ‚turn55file0îˆ

Riscos:
- DependÃªncia de headers de auth (role/jogadorId) sem UI pronta (ver Fase 6).
- Workspace versionado nÃ£o incorpora mudanÃ§as de RSVP/check-in/lances (atualizar UI pode exigir refetch fora do polling) îˆ€fileciteîˆ‚turn35file0îˆ‚turn32file0îˆ.

CritÃ©rios de aceite:
- Para um evento tipo `JOGO_LIVRE`, usuÃ¡rio consegue:
  - RSVP/Cancelar RSVP
  - Check-in/Desfazer check-in
  - Ver lista de participantes/presentes
  usando `eventosService` e um â€œsession headerâ€ consistente îˆ€fileciteîˆ‚turn23file0îˆ‚turn32file0îˆ.

### Fase 5 â€” UI

Objetivo: evoluir layout e navegaÃ§Ã£o para refletir â€œEventoâ€ como unidade operacional.

Arquivos impactados:
- `frontend/jubileu-web/src/components/layout/Navbar.tsx` (refletir sessÃ£o, incluir â€œEventosâ€) îˆ€fileciteîˆ‚turn46file0îˆ
- `frontend/jubileu-web/src/pages/dias/DiasPage.tsx` (ponto de entrada para eventos por dia)
- Novos componentes de aÃ§Ã£o por evento (cards/botÃµes)

Riscos:
- MudanÃ§a de navegaÃ§Ã£o pode confundir usuÃ¡rios se a compatibilidade nÃ£o estiver clara.
- Sem endpoint canÃ´nico de â€œGET eventoâ€, a UX de `/eventos/{id}` ainda serÃ¡ limitada.

CritÃ©rios de aceite:
- UI permite abrir um evento a partir de um dia (e/ou lista), e a tela do evento se identifica como â€œEventoâ€ (nÃ£o â€œAulaâ€) com tipo/status consistentes com backend îˆ€fileciteîˆ‚turn37file0îˆ‚turn34file0îˆ.

### Fase 6 â€” Jogador/User

Objetivo: fechar o ciclo de sessÃ£o para permitir RSVP/check-in â€œselfâ€ e aÃ§Ãµes por role.

Arquivos impactados:
- `frontend/jubileu-web/src/pages/user/UserPage.tsx` (de placeholder para pÃ¡gina funcional) îˆ€fileciteîˆ‚turn8file0îˆ
- `frontend/jubileu-web/src/context/AuthContext.tsx` (evoluir de fake login para session com role/jogadorId) îˆ€fileciteîˆ‚turn7file0îˆ
- `backend/jubileu-api-fastapi/app/modules/auth/deps.py` (referÃªncia de como o backend lÃª headers) îˆ€fileciteîˆ‚turn52file0îˆ

Riscos:
- Se o time migrar para JWT puro, ainda Ã© preciso resolver `jogador_id` (hoje nÃ£o existe nos DEFAULT_ACCOUNTS) îˆ€fileciteîˆ‚turn53file0îˆ‚turn51file0îˆ.
- SeguranÃ§a: `JWT_SECRET` default â€œCHANGE_MEâ€ nÃ£o deve ir para prod îˆ€fileciteîˆ‚turn54file0îˆ.

CritÃ©rios de aceite:
- `UserPage` permite selecionar `role` e `jogadorId` (buscando lista de jogadores do backend) e isso passa a ser usado automaticamente por `eventosService` îˆ€fileciteîˆ‚turn56file0îˆ‚turn23file0îˆ.
- Navbar reflete estado de sessÃ£o (logado vs nÃ£o logado) îˆ€fileciteîˆ‚turn46file0îˆ.

## Lista estruturada de issues CORE/DEV

A lista abaixo inclui (a) o que jÃ¡ existe no Linear e (b) o que precisa ser criado para viabilizar o plano.

### CORE (decisÃ£o)

- CORE: **Definir contrato de â€œEventoâ€ no frontend** (tipos/status alinhados com backend canÃ´nico; resolver â€œPLANEJADO vs PLANEJADAâ€, â€œENCERRADO vs CONCLUIDAâ€) îˆ€fileciteîˆ‚turn37file0îˆ‚turn25file0îˆ
- CORE: **DecisÃ£o de rotas** â€” priorizar `/dias/{dataIso}/eventos/{eventoId}` agora; `/eventos/{eventoId}` sÃ³ apÃ³s endpoint de leitura no backend (router atual nÃ£o fornece GET do evento) îˆ€fileciteîˆ‚turn32file0îˆ
- CORE: **Modelo de capabilities** para render por tipo/role/status (evitar if espalhado; basear em `meta.tipo`/`meta.status`) îˆ€fileciteîˆ‚turn34file0îˆ‚turn41file0îˆ
- CORE: **EstratÃ©gia de auth** (manter `jwt_compat` e headers no curto prazo vs migrar para JWT real; tratar risco `JWT_SECRET=CHANGE_ME`) îˆ€fileciteîˆ‚turn52file0îˆ‚turn54file0îˆ

### DEV (execuÃ§Ã£o)

- DEV: Ajustar Vite proxy para **nÃ£o quebrar `/api/eventos`** (bloqueio tÃ©cnico evidenciado pelo rewrite no commit codex) îˆ€fileciteîˆ‚turn82file0îˆ
- DEV: Implementar rotas `/dias/:dataIso/eventos/:eventoId` + compat `/dias/:dataIso/aulas/:aulaId` em `AppRoutes` îˆ€fileciteîˆ‚turn4file0îˆ
- DEV: Criar `WorkspaceEventoPage` unificado e mover/refatorar painÃ©is de `components/aula/*` îˆ€fileciteîˆ‚turn62file0îˆ‚turn64file0îˆ
- DEV: Integrar UI para RSVP/check-in/participants/presentes via `eventosService` (jÃ¡ existe, falta consumo) îˆ€fileciteîˆ‚turn23file0îˆ‚turn32file0îˆ
- DEV: Evoluir `/usuario` para fornecer `role` e `jogadorId` (necessÃ¡rio para â€œself actionsâ€) îˆ€fileciteîˆ‚turn8file0îˆ‚turn52file0îˆ
- DEV: (Backend) Criar `GET /api/eventos/{eventoId}` para habilitar rota canÃ´nica `/eventos/{eventoId}` (hoje ausente) îˆ€fileciteîˆ‚turn32file0îˆ
- DEV: (Backend) Revisar versionamento do workspace ou endpoints adicionais se a UI exigir timeline/refresh baseado em RSVP/check-in/lances îˆ€fileciteîˆ‚turn35file0îˆ‚turn32file0îˆ

### ReferÃªncia a issues existentes no Linear (para alinhamento)

HÃ¡ issues DEV existentes relacionadas a lances e integraÃ§Ã£o de UI com endpoints canÃ´nicos (ex.: â€œIntegrar UI com endpoint /partidas/.../lancesâ€, â€œRenomear endpoint de lances para /eventsâ€), alÃ©m de outras de front/back que impactam essa migraÃ§Ã£o îˆ€fileciteîˆ‚turn60file0îˆ. O plano acima as acomoda principalmente nas Fases 4 e 5, mas com o bloqueio de â€œrotas + session headersâ€ como prÃ©-requisito.

## EvidÃªncias principais usadas nesta investigaÃ§Ã£o

- Rotas do frontend (ausÃªncia de `/eventos`, centralidade `/dias` e `/aulas`) îˆ€fileciteîˆ‚turn4file0îˆ
- API canÃ´nica de eventos no backend (RSVP/check-in/start/end/cancel/seed/lances) îˆ€fileciteîˆ‚turn32file0îˆ
- Workspace existente (endpoint e schema), com eventos/timeline ainda vazio îˆ€fileciteîˆ‚turn34file0îˆ‚turn35file0îˆ
- Modelo canÃ´nico de domÃ­nio e execuÃ§Ã£o de refactor (direÃ§Ã£o â€œDia â†’ Eventoâ€, persistÃªncia em Aula) îˆ€fileciteîˆ‚turn42file0îˆ‚turn43file0îˆ
- Tipos divergentes de status/tipo entre frontend e backend (risco direto) îˆ€fileciteîˆ‚turn25file0îˆ‚turn37file0îˆ
- Auth compatÃ­vel por headers + defaults frÃ¡geis de seguranÃ§a (`JWT_SECRET=CHANGE_ME`) îˆ€fileciteîˆ‚turn52file0îˆ‚turn54file0îˆ
- EvidÃªncia de refatoraÃ§Ã£o associada ao â€œCodexâ€ e alteraÃ§Ã£o de proxy/Vite (potencial bloqueio para `/api/eventos`) îˆ€fileciteîˆ‚turn82file0îˆ
