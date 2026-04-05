# Investigação técnica do Projeto Jubileu com foco em migração do Frontend para Eventos e Workspace unificado

## Diagnóstico executivo e aderência às premissas

O repositório na branch **`jubileu-v2`** está em um estado de **transição explícita** entre um modelo “Dia → Aula” (persistência/rotas clássicas) e um modelo “Dia → Evento” (camada canônica), onde **Evento já existe como API canônica**, mas **a navegação e UI do frontend ainda permanecem centradas em `/dias` e `/aulas`**. Isso é coerente com o documento de domínio (que assume persistência em `Aula` e introdução gradual de “Evento”) fileciteturn42file0 e com o “execution plan” (que descreve uma padronização e migração incremental) fileciteturn43file0.

### Premissas arquiteturais — confirmação/contradição por evidência

**Evento deve ser a unidade operacional principal**  
✔ **Confirmado no backend e na documentação**, mas **não no frontend**.  
O backend expõe um conjunto de operações explicitamente sob “eventos” (`/api/eventos/...`): RSVP, check-in, start/end/cancel, seed de partida, e criação de lance fileciteturn32file0. A documentação do domínio coloca “Eventos” como o próximo nível após “Dias” na direção canônica fileciteturn42file0. Já o frontend não tem rota `/eventos` e não tem page/workspace por evento fileciteturn4file0.

**Dia deve ser apenas contexto (agrupador)**  
✔ **Confirmado como intenção e como estrutura predominante**.  
O backend mantém “Dia” como agregado de referência (ex.: `/dias/{data_iso}` retorna dia + aulas) fileciteturn36file0 e o docs/DOMAIN_MODEL fala em “Dia → Eventos” canônico, o que implica dia como agrupador/contexto fileciteturn42file0.

**Aula deve ser tratada como um TIPO de evento (não como entidade raiz de navegação)**  
✔ **Confirmado no backend, parcialmente no frontend**.  
No backend, “Evento” é uma projeção canônica sobre a entidade persistida “Aula”: `evento_id` na API canônica corresponde a uma `AulaModel` carregada por `get_evento_or_404` fileciteturn32file0, e o mapper do módulo `eventos` converte `TipoEventoAulaEnum.JOGO` em `EventoTipoCanonical.JOGO_LIVRE` fileciteturn40file0.  
No frontend, ainda “Aula” é o núcleo de roteamento (`/dias/:dataIso/aulas/:aulaId`) fileciteturn4file0, embora já exista um tipo “Evento” (`src/types/evento.ts`) sugerindo a migração fileciteturn25file0.

**Deve existir um único `WorkspaceEvento` com renderização condicional por tipo**  
⚠ **Parcialmente correto** (estrutura suportável, implementação inexistente).  
Existe **WorkspaceAula** (frontend e backend), com `meta.tipo` e estrutura de snapshot/painéis; mas não existe um “WorkspaceEvento” formal nem no backend nem no frontend fileciteturn20file0turn34file0. A estrutura atual permite **evoluir** `WorkspaceAula` para ser o `WorkspaceEvento` (conceitualmente), porque `meta.tipo` já é enum (“AULA/JOGO/OUTRO”) fileciteturn34file0turn41file0.

**Renderização condicional baseada em capabilities (não if espalhado)**  
❌ **Não implementado hoje**.  
O código atual tem lógica condicional local (ex.: painéis e botões variando por estado), mas não há um mecanismo central de capabilities para decidir “o que renderizar por tipo/role/status”. Isso precisará ser introduzido como parte do plano (recomendação fundamentada pelo objetivo e pelo fato de ainda não haver UI por outros tipos de evento).

**Rotas alvo (`/eventos/{eventoId}`, `/dias/{dataIso}/eventos/{eventoId}`, `/dias/{dataIso}/aulas/{aulaId}`)**  
⚠ **Parcialmente correto**: há compatibilidade só para `/dias/{dataIso}/aulas/{aulaId}` hoje.  
O frontend tem apenas as rotas `/dias` e `/dias/:dataIso/aulas/:aulaId` como núcleo fileciteturn4file0.  
No backend, há endpoints canônicos de ações de evento sob `/api/eventos/{evento_id}/...`, mas **não há evidência de um GET canônico para resolver evento → dia/dataIso**; o router de eventos lista apenas ações e listagens derivadas (participants/presentes), não uma leitura do evento em si fileciteturn32file0. Isso impacta diretamente a viabilidade de `/eventos/{eventoId}` como deep link sem ajustes no backend.

## Diagnóstico do frontend

### Rotas atuais e “centro de gravidade” do app

O roteamento principal do frontend (`AppRoutes`) confirma que o app está organizado em torno de:

- `/dias` (lista/visão de dias)
- `/dias/:dataIso/aulas/:aulaId` (página de aula/workspace)
- rotas auxiliares: `/turmas`, `/jogadores`, `/usuario`, `/login`, `/`(dashboard) fileciteturn4file0

A presença de `PrivateRoute.tsx` sugere intenção de proteção de rotas, mas `AppRoutes` implementa um wrapper próprio (`RotaProtegida`) e não referencia `PrivateRoute.tsx`, caracterizando provável redundância/arquivo “órfão” fileciteturn4file0turn45file0.

### Estrutura de páginas/containers e acoplamentos centrais

A página “de trabalho” é `AulaPage`, que recebe `dataIso` e `aulaId` via `useParams`, carrega o workspace e renderiza painéis de equipes/partidas/header (componentes em `src/components/aula/...`) fileciteturn11file0turn61file0. Isso confirma:

- **Acoplamento forte com Aula como raiz de navegação** (URL e nomes de componentes).
- **UI orientada a “equipes/partidas” como núcleo**, o que funciona bem para `AULA`, mas não cobre funcionalidades canônicas recentes de evento (RSVP/check-in/seed/lances).

### Evidência de suporte a “Evento” ainda não utilizado

Apesar de não existir rota `/eventos`, o frontend já possui:

- `src/types/evento.ts` (definições `EventoTipo` e `EventoStatus`) fileciteturn25file0
- `src/services/eventosService.ts` com chamadas para `/api/eventos/{id}/...` (RSVP, check-in, start/end/cancel, seed partida, create_lance) e autenticação por headers (`X-User-Id`, `X-Role`, `X-Jogador-Id`) fileciteturn23file0

Porém, **não há evidência de consumo real dessa service por páginas/components** (o que, na prática, significa que o “evento canônico” ainda não entrou no fluxo de UI).

### Riscos concretos de quebra durante a migração (baseados em arquivo)

**Risco de ambiente/dev: proxy rewritando `/api` pode quebrar `/api/eventos`**  
Há evidência de ajuste de proxy na configuração do Vite para reescrever paths removendo prefixo `/api` (isso aparece no diff do commit “Fix com Codex”) fileciteturn82file0.  
Esse padrão funciona para rotas legadas (`/api/dias` → `/dias`) porque o backend expõe ambas (legacy e `/api`) para **dias/turmas/jogadores/partidas** via `include_router(..., prefix="/api")` fileciteturn28file0.  
Mas o router de eventos no backend **já nasce com `prefix="/api"` internamente** fileciteturn32file0; logo, reescrever `/api/eventos/...` para `/eventos/...` tende a gerar 404. Isso precisa ser tratado como **bloqueio técnico** para a migração real para Eventos.

**Mismatch de tipos de status (frontend vs backend) para Evento**  
O frontend define `EventoStatus` como `"PLANEJADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA"` fileciteturn25file0, mas a API canônica retorna `EventoStatusCanonical` como `"PLANEJADO" | "EM_ANDAMENTO" | "ENCERRADO" | "CANCELADO"` fileciteturn37file0 (ex.: um evento concluído vira “ENCERRADO” via mapper) fileciteturn40file0. Sem alinhar isso, o frontend quebrará por tipagem ou por lógica condicional incorreta.

**Auth/UI de usuário não fornece os headers exigidos pelo modo compatível**  
O frontend atual implementa login “fake” via `AuthContext` (qualquer email/senha seta um objeto user em localStorage) fileciteturn7file0.  
Para usar RSVP/check-in como “self”, a API requer `user.jogador_id` (e no modo compatível isso vem de `X-Jogador-Id`) fileciteturn52file0turn40file0. Hoje não existe fluxo de UI operacional que selecione/amarre `JogadorId` ao “usuário/sessão”, e a página `/usuario` é apenas placeholder fileciteturn8file0.

## Diagnóstico backend → frontend (gaps de integração)

### Endpoints canônicos existentes e impacto direto na UI

O router de eventos expõe, com evidência direta:

- RSVP: `POST /api/eventos/{evento_id}/rsvp` e `DELETE /api/eventos/{evento_id}/rsvp` fileciteturn32file0  
- Check-in: `POST /api/eventos/{evento_id}/checkin` e `DELETE /api/eventos/{evento_id}/checkin` fileciteturn32file0  
- Ações admin/treinador: `POST /api/eventos/{evento_id}/start|end|cancel` (guardadas por `require_roles("admin","treinador")`) fileciteturn32file0  
- Listagens: `GET /api/eventos/{evento_id}/participants` e `/presentes` fileciteturn32file0  
- “Seed” de partida: `POST /api/eventos/{evento_id}/partidas/seed` fileciteturn32file0  
- Lances: `POST /api/partidas/{partida_id}/lances` fileciteturn32file0

O frontend atual **não consome** isso no fluxo principal (workspace). Hoje ele opera com rotas e endpoints “dia/aula” para equipes/partidas/stats.

### Autenticação: compatibilidade existe, mas a segurança e o fluxo não estão fechados

O backend suporta autenticação por:
- Bearer JWT **ou**
- headers legados `X-User-Id`, `X-Role`, `X-Jogador-Id` (modo compatível) fileciteturn52file0  

Por padrão, `AUTH_MODE` = `jwt_compat` e `JWT_SECRET` = `"CHANGE_ME"` fileciteturn54file0, o que é uma fragilidade (especialmente se esse default vazar para produção). Isso aparece como ponto crítico no próprio “artefato” de análise e deve ser tratado como parte da validação/plan.

### Workspace: há suporte real, mas não existe “timeline/eventos” ainda

Existe endpoint de workspace em `dias.py`:  
`GET /dias/{data_iso}/aulas/{aula_id}/workspace?since_version=...`, com retorno 204 se não mudou fileciteturn34file0.

Porém:
- `build_workspace_aula` retorna `eventos=[]` explicitamente (lista vazia) fileciteturn35file0, ou seja: **não há timeline/event feed real no workspace atual**.
- O `version` do workspace é calculado combinando `TeamConfig.version` e CRC32 das partidas fileciteturn35file0, logo mudanças via RSVP/check-in/lances não aparecem nesse versionamento (gap para “evento-centric UI” se ela depender de refresh por workspace).

### Funcionalidades do backend que já existem, mas o frontend não usa

1. RSVP/check-in + listagens de participantes/presentes (não há UI atual consumindo) fileciteturn32file0turn23file0  
2. Start/end/cancel canônicos e role-based (frontend usa start/finish via serviço legado `aulaLifecycleService`) fileciteturn65file0turn32file0  
3. Seed de partida por evento e criação de lance (não há UI em produção para isso) fileciteturn32file0turn23file0  

## Decisão arquitetural: WorkspaceEvento único, estratégia de rotas e papel de Aula

### Existe ou não suporte real a WorkspaceEvento hoje?

**Fato confirmado:** existe suporte a *workspace agregado* apenas no formato `WorkspaceAulaOut`/`WorkspaceAula` fileciteturn34file0turn20file0.  
**Fato confirmado:** `meta.tipo` já distingue tipos (“AULA/JOGO/OUTRO”) no backend fileciteturn41file0 e no workspace de saída fileciteturn34file0, o que permite que a UI trate “Aula” **como tipo**, não como raiz.  
**Fato confirmado:** o módulo de eventos é canônico mas se ancora na entidade persistida “Aula” (evento é `AulaModel`) fileciteturn40file0turn39file0.

### Decisão obrigatória: um único `WorkspaceEvento` com composição

**Decisão (recomendação técnica): usar um único `WorkspaceEvento` (frontend) com composição/capabilities.**

Justificativa baseada em evidência:
- O backend trabalha com **um único agregado persistido** (`Aula`) que representa o “evento” e já distingue `tipo` por enum fileciteturn39file0turn41file0.  
- O workspace existente já é “capaz” de descrever estados de equipes/partidas para qualquer `aula_id`, e o `tipo` está disponível para chavear UI fileciteturn34file0.  
- Criar workspaces separados por tipo exigiria duplicar plumbing (polling, layout, rotas) e, no estado atual do repo, não há evidência de endpoints ou schemas múltiplos de workspace que justifiquem “workspaces separados”.

**Hipótese (com base em gaps observados):** o backend precisará evoluir o workspace (ou criar endpoints complementares) para incluir timeline/participantes/lances de forma versionada, se a UI quiser “tempo real” completo por evento e não apenas por equipe/partida fileciteturn35file0turn32file0.

### Estratégia de rotas: implementar o alvo sem romper compatibilidade

**Fato confirmado:** hoje só existe `/dias/:dataIso/aulas/:aulaId` fileciteturn4file0.  
**Fato confirmado:** não há endpoint GET canônico para “evento por id” no router de eventos (apenas ações/listagens) fileciteturn32file0. Isso torna `/eventos/{eventoId}` inviável como deep link estável **sem ajuste** no backend.

Recomendação incremental (executável pelo Codex):
- Implementar primeiro `/dias/{dataIso}/eventos/{eventoId}` como rota “contextual canônica” (eventoId = aulaId) no frontend. Isso não exige backend novo, pois o workspace e o dia já são carregáveis via `dataIso` e `aulaId` fileciteturn34file0turn36file0.
- Manter `/dias/{dataIso}/aulas/{aulaId}` como compatibilidade temporária, mas redirecionar internamente para a rota de eventos (ou renderizar o mesmo `WorkspaceEventoPage`).
- Só habilitar `/eventos/{eventoId}` (canônica) quando houver um endpoint mínimo no backend para resolver `eventoId → dataIso|dia_id` (ex.: `GET /api/eventos/{eventoId}`), porque hoje o router de eventos não fornece isso fileciteturn32file0.

### Papel de Aula: “AULA ativa contexto de turma?”

Sim — e isso está alinhado ao que o código sugere.

- O tipo persistido `TipoEventoAulaEnum` distingue “AULA/JOGO/OUTRO” fileciteturn41file0.  
- A camada canônica transforma “JOGO” em “JOGO_LIVRE” para API de eventos fileciteturn40file0, preservando “AULA” como um tipo relevante.  
- O workspace expõe `meta.turma_id` e `meta.turma_nome` fileciteturn34file0, o que reforça que “turma” é um contexto associado ao evento. Portanto, **o tipo AULA é um bom “gate” arquitetural** para habilitar UI que depende do contexto de turma.

## Renderização condicional: validação e modelo correto com capabilities

### Estado atual (validação)

- **Fato confirmado:** no frontend atual, a renderização do workspace é estruturalmente fixa (painéis de equipes, partidas etc.) e acoplada à rota de aula fileciteturn11file0turn62file0turn64file0.  
- **Fato confirmado:** o backend é capaz de distinguir tipo e status no objeto do evento/’aula’ e no workspace (`meta.tipo`, `meta.status`) fileciteturn34file0turn41file0.  
- **Fato confirmado:** a API canônica tem regras por tipo (ex.: RSVP é apenas para `JOGO_LIVRE`) fileciteturn40file0turn32file0.

### Modelo recomendado (capabilities)

**Recomendação:** introduzir um “registry” central de capabilities por tipo de evento, e derivar UI e ações a partir dele, em vez de `if (tipo === ...)` espalhados.

Um desenho mínimo e rastreável:
- `capabilities/eventoCapabilities.ts`: define quais capacidades existem (ex.: `RSVP`, `CHECKIN`, `EQUIPES`, `PARTIDAS_STATS`, `SEED_PARTIDA`, `LANCES`) e um mapa `EventoTipo → Set<Capability>`.
- `workspaces/WorkspaceEventoPage.tsx`: decide o que carregar/renderizar consultando esse set.
- Regras dependentes de role/status devem ser tratadas como **capabilities derivadas** (ex.: `CAN_START` só para `admin`/`treinador` e status “PLANEJADO”) usando o modelo de auth atual do backend fileciteturn32file0turn52file0.

Isso respeita a premissa “capabilities, não if espalhado” e se ancora na evidência de que `tipo` e `status` já existem no contrato do backend fileciteturn37file0turn34file0.

## Jogador/User: estado atual, separação e proposta

### Evidência do estado atual

No frontend:
- Existe rota `/usuario` mas a página é um placeholder fileciteturn8file0turn4file0.
- A autenticação atual é “fake login” em `AuthContext` (sem role/jogadorId) fileciteturn7file0.
- A navegação (`Navbar`) não reflete sessão/role, apenas links estáticos e um “Entrar” fileciteturn46file0.

No backend:
- Existe `/api/auth/login` e `/api/auth/me` fileciteturn55file0.
- O “current user” pode vir via JWT ou via headers legados (incluindo `X-Jogador-Id`) fileciteturn52file0.
- A API de eventos exige `jogador_id` para ações “self” (rsvp/checkin) fileciteturn40file0.
- Jogadores têm endpoints CRUD/listagem em `/api/jogadores` fileciteturn56file0.

### Proposta clara: separar UserProfile e JogadorProfile (e por quê)

**Recomendação:** sim, separar conceitualmente, porque o backend já separa “usuário” (auth identity) e “jogador” (entidade de domínio com presença/participação).  
Na prática do repo, o modo compatível permite que “um user” opere como “um jogador” por header `X-Jogador-Id` fileciteturn52file0, o que reforça a necessidade de uma UI explícita para selecionar/associar jogador.

Estrutura sugerida:
- `UserProfilePage` (`/usuario`): exibir sessão atual (userId, role, modo de auth), permitir selecionar `role` e o `jogadorId ativo` (buscando lista de jogadores via `/api/jogadores`) fileciteturn56file0turn23file0. Armazenar isso no contexto/localStorage e usar para montar headers.
- `JogadorProfilePage` (`/jogadores/:id`): exibir detalhes e histórico do jogador (com o que o backend já fornece hoje via endpoints de jogadores; para “histórico em eventos”, ainda faltam endpoints, então isso deve ser tratado como lacuna). O router atual de jogadores suporta obter por ID fileciteturn56file0.

## Arquivos que devem ser desmembrados com justificativa e divisão concreta

### Frontend

`frontend/jubileu-web/src/components/aula/WorkspaceEquipesPanel.tsx`  
Problema: concentra regras de UI, chamadas de serviços (`diasService`, `aulaLifecycleService`), controle de estado e fluxos críticos (start/finish, mover jogadores, salvar estado) em um único componente extenso fileciteturn62file0turn65file0.  
Divisão concreta recomendada:
- `workspaces/evento/panels/EquipesPanel/EquipesPanel.tsx` (container)
- `.../EquipesPanel/EquipeCard.tsx`
- `.../EquipesPanel/JogadorLista.tsx`
- `.../EquipesPanel/actions.ts` (comandos: mover, salvar, iniciar/finalizar)
- `.../EquipesPanel/selectors.ts` (derivações)

`frontend/jubileu-web/src/components/aula/WorkspacePartidasPanel.tsx`  
Problema: mistura renderização de tabela/placar, formulários e fluxo de persistência de estatísticas, com chamadas diretas ao serviço de dias/partidas fileciteturn64file0turn66file0.  
Divisão concreta recomendada:
- `PartidasPanel.tsx` (container)
- `PartidaCard.tsx` (render)
- `StatsEditor.tsx` (form)
- `partidasCommands.ts` (persistência)

`frontend/jubileu-web/src/routes/PrivateRoute.tsx`  
Problema: duplicação conceitual com `RotaProtegida` embutido em `AppRoutes` e provável não-uso real fileciteturn45file0turn4file0.  
Ação: remover ou consolidar em um único padrão.

### Backend (impacto indireto na migração para eventos)

`backend/jubileu-api-fastapi/app/routers/eventos.py` + gaps de leitura  
Problema: router canônico de eventos expõe ações, mas não expõe leitura canônica simples (`GET /api/eventos/{id}`), o que dificulta implementar `/eventos/{eventoId}` no frontend fileciteturn32file0.  
Divisão concreta recomendada:
- `GET /api/eventos/{evento_id}` (mínimo: `{id, dia_id, data_iso, tipo, status, horario_inicio, horario_fim}`)
- opcional: `GET /api/eventos/{evento_id}/workspace` se desejarem um workspace realmente canônico.

## Validação do artefato enviado (comparação com o estado real)

Como o repositório contém um documento de análise/refatoração (`docs/refactors/relatorio-arquitetura-plano-refatoracao.md`) fileciteturn47file0, a validação abaixo compara **afirmações típicas** desse artefato com o código atual.

✔ **Confirmado**
- **Backend possui API canônica de eventos** (RSVP, check-in, start/end/cancel, seed, lances) fileciteturn32file0.
- **Existe compatibilidade de auth via headers legados**, além de JWT, no modo `jwt_compat` fileciteturn52file0turn54file0.
- **Frontend ainda está centrado em `/dias` e `/aulas`** no roteamento principal fileciteturn4file0.
- **Há histórico de mudanças “com Codex”** em commits (ex.: commit “Fix com Codex”) fileciteturn82file0.

⚠ **Parcialmente correto**
- “Workspace/timeline/eventos”: existe endpoint de workspace, mas **não existe timeline real** (`eventos=[]`) fileciteturn35file0. Se o artefato assume timeline já pronta, isso é apenas parcialmente verdadeiro.
- “Documentação ausente”: o README contém vários `#todo`, mas existe `docs/ARCHITECTURE.md` e `docs/DOMAIN_MODEL.md` fileciteturn48file0turn42file0turn49file0.

❌ **Incorreto**
- Qualquer alegação de que “docs/ARCHITECTURE.md não existe” é incorreta no estado atual do repositório fileciteturn48file0.

❗ **Ausente/importante (para o objetivo atual)**
- O artefato (e o repo) não fecham um plano completo para o **frontend evento-cêntrico**: não há rota `/eventos`, não há `WorkspaceEvento`, e há divergências de tipos/status entre front/back que precisam ser endereçadas fileciteturn4file0turn37file0turn25file0.

## Plano executável para o Codex em fases

Abaixo está um plano **orientado a evidências do repo**, com entregas pequenas e rastreáveis, respeitando compatibilidade.

### Fase 1 — Auditoria

Objetivo: “congelar” contratos e remover bloqueios imediatos para consumir `/api/eventos`.

Arquivos impactados:
- `frontend/jubileu-web/vite.config.ts` (proxy/rewrite) — evidência de rewrite no commit “Fix com Codex” fileciteturn82file0
- `frontend/jubileu-web/src/types/evento.ts` (status/tipos) fileciteturn25file0
- `backend/jubileu-api-fastapi/app/routers/eventos.py` (confirmar rotas existentes) fileciteturn32file0

Riscos:
- Manter rewrite de `/api` pode bloquear a integração com `/api/eventos` no dev (404).
- Tipos `EventoStatus` divergentes podem causar bugs silenciosos.

Critérios de aceite:
- Frontend consegue chamar ao menos `GET /api/eventos/{id}/participants` sem rewrite quebrando path (em ambiente dev/proxy).
- Tipos do frontend refletem exatamente `EventoTipoCanonical` e `EventoStatusCanonical` do backend fileciteturn37file0turn40file0.

### Fase 2 — Rotas

Objetivo: introduzir rotas evento-cêntricas sem quebrar links antigos.

Arquivos impactados:
- `frontend/jubileu-web/src/routes/AppRoutes.tsx` fileciteturn4file0
- Nova page: `frontend/jubileu-web/src/pages/eventos/EventoPage.tsx` (a criar, reutilizando AulaPage como base)
- `frontend/jubileu-web/src/pages/aula/AulaPage.tsx` (virar wrapper/redirect ou reutilizar componente comum) fileciteturn11file0

Riscos:
- `/eventos/{eventoId}` não é deep-link viável sem endpoint de leitura no backend (hoje não existe) fileciteturn32file0.
- Redirecionamentos mal feitos podem quebrar navegação e histórico do browser.

Critérios de aceite:
- Existe rota `/dias/:dataIso/eventos/:eventoId` renderizando o workspace (mesma tela atual).
- Rota antiga `/dias/:dataIso/aulas/:aulaId` continua funcionando (compatibilidade), mas é marcada como “legacy” e aponta para o mesmo componente.

### Fase 3 — WorkspaceEvento

Objetivo: criar um **único** “workspace” de UI (`WorkspaceEvento`) com capacidades por tipo.

Arquivos impactados:
- Migrar/refatorar `src/pages/aula/AulaPage.tsx` fileciteturn11file0
- Criar `src/workspaces/evento/WorkspaceEventoPage.tsx`
- Criar `src/workspaces/evento/capabilities.ts`
- Refatorar `src/components/aula/*` para `src/workspaces/evento/panels/*` (ou manter e criar facade)

Riscos:
- Refatoração grande nos componentes de workspace (equipes/partidas) pode introduzir regressões.
- Se não houver um “registry” de capabilities, o código tende a ficar com `if` espalhado e difícil de manter.

Critérios de aceite:
- `WorkspaceEventoPage` recebe `{dataIso?, eventoId}` e decide painéis por capabilities (pelo menos `AULA` vs `JOGO_LIVRE`).
- Para `AULA`, a UI atual (equipes/partidas) permanece funcional (sem perda).

### Fase 4 — Integração backend

Objetivo: consumir de fato as operações canônicas de evento no frontend, priorizando JOGO_LIVRE.

Arquivos impactados:
- `frontend/jubileu-web/src/services/eventosService.ts` (já existe) fileciteturn23file0
- `frontend/jubileu-web/src/services/aulaLifecycleService.ts` (avaliar migração para `/api/eventos/{id}/start|end|cancel`) fileciteturn65file0turn32file0
- `backend/jubileu-api-fastapi/app/modules/auth/*` (se necessário ajustar fluxo de sessão) fileciteturn52file0turn55file0

Riscos:
- Dependência de headers de auth (role/jogadorId) sem UI pronta (ver Fase 6).
- Workspace versionado não incorpora mudanças de RSVP/check-in/lances (atualizar UI pode exigir refetch fora do polling) fileciteturn35file0turn32file0.

Critérios de aceite:
- Para um evento tipo `JOGO_LIVRE`, usuário consegue:
  - RSVP/Cancelar RSVP
  - Check-in/Desfazer check-in
  - Ver lista de participantes/presentes
  usando `eventosService` e um “session header” consistente fileciteturn23file0turn32file0.

### Fase 5 — UI

Objetivo: evoluir layout e navegação para refletir “Evento” como unidade operacional.

Arquivos impactados:
- `frontend/jubileu-web/src/components/layout/Navbar.tsx` (refletir sessão, incluir “Eventos”) fileciteturn46file0
- `frontend/jubileu-web/src/pages/dias/DiasPage.tsx` (ponto de entrada para eventos por dia)
- Novos componentes de ação por evento (cards/botões)

Riscos:
- Mudança de navegação pode confundir usuários se a compatibilidade não estiver clara.
- Sem endpoint canônico de “GET evento”, a UX de `/eventos/{id}` ainda será limitada.

Critérios de aceite:
- UI permite abrir um evento a partir de um dia (e/ou lista), e a tela do evento se identifica como “Evento” (não “Aula”) com tipo/status consistentes com backend fileciteturn37file0turn34file0.

### Fase 6 — Jogador/User

Objetivo: fechar o ciclo de sessão para permitir RSVP/check-in “self” e ações por role.

Arquivos impactados:
- `frontend/jubileu-web/src/pages/user/UserPage.tsx` (de placeholder para página funcional) fileciteturn8file0
- `frontend/jubileu-web/src/context/AuthContext.tsx` (evoluir de fake login para session com role/jogadorId) fileciteturn7file0
- `backend/jubileu-api-fastapi/app/modules/auth/deps.py` (referência de como o backend lê headers) fileciteturn52file0

Riscos:
- Se o time migrar para JWT puro, ainda é preciso resolver `jogador_id` (hoje não existe nos DEFAULT_ACCOUNTS) fileciteturn53file0turn51file0.
- Segurança: `JWT_SECRET` default “CHANGE_ME” não deve ir para prod fileciteturn54file0.

Critérios de aceite:
- `UserPage` permite selecionar `role` e `jogadorId` (buscando lista de jogadores do backend) e isso passa a ser usado automaticamente por `eventosService` fileciteturn56file0turn23file0.
- Navbar reflete estado de sessão (logado vs não logado) fileciteturn46file0.

## Lista estruturada de issues CORE/DEV

A lista abaixo inclui (a) o que já existe no Linear e (b) o que precisa ser criado para viabilizar o plano.

### CORE (decisão)

- CORE: **Definir contrato de “Evento” no frontend** (tipos/status alinhados com backend canônico; resolver “PLANEJADO vs PLANEJADA”, “ENCERRADO vs CONCLUIDA”) fileciteturn37file0turn25file0  
- CORE: **Decisão de rotas** — priorizar `/dias/{dataIso}/eventos/{eventoId}` agora; `/eventos/{eventoId}` só após endpoint de leitura no backend (router atual não fornece GET do evento) fileciteturn32file0  
- CORE: **Modelo de capabilities** para render por tipo/role/status (evitar if espalhado; basear em `meta.tipo`/`meta.status`) fileciteturn34file0turn41file0  
- CORE: **Estratégia de auth** (manter `jwt_compat` e headers no curto prazo vs migrar para JWT real; tratar risco `JWT_SECRET=CHANGE_ME`) fileciteturn52file0turn54file0

### DEV (execução)

- DEV: Ajustar Vite proxy para **não quebrar `/api/eventos`** (bloqueio técnico evidenciado pelo rewrite no commit codex) fileciteturn82file0  
- DEV: Implementar rotas `/dias/:dataIso/eventos/:eventoId` + compat `/dias/:dataIso/aulas/:aulaId` em `AppRoutes` fileciteturn4file0  
- DEV: Criar `WorkspaceEventoPage` unificado e mover/refatorar painéis de `components/aula/*` fileciteturn62file0turn64file0  
- DEV: Integrar UI para RSVP/check-in/participants/presentes via `eventosService` (já existe, falta consumo) fileciteturn23file0turn32file0  
- DEV: Evoluir `/usuario` para fornecer `role` e `jogadorId` (necessário para “self actions”) fileciteturn8file0turn52file0  
- DEV: (Backend) Criar `GET /api/eventos/{eventoId}` para habilitar rota canônica `/eventos/{eventoId}` (hoje ausente) fileciteturn32file0  
- DEV: (Backend) Revisar versionamento do workspace ou endpoints adicionais se a UI exigir timeline/refresh baseado em RSVP/check-in/lances fileciteturn35file0turn32file0  

### Referência a issues existentes no Linear (para alinhamento)

Há issues DEV existentes relacionadas a lances e integração de UI com endpoints canônicos (ex.: “Integrar UI com endpoint /partidas/.../lances”, “Renomear endpoint de lances para /events”), além de outras de front/back que impactam essa migração fileciteturn60file0. O plano acima as acomoda principalmente nas Fases 4 e 5, mas com o bloqueio de “rotas + session headers” como pré-requisito.

## Evidências principais usadas nesta investigação

- Rotas do frontend (ausência de `/eventos`, centralidade `/dias` e `/aulas`) fileciteturn4file0  
- API canônica de eventos no backend (RSVP/check-in/start/end/cancel/seed/lances) fileciteturn32file0  
- Workspace existente (endpoint e schema), com eventos/timeline ainda vazio fileciteturn34file0turn35file0  
- Modelo canônico de domínio e execução de refactor (direção “Dia → Evento”, persistência em Aula) fileciteturn42file0turn43file0  
- Tipos divergentes de status/tipo entre frontend e backend (risco direto) fileciteturn25file0turn37file0  
- Auth compatível por headers + defaults frágeis de segurança (`JWT_SECRET=CHANGE_ME`) fileciteturn52file0turn54file0  
- Evidência de refatoração associada ao “Codex” e alteração de proxy/Vite (potencial bloqueio para `/api/eventos`) fileciteturn82file0