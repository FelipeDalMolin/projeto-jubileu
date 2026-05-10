> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Frontend Slice 15 - JOGO_LIVRE E2E

## Contexto

ApÃ³s estabilizaÃ§Ã£o de `AULA`, o prÃ³ximo tipo operacional do domÃ­nio Ã© `JOGO_LIVRE`.

## Objetivo

Fechar fluxo ponta a ponta de `JOGO_LIVRE`: RSVP, check-in, presenÃ§a, seed de partida e lances.

## Escopo

- consolidar uso de `/api/eventos/{id}/participants` e `/presentes`
- habilitar seed da primeira partida quando nÃ£o houver partidas
- integrar timeline e quick add no mesmo workspace

## Fora de escopo

- suporte operacional para `OUTRO`
- migraÃ§Ã£o de rota para `/eventos/:eventoId` puro

## Arquivos/areas impactadas

- `frontend/jubileu-web/src/workspaces/evento/WorkspaceEventoPage.tsx`
- `frontend/jubileu-web/src/workspaces/evento/components/EventoPresenceActionsCard.tsx`
- `frontend/jubileu-web/src/workspaces/evento/components/SeedPartidaCard.tsx`

## Riscos

- mistura de semÃ¢ntica entre presenÃ§a de turma (`AULA`) e participantes canÃ´nicos (`JOGO_LIVRE`)
- regressÃ£o em fallback de auth em endpoints canÃ´nicos

## Criterios de aceite

- fluxo do login atÃ© o primeiro lance executÃ¡vel em `JOGO_LIVRE`
- presenÃ§a/fila de chegada atualizando sem quebrar tabs
- sem quebra da experiÃªncia `AULA`

## Checklist de validacao

- RSVP/check-in self e manual
- seed de partida e transiÃ§Ã£o para partida em andamento
- quick add e timeline apÃ³s seed/start

## Dependencias para proxima fase

- `Frontend/16-evento-polling-auth-hardening.md`
