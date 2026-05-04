# Frontend Slice 15 - JOGO_LIVRE E2E

## Contexto

Após estabilização de `AULA`, o próximo tipo operacional do domínio é `JOGO_LIVRE`.

## Objetivo

Fechar fluxo ponta a ponta de `JOGO_LIVRE`: RSVP, check-in, presença, seed de partida e lances.

## Escopo

- consolidar uso de `/api/eventos/{id}/participants` e `/presentes`
- habilitar seed da primeira partida quando não houver partidas
- integrar timeline e quick add no mesmo workspace

## Fora de escopo

- suporte operacional para `OUTRO`
- migração de rota para `/eventos/:eventoId` puro

## Arquivos/areas impactadas

- `frontend/jubileu-web/src/workspaces/evento/WorkspaceEventoPage.tsx`
- `frontend/jubileu-web/src/workspaces/evento/components/EventoPresenceActionsCard.tsx`
- `frontend/jubileu-web/src/workspaces/evento/components/SeedPartidaCard.tsx`

## Riscos

- mistura de semântica entre presença de turma (`AULA`) e participantes canônicos (`JOGO_LIVRE`)
- regressão em fallback de auth em endpoints canônicos

## Criterios de aceite

- fluxo do login até o primeiro lance executável em `JOGO_LIVRE`
- presença/fila de chegada atualizando sem quebrar tabs
- sem quebra da experiência `AULA`

## Checklist de validacao

- RSVP/check-in self e manual
- seed de partida e transição para partida em andamento
- quick add e timeline após seed/start

## Dependencias para proxima fase

- `Frontend/16-evento-polling-auth-hardening.md`
