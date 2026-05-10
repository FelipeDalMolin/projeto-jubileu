> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Frontend Slice 14 - Gerencia de Lances v2 (AULA)

## Contexto

`AULA` ficou com experiÃªncia de lances incompleta por capability restritiva e gate pouco claro.

## Objetivo

Habilitar gerÃªncia de lances em `AULA` para papÃ©is administrativos com gate explÃ­cito por status de evento e partida.

## Escopo

- ajustar capabilities de `AULA` para incluir `lances` em papel admin
- manter bloqueio quando evento/partida nÃ£o estiverem `EM_ANDAMENTO`
- mensagens de bloqueio claras em timeline/quick add

## Fora de escopo

- alteraÃ§Ãµes de permissÃ£o no backend
- novos tipos de lance

## Arquivos/areas impactadas

- `frontend/jubileu-web/src/workspaces/evento/capabilities.ts`
- `frontend/jubileu-web/src/workspaces/evento/components/QuickAddLance.tsx`
- `frontend/jubileu-web/src/workspaces/evento/WorkspaceEventoPage.tsx`
- `frontend/jubileu-web/src/services/eventosService.ts`

## Riscos

- desbloqueio indevido de ediÃ§Ã£o
- confusÃ£o de estado quando existir partida planejada sem partida ativa

## Criterios de aceite

- lance cria apenas com evento e partida `EM_ANDAMENTO`
- feedback claro quando bloqueado
- timeline atualiza sem duplicaÃ§Ã£o imediata apÃ³s registro

## Checklist de validacao

- `AULA` + partida `PLANEJADA`: quick add bloqueado
- `AULA` + partida `EM_ANDAMENTO`: quick add habilitado e persistindo
- `AULA` + partida `ENCERRADA`: quick add volta a bloquear

## Dependencias para proxima fase

- `Frontend/15-jogo-livre-e2e.md`
