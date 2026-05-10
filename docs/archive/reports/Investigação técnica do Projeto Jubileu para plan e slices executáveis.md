> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# InvestigaÃ§Ã£o tÃ©cnica do Projeto Jubileu para plan e slices executÃ¡veis

## Resumo executivo

A leitura do estado atual do Projeto Jubileu mostra uma base mais avanÃ§ada do que parte da trilha documental sugere. No backend jÃ¡ existem `create_app()`, `/health`, aliases `/api`, autenticaÃ§Ã£o JWT com modo compatÃ­vel por headers, testes de fumaÃ§a, testes de eventos e testes de RBAC. No frontend jÃ¡ existem rota contextual de evento (`/dias/:dataIso/eventos/:eventoId`), `EventoPage`, `WorkspaceEventoPage`, polling de participantes e timeline de lances, alÃ©m de uma pÃ¡gina de sessÃ£o que permite selecionar `role` e `jogadorId`. Em outras palavras: o projeto jÃ¡ saiu do estÃ¡gio â€œsomente Aulaâ€, mas ainda nÃ£o concluiu a convergÃªncia arquitetural para â€œEventoâ€ como conceito operacional Ãºnico. îˆ€fileciteîˆ‚turn27file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn43file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn46file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn47file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn75file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn140file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn142file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn146file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn148file0îˆ‚L1-L1îˆ

O ponto central do diagnÃ³stico Ã© este: o happy path solicitado no material anexado â€” autenticar, abrir dia, abrir evento, fazer RSVP/check-in, ver presentes, participar da partida e registrar lance â€” estÃ¡ **parcialmente implementado**, mas ainda com uma ponte transitÃ³ria entre superfÃ­cies legadas e canÃ´nicas. O evento jÃ¡ existe como API canÃ´nica, porÃ©m a tela principal de evento ainda Ã© abastecida por `useWorkspaceEvento -> useWorkspaceAula -> /dias/{dataIso}/aulas/{aulaId}/workspace`, e os painÃ©is centrais continuam presos aos serviÃ§os legados de Aula. O resultado prÃ¡tico Ã© um sistema funcional para navegaÃ§Ã£o, leitura e parte dos comandos administrativos, mas ainda incompleto para o uso real do fluxo self de evento. îˆ€fileciteîˆ‚turn0file0îˆ îˆ€fileciteîˆ‚turn61file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn63file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn65file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn104file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn105file0îˆ‚L1-L1îˆ

A melhor decisÃ£o, portanto, nÃ£o Ã© uma reescrita. Ã‰ fechar a transiÃ§Ã£o com um plano incremental e compatÃ­vel com a taxonomia jÃ¡ existente em îˆ€entityîˆ‚["company","Linear","issue tracking platform"]îˆ e no repositÃ³rio em îˆ€entityîˆ‚["company","GitHub","code hosting platform"]îˆ: congelar contratos do happy path, introduzir um adapter explÃ­cito de `WorkspaceEvento`, completar UI de RSVP/check-in/seed, endurecer o modelo de sessÃ£o operacional `user + jogador`, e sÃ³ entÃ£o avanÃ§ar em simplificaÃ§Ã£o estrutural e hardening de deploy. Essa direÃ§Ã£o Ã© coerente com o plano incremental jÃ¡ documentado no repositÃ³rio e com a separaÃ§Ã£o CORE/DEV que jÃ¡ existe nas issues. îˆ€fileciteîˆ‚turn84file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn85file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn86file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn87file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn88file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn115file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn115file3îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn116file0îˆ‚L1-L1îˆ

## DiagnÃ³stico do happy path

A investigaÃ§Ã£o foi guiada pelo fluxo funcional explÃ­cito anexado pelo usuÃ¡rio: usuÃ¡rio autenticado, lista de dias, seleÃ§Ã£o de dia, acesso ao evento, RSVP/check-in, visualizaÃ§Ã£o de presentes, participaÃ§Ã£o em partida e registro de lance. Isso Ã© importante porque vÃ¡rias decisÃµes no cÃ³digo jÃ¡ foram tomadas para esse caminho, mas a implementaÃ§Ã£o ainda mistura contrato legado e contrato canÃ´nico. îˆ€fileciteîˆ‚turn0file0îˆ

O fluxo observado hoje pode ser sintetizado assim:

```mermaid
flowchart LR
    A[Login] --> B[Lista de dias]
    B --> C[Detalhe do dia]
    C --> D[Rota de evento]
    D --> E[Workspace carregado por endpoint legado de aula]
    E --> F[Participantes e presentes por API canÃ´nica]
    E --> G[Equipes e partidas por API legada]
    F --> H[RSVP e check-in]
    G --> I[Lances]
```

A tabela abaixo resume o estado do happy path com base no cÃ³digo auditado, nos testes existentes e no material anexado. A sÃ­ntese usa principalmente `AuthContext`, `UsuarioPerfil`, `DiaLista`, `DiaDetalhe`, `AppRoutes`, `EventoPage`, `WorkspaceEventoPage`, `useWorkspaceEvento`, `useEventoLiveData`, `useLancesTimeline`, `test_eventos_api.py` e `test_auth_jwt_rbac.py`. îˆ€fileciteîˆ‚turn66file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn148file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn44file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn45file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn43file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn46file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn47file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn61file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn75file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn140file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn99file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn146file0îˆ‚L1-L1îˆ

| Etapa | Estado | EvidÃªncia operacional | DiagnÃ³stico |
|---|---|---|---|
| Autenticar | Parcialmente funcional | `/api/auth/login` e `/api/auth/me` existem; hÃ¡ JWT e modo compatÃ­vel; `UsuarioPerfil` jÃ¡ permite `role` e `jogadorId` | Funciona, mas o `AuthContext` faz fallback silencioso para modo legado em qualquer erro e pode deixar a sessÃ£o sem `jogadorId` |
| Acessar lista de dias | Funcional | `DiaLista` usa `listarDias()` | Caminho estÃ¡vel |
| Selecionar um dia | Funcional | `DiaDetalhe` usa `obterDiaPorData()` e jÃ¡ abre rota de evento | Caminho estÃ¡vel |
| Acessar evento | Parcialmente funcional | existe `/dias/:dataIso/eventos/:eventoId`; `EventoPage` renderiza `WorkspaceEventoPage` | A rota jÃ¡ Ã© canÃ´nica, mas a carga de dados ainda Ã© de Aula |
| Fazer RSVP | NÃ£o implementado na UI | endpoints e service existem | Backend pronto, frontend ainda sem gatilho operacional |
| Fazer check-in | NÃ£o implementado na UI | endpoints e service existem | Mesmo problema do RSVP |
| Ver participantes/presentes | Funcional | `useEventoLiveData` chama `/api/eventos/{id}/participants` e `/presentes` | Leitura pronta |
| Participar de uma partida | Parcial | aula usa `/dias/.../partidas`; evento tem `seed` canÃ´nico disponÃ­vel | Fluxo de partida ainda Ã© mais forte no caminho legado |
| Registrar lance | Parcialmente funcional | hooks e componentes usam `/api/partidas/{id}/lances` e `/api/eventos/{id}/lances`; backend tem testes | O registro existe, mas depende de o evento jÃ¡ estar operacionalmente configurado |

Os bloqueios mais relevantes do happy path estÃ£o concentrados em trÃªs pontos. Primeiro, **as aÃ§Ãµes self de evento nÃ£o estÃ£o fechadas na UI**, apesar de existirem no backend e nos serviÃ§os. Segundo, **a tela de evento ainda depende do read-model legado de Aula**. Terceiro, **a sessÃ£o operacional ainda Ã© permissiva demais no login e rÃ­gida demais no uso do happy path**, porque o fallback para modo legado pode mascarar um backend fora do ar e, ao mesmo tempo, nÃ£o garantir `jogadorId` para RSVP/check-in. îˆ€fileciteîˆ‚turn56file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn57file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn61file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn65file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn66file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn69file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn123file0îˆ‚L1-L1îˆ

## Mapa de drift e inventÃ¡rio de consumo

O drift principal nÃ£o Ã© â€œfrontend versus backendâ€ no sentido clÃ¡ssico de ausÃªncia de endpoints. O backend jÃ¡ oferece bastante superfÃ­cie canÃ´nica. O drift real Ã© **frontend canÃ´nico na navegaÃ§Ã£o, legado na orquestraÃ§Ã£o**. A rota jÃ¡ fala em evento; a API de participantes, lances e status jÃ¡ fala em evento; mas a carga do workspace, os painÃ©is centrais e parte da lÃ³gica de capability ainda falam em Aula. îˆ€fileciteîˆ‚turn43file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn47file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn61file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn63file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn65file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn125file0îˆ‚L1-L1îˆ

A tabela abaixo consolida as principais telas e os endpoints efetivamente consumidos hoje. A sÃ­ntese foi derivada de `AppRoutes.tsx`, `diasService.ts`, `WorkspaceEquipesPanel.tsx`, `WorkspacePartidasPanel.tsx`, `useEventoLiveData.ts`, `EventoStatusActions.tsx`, `useLancesTimeline.ts`, `authService.ts`, `AuthContext.tsx`, `UsuarioPerfil.tsx` e `jogadoresDashboardService.ts`. îˆ€fileciteîˆ‚turn43file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn73file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn104file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn105file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn75file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn128file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn140file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn69file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn66file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn148file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn113file0îˆ‚L1-L1îˆ

| Tela / container | Endpoint(s) consumidos hoje | Consumo atual | Leitura |
|---|---|---|---|
| `DiaLista` | `GET /dias` | Ativo | Correto |
| `DiaDetalhe` | `GET /dias/{dataIso}`, `GET /turmas/`, `POST /dias/{dataIso}/aulas`, `DELETE /dias/{dataIso}/aulas/{id}` | Ativo | Legado, mas funcional |
| `EventoPage` / `WorkspaceEventoPage` | `GET /dias/{dataIso}/aulas/{aulaId}/workspace` | Ativo | FaÃ§ade canÃ´nica sobre endpoint legado |
| `WorkspaceEquipesPanel` | `PUT /dias/.../jogadores/{id}/status`, `PUT /dias/.../jogadores/{id}/time`, `POST /dias/.../times`, `DELETE /dias/.../times/{id}`, `PUT /dias/.../estado-equipes`, `POST /dias/.../start`, `POST /dias/.../finish` | Ativo | NÃºcleo de Aula persistida |
| `WorkspacePartidasPanel` | `POST /dias/.../partidas`, `DELETE /dias/.../partidas/{id}`, `PUT /dias/.../partidas/{id}/jogadores/{id}/stats` | Ativo | NÃºcleo de Aula persistida |
| `useEventoLiveData` / `ParticipantesPanel` | `GET /api/eventos/{id}/participants`, `GET /api/eventos/{id}/presentes` | Ativo | CanÃ´nico, leitura pronta |
| `EventoStatusActions` | `POST /api/eventos/{id}/start`, `POST /api/eventos/{id}/end`, `POST /api/eventos/{id}/cancel` | Ativo | CanÃ´nico, mas com gating por status legado |
| `useLancesTimeline` / `QuickAddLance` | `GET /api/eventos/{id}/lances`, `POST /api/partidas/{id}/lances` | Ativo | CanÃ´nico e jÃ¡ com polling |
| `AuthContext` / `UsuarioPerfil` | `POST /api/auth/login`, `GET /api/auth/me`, `GET /jogadores/` | Ativo | Bom ponto de apoio para fechar self-actions |
| `DashboardJogadores` | `GET /dashboards/jogadores/resumo`, `GET /dashboards/jogadores/ranking` | Ativo no frontend, mas suspeito | O backend testado garante `/api/dashboards/*`, nÃ£o o contrato root |

O segundo recorte Ãºtil Ã© identificar superfÃ­cie pronta no backend que ainda nÃ£o virou experiÃªncia de produto. Os serviÃ§os de evento exportam RSVP, cancelamento de RSVP, check-in self, desfazer check-in, check-in manual de participante e `seedPartidaEvento`, mas as buscas no repositÃ³rio retornam apenas as definiÃ§Ãµes desses mÃ©todos e nÃ£o revelam call sites equivalentes na UI; por contraste, `EventoStatusActions` e a timeline de lances aparecem de fato como consumo real. îˆ€fileciteîˆ‚turn56file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn135file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn141file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn131file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn138file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn136file2îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn140file0îˆ‚L1-L1îˆ

A correÃ§Ã£o mÃ­nima para o drift atual nÃ£o Ã© trocar nomes em massa. Ã‰ introduzir um **adapter explÃ­cito** entre `WorkspaceAula` e `WorkspaceEvento`, unificar o vocabulÃ¡rio de tipo/status na camada de apresentaÃ§Ã£o e completar as aÃ§Ãµes self que jÃ¡ existem no backend. Isso reduz o drift sem tocar em tabelas, sem renomear persistÃªncia e sem romper o contrato legado que hoje sustenta a parte jÃ¡ funcional do produto. îˆ€fileciteîˆ‚turn81file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn84file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn87file0îˆ‚L1-L1îˆ

Arquivos e trechos de cÃ³digo mais relevantes para esse diagnÃ³stico:

- `frontend/jubileu-web/src/routes/AppRoutes.tsx`: jÃ¡ existe a rota `/dias/:dataIso/eventos/:eventoId`, convivendo com a rota legada de aula. îˆ€fileciteîˆ‚turn43file0îˆ‚L1-L1îˆ
- `frontend/jubileu-web/src/pages/eventos/EventoPage.tsx` e `src/pages/dias/AulaPage.tsx`: os dois wrappers apontam para o mesmo `WorkspaceEventoPage`, confirmando a convivÃªncia canÃ´nico/legado. îˆ€fileciteîˆ‚turn46file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn54file0îˆ‚L1-L1îˆ
- `frontend/jubileu-web/src/hooks/useWorkspaceEvento.ts`: o hook de evento Ã© apenas uma delegaÃ§Ã£o para `useWorkspaceAula`. îˆ€fileciteîˆ‚turn61file0îˆ‚L1-L1îˆ
- `frontend/jubileu-web/src/services/workspaceAulaService.ts`: o fetch real ainda bate em `/dias/{dataIso}/aulas/{aulaId}/workspace`. îˆ€fileciteîˆ‚turn65file0îˆ‚L1-L1îˆ
- `frontend/jubileu-web/src/workspaces/evento/components/EventoStatusActions.tsx`: a UI chama endpoints canÃ´nicos, mas seus botÃµes ainda dependem de status legados como `PLANEJADA`. îˆ€fileciteîˆ‚turn128file0îˆ‚L1-L1îˆ
- `frontend/jubileu-web/src/workspaces/evento/capabilities.ts`: capabilities ainda usam `TipoEventoAula` e `StatusAula`, nÃ£o um contrato canÃ´nico de Evento. îˆ€fileciteîˆ‚turn129file0îˆ‚L1-L1îˆ
- `frontend/jubileu-web/src/services/dashboard/jogadoresDashboardService.ts`: dashboards usam `/dashboards/*`, enquanto os testes de alias do backend explicitam `/api/dashboards/*`. îˆ€fileciteîˆ‚turn113file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn121file0îˆ‚L1-L1îˆ
- `frontend/jubileu-web/src/context/AuthContext.tsx`: login com fallback automÃ¡tico para modo legado, sem falha explÃ­cita ao usuÃ¡rio. îˆ€fileciteîˆ‚turn66file0îˆ‚L1-L1îˆ

## DomÃ­nio, documentaÃ§Ã£o e governanÃ§a

O estado do domÃ­nio estÃ¡ coerente com o que a prÃ³pria documentaÃ§Ã£o tÃ©cnica mais recente descreve: **`Evento` jÃ¡ Ã© o conceito canÃ´nico de negÃ³cio, mas a persistÃªncia ainda se ancora em `Aula`**. `docs/DOMAIN_MODEL.md` diz isso de forma explÃ­cita, e os modelos confirmam a estratÃ©gia: `EventoParticipante` e `Lance` existem como entidades prÃ³prias, mas continuam referenciando `aula_id`, nÃ£o `evento_id`; ao mesmo tempo, os schemas canÃ´nicos de evento jÃ¡ publicam `EventoTipoCanonical` e `EventoStatusCanonical` com vocabulÃ¡rio prÃ³prio. îˆ€fileciteîˆ‚turn81file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn143file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn125file0îˆ‚L1-L1îˆ

O diagrama abaixo resume corretamente a situaÃ§Ã£o atual e o caminho incremental desejÃ¡vel:

```mermaid
flowchart LR
    D[Dia] --> A[Aula persistida]
    A --> W[WorkspaceAula]
    A --> P[EventoParticipante]
    A --> L[Lance]
    A --> C[ServiÃ§o canÃ´nico de Evento]
    C --> E[Evento API/UI]
    W --> X[Adapter WorkspaceEvento]
```

A leitura correta dessas peÃ§as Ã© a seguinte. `JogadorAula` continua sendo o snapshot do jogador na execuÃ§Ã£o da aula/workspace; `EventoParticipante` Ã© a participaÃ§Ã£o operacional no evento, cobrindo RSVP/check-in; `Lance` Ã© o log operacional da partida/evento; e `WorkspaceAula` Ã© o read-model legado que ainda alimenta a principal experiÃªncia de tela. O problema nÃ£o Ã© essa coexistÃªncia existir. O problema Ã© ela ainda estar **exposta diretamente** ao frontend em vez de encapsulada por uma camada de traduÃ§Ã£o. îˆ€fileciteîˆ‚turn81file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn143file0îˆ‚L1-L1îˆ

Na documentaÃ§Ã£o interna, hÃ¡ um segundo tipo de drift: parte da trilha `docs/refactors/*` continua descrevendo lacunas que o cÃ³digo jÃ¡ superou. O caso mais evidente Ã© o documento `Investigacao-tecnica-frontend.md`, que ainda parte da premissa de inexistÃªncia de rota `/eventos`, enquanto o cÃ³digo atual jÃ¡ possui essa rota e um `WorkspaceEventoPage`. Isso Ã© importante porque, se o plan do Codex for gerado a partir dessa trilha sem um inventÃ¡rio atualizado, o time tende a repetir trabalho ou criar slices redundantes. îˆ€fileciteîˆ‚turn83file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn43file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn46file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn47file0îˆ‚L1-L1îˆ

Em governanÃ§a, o cenÃ¡rio Ã© melhor do que o cÃ³digo sugere Ã  primeira vista. A separaÃ§Ã£o CORE/DEV jÃ¡ estÃ¡ estabelecida no rastreamento do projeto: existem decisÃµes como CORE-1, CORE-2, CORE-3, CORE-4, CORE-5 e CORE-6, e execuÃ§Ãµes correspondentes como DEV-5, DEV-6, DEV-7, DEV-9, DEV-10, DEV-11, DEV-13, DEV-14, DEV-15, DEV-16, DEV-17, DEV-18 e DEV-19. Isso significa que a recomendaÃ§Ã£o nÃ£o Ã© inventar um novo modelo de backlog; Ã© continuar usando essa taxonomia, porÃ©m com melhor sincronizaÃ§Ã£o entre cÃ³digo, docs e issues. îˆ€fileciteîˆ‚turn115file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn115file6îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn115file8îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn116file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn116file17îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn116file18îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn116file19îˆ‚L1-L1îˆ

A estrutura documental oficial no repositÃ³rio tambÃ©m jÃ¡ tem base suficiente para ser consolidada em vez de recomeÃ§ada. `README.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md` e a trilha extensa em `docs/refactors/*` existem e sÃ£o Ãºteis. O que falta Ã© transformar esse material em memÃ³ria oficial mais estÃ¡vel para operaÃ§Ã£o de roadmap: um `API.md` consolidado, um `ROADMAP.md` sintÃ©tico, um `RELEASES.md` real e, se o time quiser centralizar decisÃµes, um `DECISIONS.md` que indexe os CORE em linguagem de repositÃ³rio. îˆ€fileciteîˆ‚turn79file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn80file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn81file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn84file0îˆ‚L1-L1îˆ

## Lacunas crÃ­ticas e roadmap em fases

As lacunas crÃ­ticas abaixo sÃ£o as mais relevantes para transformar o projeto em um plan executÃ¡vel sem drift. A sÃ­ntese combina o plano incremental do backend, as slices de frontend, os serviÃ§os/tipos atuais e a infraestrutura observada em cÃ³digo e testes. îˆ€fileciteîˆ‚turn84file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn85file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn86file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn87file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn88file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn118file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn103file0îˆ‚L1-L1îˆ

| Prioridade | Lacuna | Impacto | CorreÃ§Ã£o mÃ­nima | CritÃ©rio de aceite |
|---|---|---|---|---|
| P0 | Happy path self sem UI para RSVP/check-in | UsuÃ¡rio real nÃ£o conclui fluxo do evento | Criar painel de aÃ§Ãµes self usando serviÃ§os jÃ¡ existentes | UsuÃ¡rio autenticado com `jogadorId` consegue RSVP e check-in |
| P0 | `WorkspaceEvento` depende de `WorkspaceAula` | Evento continua semanticamente acoplado a Aula | Introduzir adapter `WorkspaceEventoDTO` no frontend | PÃ¡gina de evento deixa de comparar status/tipo legados diretamente |
| P1 | VocabulÃ¡rio duplo de status/tipo | Regras frÃ¡geis e bugs de gating | Mapear legado -> canÃ´nico em um Ãºnico ponto | `EventoStatusActions` nÃ£o depende mais de `PLANEJADA/CONCLUIDA` |
| P1 | SessÃ£o com fallback silencioso | Falha de auth vira sessÃ£o â€œfakeâ€ sem `jogadorId` | Trocar fallback implÃ­cito por modo explÃ­cito | Login falha claramente ou informa modo compatÃ­vel |
| P1 | Dashboard com provÃ¡vel drift de `/api` | Telas de dashboard ficam incoerentes com backend padronizado | Normalizar serviÃ§os para `/api/dashboards/*` | Dashboards carregam em ambiente padrÃ£o |
| P1 | Deploy incompleto e segredo default | NÃ£o apto para ambiente real | Subir app e proxy na stack, remover `CHANGE_ME` | Ambiente mÃ­nimo com backend, frontend e proxy documentados |
| P2 | DocumentaÃ§Ã£o de refactor desatualizada | Planos geram slices redundantes | Sincronizar docs/refactors com o estado atual | O plan acompanha o cÃ³digo real |
| P3 | AusÃªncia de camada de dados mais robusta no front | Maior custo de manutenÃ§Ã£o, mas nÃ£o bloqueia MVP | Opcionalmente introduzir TanStack Query depois do happy path | Polling/cache simplificados e previsÃ­veis |

O roadmap recomendado em fases pequenas Ã© este:

| Fase | EntregÃ¡vel principal | Telas / endpoints envolvidos | SaÃ­da esperada |
|---|---|---|---|
| Fase de congelamento do contrato | Matriz Ãºnica de status/tipo/rotas de evento | `WorkspaceEventoPage`, `capabilities.ts`, `EventoStatusActions.tsx`, `/api/eventos/*`, `/api/dashboards/*` | Nenhum novo comportamento; apenas fechamento de contrato |
| Fase de bridge canÃ´nico | Adapter `WorkspaceEvento` sobre payload legado | `useWorkspaceEvento`, `workspaceAulaService.ts`, `types/evento.ts`, `types/workspaceAula.ts` | UI fala â€œEventoâ€ mesmo consumindo backend legado |
| Fase de aÃ§Ãµes self | RSVP/check-in/manual check-in/seed na UI | novos componentes de evento, `eventosService.ts`, `/api/eventos/{id}/rsvp`, `/checkin`, `/participants/{jogadorId}/checkin`, `/partidas/seed` | Happy path do evento fecha |
| Fase de sessÃ£o operacional | endurecer `user + jogador` | `AuthContext.tsx`, `LoginPage`, `UsuarioPerfil.tsx`, `/api/auth/*` | SessÃ£o confiÃ¡vel para aÃ§Ãµes self |
| Fase de sincronizaÃ§Ã£o de superfÃ­cies | remover drift documental e de dashboards | `docs/*`, `docs/refactors/*`, serviÃ§os de dashboard | Planos, docs e cÃ³digo passam a concordar |
| Fase de hardening de deploy | stack mÃ­nima para MVP | `docker-compose.yml`, variÃ¡veis de ambiente, docs de deploy, proxy | Ambiente real padrÃ£o fica viÃ¡vel |

HÃ¡ um ponto importante de infraestrutura. O target oficial documentado Ã© `Cloudflare -> NGINX -> FastAPI -> PostgreSQL`, mas o `docker-compose.yml` hoje sobe somente o banco de dados, sem frontend, sem backend e sem proxy. AlÃ©m disso, a configuraÃ§Ã£o atual mantÃ©m `JWT_SECRET="CHANGE_ME"` por padrÃ£o. Portanto, a trilha de deploy deve ser tratada como **fase posterior ao fechamento do happy path**, mas ainda como P1 para MVP real, nÃ£o como melhoria cosmÃ©tica. îˆ€fileciteîˆ‚turn80file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn118file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn103file0îˆ‚L1-L1îˆ

## Backlog CORE/DEV e slices executÃ¡veis

A estratÃ©gia correta para o backlog Ã© **reusar a taxonomia CORE/DEV jÃ¡ existente** e criar poucas issues novas, fortemente acopladas ao fluxo do happy path, em vez de abrir uma frente ampla de â€œrefatoraÃ§Ã£o de eventoâ€. Os itens existentes que mais se conectam ao trabalho agora sÃ£o CORE-5, CORE-6, DEV-11, DEV-15, DEV-18 e a trilha de frontend em `docs/refactors/Frontend/*`; eles devem ser estendidos ou reabertos conforme o caso, e nÃ£o duplicados com nomes genÃ©ricos. îˆ€fileciteîˆ‚turn115file5îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn115file8îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn115file13îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn116file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn85file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn87file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn88file0îˆ‚L1-L1îˆ

SugestÃ£o de backlog estruturado, pronto para conversÃ£o em tarefas do Linear e PRs no repositÃ³rio:

| Tipo | TÃ­tulo sugerido | Base existente | DependÃªncia | Aceite |
|---|---|---|---|---|
| CORE | Contrato canÃ´nico de Evento no frontend | estender CORE-6 | nenhuma | vocabulÃ¡rio Ãºnico para tipo/status e mapa de capabilities |
| CORE | PolÃ­tica de sessÃ£o operacional `user + jogador` | complementar CORE-5 | nenhuma | login, role e `jogadorId` explicitamente governados |
| DEV | Normalizar contratos `/api` e corrigir dashboards | ligar a DEV-18 | nenhuma | todos os serviÃ§os frontend usam gateway coerente |
| DEV | Introduzir adapter `WorkspaceEventoDTO` | nova issue ligada a DEV-15 | contrato congelado | pÃ¡gina de evento nÃ£o compara enums legados diretamente |
| DEV | Implementar UI de RSVP/check-in self e manual | nova issue ligada a CORE-5 | sessÃ£o operacional | usuÃ¡rio e treinador executam o fluxo do evento |
| DEV | Integrar `seedPartidaEvento` no fluxo Jogo Livre | reutilizar DEV-11 como dependÃªncia parcial | UI de self-action | evento Jogo Livre fecha partida inicial |
| DEV | Sincronizar `docs/refactors/*` com estado do cÃ³digo | nova issue de docs | nenhuma | documentaÃ§Ã£o de slices reflete o cÃ³digo atual |
| DEV | Hardening de deploy MVP | nova issue de infra | happy path fechado | stack mÃ­nima documentada e segura |

Os slices executÃ¡veis recomendados para o Codex sÃ£o estes. Eles estÃ£o deliberadamente pequenos, com superfÃ­cie de arquivos clara e validaÃ§Ã£o automatizada objetiva. Os comandos foram derivados dos scripts do frontend e da suÃ­te de testes jÃ¡ presente no backend. îˆ€fileciteîˆ‚turn76file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn99file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn100file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn121file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn142file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn146file0îˆ‚L1-L1îˆ

| Slice | DescriÃ§Ã£o | Arquivos principais | Branch sugerida | PR sugerido | Comandos de verificaÃ§Ã£o |
|---|---|---|---|---|---|
| Slice de contrato | Unificar tipo/status e prefixo `/api` onde jÃ¡ hÃ¡ drift | `src/workspaces/evento/capabilities.ts`, `src/workspaces/evento/components/EventoStatusActions.tsx`, `src/services/dashboard/*`, `src/types/*` | `feature/DEV-event-contract-bridge` | `DEV: normalizar contrato canÃ´nico de Evento no frontend` | `cd frontend/jubileu-web && npm run lint && npm run build` |
| Slice de adapter | Criar `WorkspaceEventoDTO` e remover dependÃªncia direta de enums legados na apresentaÃ§Ã£o | `src/hooks/useWorkspaceEvento.ts`, `src/workspaces/evento/WorkspaceEventoPage.tsx`, novo adapter em `src/workspaces/evento/` | `feature/DEV-workspace-event-adapter` | `DEV: introduzir adapter WorkspaceEvento sobre payload legado` | `cd frontend/jubileu-web && npm run lint && npm run build` |
| Slice de aÃ§Ãµes self | Implementar UI de RSVP/check-in/manual check-in/seed usando serviÃ§os jÃ¡ existentes | `src/workspaces/evento/components/*`, `src/workspaces/evento/hooks/useEventoLiveData.ts`, `src/services/eventos/*` | `feature/DEV-event-self-actions` | `DEV: fechar happy path de RSVP e check-in` | `cd frontend/jubileu-web && npm run lint && npm run build && cd ../../backend/jubileu-api-fastapi && pytest tests/test_eventos_api.py tests/test_auth_jwt_rbac.py` |
| Slice de sessÃ£o | Tornar o modo legado explÃ­cito e endurecer o contexto `user + jogador` | `src/context/AuthContext.tsx`, `src/pages/LoginPage.tsx`, `src/pages/UsuarioPerfil.tsx`, `src/services/authService.ts` | `feature/DEV-operational-session` | `DEV: endurecer sessÃ£o operacional para fluxos self` | `cd frontend/jubileu-web && npm run lint && npm run build && cd ../../backend/jubileu-api-fastapi && pytest tests/test_auth_jwt_rbac.py` |
| Slice de sync documental | Atualizar docs oficiais e refactors para refletirem o estado real e a ordem de slices | `README.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md`, novos `docs/API.md`, `docs/ROADMAP.md`, `docs/RELEASES.md`, `docs/refactors/*` | `docs/DEV-sync-reality` | `DOCS: sincronizar arquitetura, domÃ­nio e roadmap com o cÃ³digo atual` | `cd backend/jubileu-api-fastapi && pytest tests/test_smoke_api.py tests/test_api_standardization_aliases.py` |
| Slice de deploy MVP | Subir assets mÃ­nimos de execuÃ§Ã£o real | `docker-compose.yml`, `.env.example`, docs de deploy, eventual config de proxy | `infra/DEV-mvp-deploy-hardening` | `INFRA: preparar stack mÃ­nima para MVP real` | `cd backend/jubileu-api-fastapi && pytest tests/test_smoke_api.py` e `cd frontend/jubileu-web && npm run build` |

Para a governanÃ§a diÃ¡ria, eu padronizaria a trilha exatamente na lÃ³gica pedida no material anexado: `CORE -> DEV -> branch -> PR -> release -> docs`. Em termos operacionais, isso significa branch `feature/DEV-xx-slug` ou `fix/DEV-xx-slug`, commit no formato `feat(frontend): DEV-xx ...` ou `fix(backend): DEV-xx ...`, e PR com tÃ­tulo comeÃ§ando pelo DEV correspondente, citando a decisÃ£o CORE no corpo quando houver. Isso evita repetir o problema que o prÃ³prio material chamou de drift por investigaÃ§Ã£o e execuÃ§Ã£o sem escopo fechado. îˆ€fileciteîˆ‚turn0file1îˆ

Perguntas abertas e limites desta leitura: eu nÃ£o executei o sistema nem rodei as migrations; a avaliaÃ§Ã£o de execuÃ§Ã£o estÃ¡ baseada no cÃ³digo, nos testes e na documentaÃ§Ã£o disponÃ­veis. TambÃ©m nÃ£o reconciliei exaustivamente todo o histÃ³rico de PRs com as issues do Linear, entÃ£o a proposta de backlog estÃ¡ pronta para conversÃ£o, mas nÃ£o substitui uma triagem final de gestÃ£o para fechamento, renomeaÃ§Ã£o ou consolidaÃ§Ã£o de itens jÃ¡ existentes. Ainda assim, a evidÃªncia coletada Ã© suficiente para afirmar com alta confianÃ§a que o prÃ³ximo passo correto Ã© **fechar o happy path de evento com slices pequenos**, e nÃ£o abrir uma refatoraÃ§Ã£o estrutural ampla. îˆ€fileciteîˆ‚turn84file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn97file0îˆ‚L1-L1îˆ
