# Slice 10 - RSVP/Check-in Self Actions

## Contexto

O backend ja possui fluxo de RSVP/check-in, mas a UI ainda nao fecha o happy path operacional de Evento para usuario com jogador vinculado.

## Objetivo

Implementar acoes self e administrativas de presenca sem conflitar com a montagem de equipes de Aula.

## Escopo

- UI para RSVP e cancelamento de RSVP.
- UI para check-in e desfazer check-in quando permitido.
- Check-in manual para perfis autorizados.
- Integracao clara com participantes/presentes apenas quando fizer sentido para o tipo de evento.
- Seed de partida quando aplicavel.

## Fora de Escopo

- Remover fluxo legado de presenca da Aula.
- Alterar schema.
- Introduzir registro publico.
- Misturar montagem de equipes com timeline de lances.

## Arquivos Provaveis

- `frontend/jubileu-web/src/workspaces/evento/components/*`
- `frontend/jubileu-web/src/workspaces/evento/hooks/useEventoLiveData.ts`
- `frontend/jubileu-web/src/services/eventos/*`
- `frontend/jubileu-web/src/context/AuthContext.tsx`

## Riscos

- Confundir `JogadorAula` com `EventoParticipante`.
- Duplicar presenca entre Aula e Evento.
- Executar acoes self sem `jogadorId` confiavel.

## Criterios de Aceite

- Usuario com `jogadorId` consegue RSVP/check-in.
- Treinador/admin consegue operacao manual quando permitido.
- A UI informa motivo quando a acao esta bloqueada.
- Fluxo legado de presenca/equipes continua funcional.

## Validacao

- `npm run lint`
- `npm run build`
- Teste manual de RSVP, check-in, cancelamento e erro de permissao.

## Linear

- CORE: `CORE-5`, `CORE-6`
- DEV sugerida: `DEV-24`
- Branch sugerida: `dev-24-frontend-rsvp-checkin-self-actions`
