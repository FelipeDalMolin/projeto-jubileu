# Frontend Slice 14 - Gerencia de Lances v2 (AULA)

## Contexto

`AULA` ficou com experiência de lances incompleta por capability restritiva e gate pouco claro.

## Objetivo

Habilitar gerência de lances em `AULA` para papéis administrativos com gate explícito por status de evento e partida.

## Escopo

- ajustar capabilities de `AULA` para incluir `lances` em papel admin
- manter bloqueio quando evento/partida não estiverem `EM_ANDAMENTO`
- mensagens de bloqueio claras em timeline/quick add

## Fora de escopo

- alterações de permissão no backend
- novos tipos de lance

## Arquivos/areas impactadas

- `frontend/jubileu-web/src/workspaces/evento/capabilities.ts`
- `frontend/jubileu-web/src/workspaces/evento/components/QuickAddLance.tsx`
- `frontend/jubileu-web/src/workspaces/evento/hooks/useLancesTimeline.ts`

## Riscos

- desbloqueio indevido de edição
- confusão de estado quando existir partida planejada sem partida ativa

## Criterios de aceite

- lance cria apenas com evento e partida `EM_ANDAMENTO`
- feedback claro quando bloqueado
- timeline atualiza sem duplicação imediata após registro

## Checklist de validacao

- `AULA` + partida `PLANEJADA`: quick add bloqueado
- `AULA` + partida `EM_ANDAMENTO`: quick add habilitado e persistindo
- `AULA` + partida `ENCERRADA`: quick add volta a bloquear

## Dependencias para proxima fase

- `Frontend/15-jogo-livre-e2e.md`
