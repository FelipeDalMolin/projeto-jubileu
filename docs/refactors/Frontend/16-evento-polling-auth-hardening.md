# Frontend Slice 16 - Polling/Auth Hardening por Canal

## Contexto

Havia comportamento anômalo com fan-out de requests, loops de polling e `401` repetido.

## Objetivo

Estabilizar polling por canal e tratamento de autenticação para eliminar flood e estados inconsistentes.

## Escopo

- controller único de polling por página
- pausas por aba oculta
- backoff e circuit breaker por canal
- tratamento consistente de `401` e falha de rede na UI

## Fora de escopo

- adoção de infraestrutura global nova de state management
- troca para WebSocket nesta fase

## Arquivos/areas impactadas

- `frontend/jubileu-web/src/workspaces/evento/hooks/useEventoPagePollingController.ts`
- `frontend/jubileu-web/src/workspaces/evento/hooks/useEventoLiveData.ts`
- `frontend/jubileu-web/src/workspaces/evento/hooks/useLancesTimeline.ts`

## Riscos

- timers órfãos em troca rápida de abas
- bloqueio indevido de atualização após erro transitório

## Criterios de aceite

- sem multiplicação de timers ao alternar abas
- sem flood de requests em erro de rede ou 401
- recuperação automática após período de pausa

## Checklist de validacao

- simular backend indisponível e validar backoff
- simular token expirado e validar estado de sessão na UI
- validar pausa/resumo com `document.hidden`

## Dependencias para proxima fase

- `Backend/10-evento-contracts-tests-release.md`
