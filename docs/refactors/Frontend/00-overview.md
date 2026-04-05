# Frontend Refactor Overview

## Objetivo da trilha

Evoluir o frontend do Projeto Jubileu de uma navegação centrada em `Dia -> Aula` para uma operação centrada em `Dia -> Evento`, mantendo compatibilidade com o legado durante a transição e sem quebra de contratos existentes.

## Premissas não negociáveis

- Compatibilidade-first: preservar fluxos e rotas legadas por ao menos um ciclo.
- `/api` permanece prefixo de infraestrutura para integração frontend/backend.
- Não quebrar payloads já consumidos no frontend sem bridge explícita.
- Backend continua como source of truth de autorização (RBAC no servidor).
- Não forçar rename de persistência (`Aula`, `JogadorAula`, `EventoParticipante`) na trilha frontend.

## Riscos globais

- Proxy de dev reescrevendo `/api` e quebrando endpoints canônicos de eventos.
- Divergência de tipos/status entre frontend e backend para Evento.
- Sessão de usuário sem vínculo operacional com `jogadorId` para ações self.
- Ausência de endpoint canônico de leitura por `eventoId` para deep-link direto.
- Regressões no workspace atual (equipes/partidas) durante migração de UI.

## Critérios globais de aceite

- Rotas novas e legadas convivendo sem regressão funcional.
- Fluxos de evento (RSVP/check-in/seed/lances) integrados ao frontend.
- Workspace unificado por evento operando com render condicional por capabilities.
- Sessão com distinção user/jogador suportando ações self com segurança.
- Nenhuma quebra de fluxo atual de aula/dia durante a transição.

## Mapa de dependências entre fases

- `01-auditoria-contratos` depende apenas do estado atual do código e bloqueia todas as fases seguintes.
- `02-rotas-evento` depende de `01` para congelar contratos e remover risco de proxy/tipos.
- `03-workspace-evento` depende de `02` para apontar para rotas canônicas de evento.
- `04-integracao-api-eventos` depende de `03` para plugar ações de evento no workspace unificado.
- `05-ui-navegacao-evento` depende de `04` para refletir capacidades reais na navegação.
- `06-user-jogador-sessao` depende de `04` e `05` para fechar a sessão operacional com ações self.

## Definition of Done (trilha frontend)

- [ ] Rotas compatíveis (legado + canônico contextual) funcionando em paralelo.
- [ ] Eventos integrados ao frontend com consumo real de `/api/eventos/*`.
- [ ] Workspace unificado operacional com capabilities por tipo/status/role.
- [ ] Sessão user/jogador coerente com backend auth e RBAC.
- [ ] Sem quebra de fluxo atual de dias/aulas durante a migração.
