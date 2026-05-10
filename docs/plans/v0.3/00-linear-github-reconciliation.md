# 00 - Linear/GitHub Reconciliation

## Estado GitHub

Nao ha issues nem PRs abertos em `FelipeDalMolin/projeto-jubileu`. GitHub deve ser usado para branch, commit, PR e checks. Linear permanece como tracker oficial.

## Regras De Reconciliacao

- Implementada e documentada: mover para `Done`.
- Absorvida por outra: marcar `Duplicate` ou `Canceled` com comentario `Superseded by DEV-XX`.
- Valida mas antiga: atualizar descricao e criterios de aceite.
- Mistura assuntos: dividir em issues menores.
- Reintroduz `Aula` como entidade publica: reescrever para `Evento` ou cancelar.

## Issues Prioritarias

| Issue | Estado esperado | Acao sugerida | Justificativa tecnica | Branch sugerida |
|---|---|---|---|---|
| DEV-34 | Done ou In Review | Atualizar e fechar apos ADR | Evento canonico esta materializado; falta formalizacao repo/tracker. | `dev-34-decisao-evento-canonico` |
| DEV-35 | In Review | Atualizar criterios para gate PostgreSQL | Migration existe, mas precisa validação limpa/migrada e rollback awareness. | `dev-35-migration-persistence-evento` |
| DEV-36 | Done/In Review | Atualizar e fechar se grep/testes passarem | Backend ativo usa Evento-only; manter como contrato de fechamento. | `dev-36-backend-evento-only` |
| DEV-37 | Done/In Review | Atualizar e fechar se lint/build passarem | Frontend ja usa rota canonica de Evento; manter validacao de regressao. | `dev-37-frontend-evento-only` |
| DEV-38 | Done/In Review | Atualizar e fechar apos validar `/api/usuarios/me` | Usuario persistido existe; falta release gate. | `dev-38-usuario-persistido` |
| DEV-39 | Done/In Review | Atualizar e fechar apos smoke `/usuario` | Pagina existe; validar historico e estados vazios. | `dev-39-pagina-usuario` |
| DEV-40 | Em Progresso | Manter e refocar em Tailwind-only | UI geral esta parcial; precisa cleanup Bootstrap-like. | `dev-40-ui-operacional-geral` |
| DEV-41 | Em Progresso | Manter como release/docs gate | Fecha docs, checklist, release notes e smoke final. | `dev-41-docs-validacao-final` |
| DEV-32 | Em Progresso | Manter e atualizar | Polling/auth hardening ainda e risco real. | `dev-32-polling-auth-hardening-por-canal` |
| DEV-27 | Backlog | Manter | Infra/gateway/release smoke ainda pendente. | `dev-27-infra-runtime-gateway-deploy-mvp` |
| DEV-21 | Backlog | Atualizar ou absorver em DEV-36 | Contratos Evento-only parecem cobertos; manter apenas gaps reais. | `dev-21-backend-evento-api-contract-hardening` |

## Backlog Antigo

| Issue | Estado esperado | Acao sugerida | Justificativa tecnica | Branch sugerida |
|---|---|---|---|---|
| DEV-20 | Done apos este PR | Atualizar e mover para Done | Reorganizacao docs/plans substitui consolidacao antiga. | `dev-20-v03-docs-organization-and-planning` |
| DEV-25 | Duplicate/Canceled | Superseded by DEV-32 | Escopo esperado absorvido por polling/auth hardening. | n/a |
| DEV-28 | Done/Duplicate | Validar e fechar | AULA live semantics foi absorvida pelo corte Evento. | n/a |
| DEV-29 | Done/Duplicate | Validar e fechar | Lifecycle partida ja pertence ao backend Evento-only. | n/a |
| DEV-30 | Done/Duplicate | Validar e fechar | Fluxo AULA/lances foi absorvido pelo Evento canonico. | n/a |
| DEV-31 | Em Progresso ou Done | Atualizar criterios JOGO_LIVRE | Ainda vale se smoke JOGO_LIVRE nao estiver formalizado. | `dev-31-jogo-livre-e2e` |
| DEV-11 | Backlog/Canceled | Reavaliar | Timeline/lances so deve continuar se houver gap real no log atual. | `dev-11-lances-timeline` |
| DEV-12 | Backlog/Canceled | Reavaliar | UI de lances deve seguir Evento; cancelar se duplicar fluxo atual. | `dev-12-ui-lances-evento` |

## Novas Issues A Criar

Ver [02-new-issues.md](02-new-issues.md).
