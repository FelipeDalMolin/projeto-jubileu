> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Backend Slice 09 - AULA Partida Lifecycle

## Contexto

`AULA` precisava de transiÃ§Ãµes explÃ­citas de partida para destravar lances com semÃ¢ntica consistente.

## Objetivo

Implementar lifecycle de partida (`start`/`end`) preservando contratos e compatibilidade.

## Escopo

- endpoints de iniciar/encerrar partida no fluxo legado de aula
- aliases `/api` preservados
- validaÃ§Ãµes de transiÃ§Ã£o:
  - `PLANEJADA -> EM_ANDAMENTO`
  - `EM_ANDAMENTO -> ENCERRADA`
- bloqueio de transiÃ§Ãµes invÃ¡lidas com erro 409 consistente

## Fora de escopo

- alteraÃ§Ãµes de schema
- renome de entidades de persistÃªncia

## Arquivos/areas impactadas

- `backend/jubileu-api-fastapi/app/routers/partidas.py`
- `backend/jubileu-api-fastapi/tests/test_partidas_lifecycle_api.py`
- `backend/jubileu-api-fastapi/tests/test_api_standardization_aliases.py`

## Riscos

- regressÃ£o em criaÃ§Ã£o/ediÃ§Ã£o/remoÃ§Ã£o de partidas
- inconsistÃªncia com gates de lance jÃ¡ existentes

## Criterios de aceite

- start/end funcionando e versionando resposta
- erro 409 para fluxo invÃ¡lido
- lances sÃ³ aceitos com partida `EM_ANDAMENTO`

## Checklist de validacao

- testes de lifecycle de partida
- testes de alias `/api`
- validaÃ§Ã£o manual de fluxo AULA (planejada -> em andamento -> encerrada)

## Dependencias para proxima fase

- `Frontend/14-aula-lances-v2.md`
