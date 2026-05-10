> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Frontend Slice 16 - Polling/Auth Hardening por Canal

## Contexto

Havia comportamento anÃ´malo com fan-out de requests, loops de polling e `401` repetido.

## Objetivo

Estabilizar polling por canal e tratamento de autenticaÃ§Ã£o para eliminar flood e estados inconsistentes.

## Escopo

- controller Ãºnico de polling por pÃ¡gina
- pausas por aba oculta
- backoff e circuit breaker por canal
- tratamento consistente de `401` e falha de rede na UI

## Fora de escopo

- adoÃ§Ã£o de infraestrutura global nova de state management
- troca para WebSocket nesta fase

## Arquivos/areas impactadas

- `frontend/jubileu-web/src/workspaces/evento/WorkspaceEventoPage.tsx`
- `frontend/jubileu-web/src/lib/queryClient.ts`
- remover hooks locais de polling de Evento quando ficarem sem uso

## Riscos

- timers Ã³rfÃ£os em troca rÃ¡pida de abas
- bloqueio indevido de atualizaÃ§Ã£o apÃ³s erro transitÃ³rio

## Criterios de aceite

- sem multiplicaÃ§Ã£o de timers ao alternar abas
- sem flood de requests em erro de rede ou 401
- recuperaÃ§Ã£o automÃ¡tica apÃ³s perÃ­odo de pausa

## Checklist de validacao

- simular backend indisponÃ­vel e validar backoff
- simular token expirado e validar estado de sessÃ£o na UI
- validar pausa/resumo com `document.hidden`

## Dependencias para proxima fase

- `Backend/10-evento-contracts-tests-release.md`
