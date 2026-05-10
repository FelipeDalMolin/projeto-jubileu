> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Slice 06 - Evento API Contract Hardening

## Contexto

O backend ja possui rotas canonicas de Evento, mas a investigacao tecnica apontou risco de drift entre endpoints usados pelo frontend, comportamento real, aliases `/api` e contratos de status/tipo.

## Objetivo

Estabilizar os contratos canonicos de Evento antes de novos acoplamentos no frontend.

## Escopo

- Revisar rotas `/api/eventos/*` e `/api/partidas/{id}/lances`.
- Confirmar suporte a RSVP, cancelamento de RSVP, check-in, desfazer check-in, participantes, presentes, status actions, seed e leitura de lances.
- Normalizar erros esperados para evitar loops de retry no frontend.
- Documentar incompatibilidades temporarias.

## Fora de Escopo

- Renomear `Aula` para `Evento`.
- Alterar schema sem migration explicita.
- Remover rotas legadas.
- Mudar auth flow alem do necessario para contrato.

## Arquivos Provaveis

- `backend/jubileu-api-fastapi/app/routers/eventos.py`
- `backend/jubileu-api-fastapi/app/modules/eventos/service.py`
- `backend/jubileu-api-fastapi/app/schemas/eventos.py`
- `backend/jubileu-api-fastapi/tests/test_eventos_api.py`

## Riscos

- Quebrar frontend por mudanca de payload.
- Regressao em RSVP/check-in.
- Inconsistencia entre SQLite e PostgreSQL para ordenacao temporal e timezone.

## Criterios de Aceite

- Contratos de Evento documentados e testados.
- Rotas canonicas sob `/api` preservadas.
- Erros `401`, `403`, `404`, `409` e validacao retornam respostas previsiveis.
- Nenhuma mudanca de schema sem Alembic.

## Validacao

- `pytest tests/test_eventos_api.py`
- `pytest tests/test_api_standardization_aliases.py`
- Validar manualmente que `/api` continua gateway.

## Linear

- CORE: `CORE-1`, `CORE-4`, `CORE-5`
- DEV sugerida: `DEV-21`
- Branch sugerida: `dev-21-backend-evento-api-contract-hardening`
