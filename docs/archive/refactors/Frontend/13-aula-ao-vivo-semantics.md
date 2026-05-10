> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Frontend Slice 13 - AULA Ao Vivo Semantics

## Contexto

O modo `AULA` apresentava ambiguidade de "ao vivo" mesmo com partida `PLANEJADA`.

## Objetivo

Garantir que o estado "ao vivo" dependa exclusivamente de partida `EM_ANDAMENTO`.

## Escopo

- derivacao de `partidaAtiva` sem fallback para partidas planejadas
- ajustes visuais de contexto/pre-jogo
- manter rota legada e canÃ´nica coexistindo

## Fora de escopo

- redesign completo da aba Partidas
- mudanÃ§as de schema/persistÃªncia

## Arquivos/areas impactadas

- `frontend/jubileu-web/src/workspaces/evento/WorkspaceEventoPage.tsx`
- `frontend/jubileu-web/src/workspaces/evento/components/PartidaAoVivoCard.tsx`
- `frontend/jubileu-web/src/workspaces/evento/components/EventoContextBar.tsx`

## Riscos

- regressÃ£o de badge/KPI de partida ativa
- fluxo de quick add permanecer bloqueado por status incorreto

## Criterios de aceite

- sem badge "partida ao vivo" para partida `PLANEJADA`
- pre-jogo exibido quando nÃ£o houver partida `EM_ANDAMENTO`
- contratos de rota e payload preservados

## Checklist de validacao

- abrir evento `AULA` com partida `PLANEJADA` e validar pre-jogo
- iniciar partida e validar ativaÃ§Ã£o de contexto ao vivo
- encerrar partida e validar retorno ao estado nÃ£o ao-vivo

## Dependencias para proxima fase

- `Backend/09-aula-partida-lifecycle.md`
