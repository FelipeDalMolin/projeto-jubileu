> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Frontend Refactor Overview

## Objetivo da trilha

Evoluir o frontend do Projeto Jubileu de uma navegaÃ§Ã£o centrada em `Dia -> Aula` para uma operaÃ§Ã£o centrada em `Dia -> Evento`, mantendo compatibilidade com o legado durante a transiÃ§Ã£o e sem quebra de contratos existentes.

## Premissas nÃ£o negociÃ¡veis

- Compatibilidade-first: preservar fluxos e rotas legadas por ao menos um ciclo.
- `/api` permanece prefixo de infraestrutura para integraÃ§Ã£o frontend/backend.
- NÃ£o quebrar payloads jÃ¡ consumidos no frontend sem bridge explÃ­cita.
- Backend continua como source of truth de autorizaÃ§Ã£o (RBAC no servidor).
- NÃ£o forÃ§ar rename de persistÃªncia (`Aula`, `JogadorAula`, `EventoParticipante`) na trilha frontend.

## Riscos globais

- Proxy de dev reescrevendo `/api` e quebrando endpoints canÃ´nicos de eventos.
- DivergÃªncia de tipos/status entre frontend e backend para Evento.
- SessÃ£o de usuÃ¡rio sem vÃ­nculo operacional com `jogadorId` para aÃ§Ãµes self.
- AusÃªncia de endpoint canÃ´nico de leitura por `eventoId` para deep-link direto.
- RegressÃµes no workspace atual (equipes/partidas) durante migraÃ§Ã£o de UI.

## CritÃ©rios globais de aceite

- Rotas novas e legadas convivendo sem regressÃ£o funcional.
- Fluxos de evento (RSVP/check-in/seed/lances) integrados ao frontend.
- Workspace unificado por evento operando com render condicional por capabilities.
- SessÃ£o com distinÃ§Ã£o user/jogador suportando aÃ§Ãµes self com seguranÃ§a.
- Nenhuma quebra de fluxo atual de aula/dia durante a transiÃ§Ã£o.

## Mapa de dependÃªncias entre fases

- `01-auditoria-contratos` depende apenas do estado atual do cÃ³digo e bloqueia todas as fases seguintes.
- `02-rotas-evento` depende de `01` para congelar contratos e remover risco de proxy/tipos.
- `03-workspace-evento` depende de `02` para apontar para rotas canÃ´nicas de evento.
- `04-integracao-api-eventos` depende de `03` para plugar aÃ§Ãµes de evento no workspace unificado.
- `05-ui-navegacao-evento` depende de `04` para refletir capacidades reais na navegaÃ§Ã£o.
- `06-user-jogador-sessao` depende de `04` e `05` para fechar a sessÃ£o operacional com aÃ§Ãµes self.

## Definition of Done (trilha frontend)

- [ ] Rotas compatÃ­veis (legado + canÃ´nico contextual) funcionando em paralelo.
- [ ] Eventos integrados ao frontend com consumo real de `/api/eventos/*`.
- [ ] Workspace unificado operacional com capabilities por tipo/status/role.
- [ ] SessÃ£o user/jogador coerente com backend auth e RBAC.
- [ ] Sem quebra de fluxo atual de dias/aulas durante a migraÃ§Ã£o.
