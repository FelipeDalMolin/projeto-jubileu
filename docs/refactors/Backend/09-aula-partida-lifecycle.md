# Backend Slice 09 - AULA Partida Lifecycle

## Contexto

`AULA` precisava de transições explícitas de partida para destravar lances com semântica consistente.

## Objetivo

Implementar lifecycle de partida (`start`/`end`) preservando contratos e compatibilidade.

## Escopo

- endpoints de iniciar/encerrar partida no fluxo legado de aula
- aliases `/api` preservados
- validações de transição:
  - `PLANEJADA -> EM_ANDAMENTO`
  - `EM_ANDAMENTO -> ENCERRADA`
- bloqueio de transições inválidas com erro 409 consistente

## Fora de escopo

- alterações de schema
- renome de entidades de persistência

## Arquivos/areas impactadas

- `backend/jubileu-api-fastapi/app/routers/partidas.py`
- `backend/jubileu-api-fastapi/tests/test_partidas_lifecycle_api.py`
- `backend/jubileu-api-fastapi/tests/test_api_standardization_aliases.py`

## Riscos

- regressão em criação/edição/remoção de partidas
- inconsistência com gates de lance já existentes

## Criterios de aceite

- start/end funcionando e versionando resposta
- erro 409 para fluxo inválido
- lances só aceitos com partida `EM_ANDAMENTO`

## Checklist de validacao

- testes de lifecycle de partida
- testes de alias `/api`
- validação manual de fluxo AULA (planejada -> em andamento -> encerrada)

## Dependencias para proxima fase

- `Frontend/14-aula-lances-v2.md`
