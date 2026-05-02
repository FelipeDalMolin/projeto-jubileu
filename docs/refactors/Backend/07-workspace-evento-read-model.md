# Slice 07 - WorkspaceEvento Read Model

## Contexto

`WorkspaceAula` ainda alimenta a tela operacional, enquanto a UI ja converge para Evento. A transicao deve ser feita por read-model/adapter, sem renomear persistencia.

## Objetivo

Preparar um contrato backend ou facade documentada para `WorkspaceEvento`, preservando `WorkspaceAula`.

## Escopo

- Mapear campos atuais de `WorkspaceAula` usados pela EventoPage.
- Definir quais campos pertencem ao contrato `WorkspaceEvento`.
- Separar conceitos de Aula persistida e Evento operacional.
- Preservar versionamento, KPIs, warnings, TeamConfig e snapshots.

## Fora de Escopo

- Trocar tabelas.
- Migrar todos consumidores de uma vez.
- Remover endpoint legado de workspace.
- Alterar semantica de equipes, partidas ou presencas.

## Arquivos Provaveis

- `backend/jubileu-api-fastapi/app/services/workspace_aula.py`
- `backend/jubileu-api-fastapi/app/schemas/workspace.py`
- `backend/jubileu-api-fastapi/app/routers/dias.py`
- `backend/jubileu-api-fastapi/tests/test_workspace_aula.py`

## Riscos

- Duplicar regra de agregacao.
- Quebrar `since_version`.
- Divergir entre snapshot de equipes e participantes canonicos.

## Criterios de Aceite

- Contrato `WorkspaceEvento` definido como adapter/read-model.
- `WorkspaceAula` preservado.
- Combined version logic preservada.
- Nenhum consumidor legado quebrado.

## Validacao

- `pytest tests/test_workspace_aula.py`
- Teste de contrato para ausencia de regressao no payload legado.
- Nota explicita de risco PostgreSQL quando aplicavel.

## Linear

- CORE: `CORE-2`, `CORE-3`, `CORE-6`
- DEV sugerida: futura ou vinculada a `DEV-23`
- Branch sugerida: `dev-23-workspace-evento-read-model`
