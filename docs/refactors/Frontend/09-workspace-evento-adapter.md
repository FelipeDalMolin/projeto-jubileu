# Slice 09 - WorkspaceEvento Adapter

## Contexto

`WorkspaceEventoPage` usa o workspace legado de Aula. Isso e aceitavel durante a transicao, mas a dependencia precisa ficar encapsulada para reduzir drift.

## Objetivo

Criar um adapter explicito `WorkspaceEvento` sobre `WorkspaceAula`.

## Escopo

- Criar view model de Evento para a pagina.
- Encapsular mapeamento de header, status, tipo, KPIs, equipes, partidas e warnings.
- Manter endpoint legado de workspace como fonte primaria inicial.
- Separar capacidades da UI de campos legados crus.

## Fora de Escopo

- Novo endpoint backend obrigatorio.
- Remover `useWorkspaceAula`.
- Alterar TeamConfig, snapshot ou versionamento.

## Arquivos Provaveis

- `frontend/jubileu-web/src/hooks/useWorkspaceEvento.ts`
- `frontend/jubileu-web/src/workspaces/evento/WorkspaceEventoPage.tsx`
- `frontend/jubileu-web/src/workspaces/evento/*`
- `frontend/jubileu-web/src/types/workspaceAula.ts`

## Riscos

- Duplicar estado no frontend.
- Quebrar montagem de equipes.
- Criar divergencia entre presentes da Aula e participantes canonicos.

## Criterios de Aceite

- UI consome um modelo `WorkspaceEvento` explicito.
- WorkspaceAula continua preservado.
- Rota legada e canonica renderizam o mesmo resultado operacional.

## Validacao

- `npm run lint`
- `npm run build`
- Validar tela com Aula planejada, em andamento e concluida.

## Linear

- CORE: `CORE-2`, `CORE-3`, `CORE-6`
- DEV sugerida: `DEV-23`
- Branch sugerida: `dev-23-frontend-workspace-evento-adapter`
