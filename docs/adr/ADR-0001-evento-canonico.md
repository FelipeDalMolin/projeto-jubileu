# ADR-0001 - Evento Canonico

## Status

Aceita para o ciclo `v0.3.x`.

## Decisao

`Evento` e a entidade publica canonica do Jubileu. `AULA` permanece somente como valor de `Evento.tipo`.

## Consequencias

- APIs publicas usam `/eventos`, `evento_id` e nomes `Evento*`.
- Frontend usa `/dias/:dataIso/eventos/:eventoId`.
- `Aula`, `/aulas`, `aulaId`, `aula_id` e `WorkspaceAula` nao devem ser reintroduzidos em codigo ativo.
- Historico de migrations pode manter nomes antigos por rastreabilidade.
- Docs arquivados que falam em Aula como entidade raiz sao superseded.

## Validacao

- Grep em codigo ativo sem referencias publicas a Aula.
- Testes backend verdes.
- Frontend lint/build verdes.
- Smoke com evento modo `AULA` e evento modo `JOGO_LIVRE`.
