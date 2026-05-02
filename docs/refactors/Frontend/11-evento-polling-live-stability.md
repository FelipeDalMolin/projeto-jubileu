# Slice 11 - Evento Polling and Live Stability

## Contexto

A tela de Evento apresentou loops de requisicoes, `failed to fetch` e ambiguidade entre dados de workspace, participantes e timeline.

## Objetivo

Tornar o polling da EventoPage previsivel, contextual e resiliente.

## Escopo

- Um controlador por pagina para canais de polling.
- Workspace com intervalo base e backoff.
- Timeline ativa apenas quando aba e partida justificarem.
- Participantes/presentes apenas quando o tipo de evento exigir.
- Pausa em aba oculta.
- Circuit breaker para `401` e falhas de rede repetidas.

## Fora de Escopo

- Introduzir WebSocket/MQTT.
- Adotar TanStack Query obrigatoriamente.
- Reescrever toda a camada de services.

## Arquivos Provaveis

- `frontend/jubileu-web/src/workspaces/evento/hooks/*`
- `frontend/jubileu-web/src/workspaces/evento/WorkspaceEventoPage.tsx`
- `frontend/jubileu-web/src/services/http*`
- `frontend/jubileu-web/src/services/eventos/*`

## Riscos

- Timer orfao ao alternar abas.
- Dados stale apos mutacao.
- Flood em backend quando token expira.

## Criterios de Aceite

- Alternar abas nao multiplica requisicoes.
- Falha de rede entra em backoff.
- Token expirado nao gera loop agressivo.
- UI mostra erro recuperavel e CTA quando necessario.

## Validacao

- `npm run lint`
- `npm run build`
- Teste manual com backend off, token expirado e alternancia rapida de abas.

## Linear

- CORE: `CORE-2`, `CORE-3`, `CORE-6`
- DEV sugerida: `DEV-25`
- Branch sugerida: `dev-25-frontend-evento-polling-live-stability`
