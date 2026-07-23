# Revisao Plans Versus Code Map

Data da reconciliacao final: 2026-07-23.

## Resultado

Os planos `docs/plans/v0.3/` foram reconciliados com o codigo e com as evidencias de release.
O mapa gerado confirma `Evento` como agregado publico, rotas de dados exclusivamente sob `/api`,
auth segura por cookie/Bearer, modulos de capacidade de Evento/Partida e dashboards rastreaveis.

Gates que estavam pendentes na revisao de 3 de julho foram concluídos:

| Slice historico | Resultado v0.3.0 |
|---|---|
| Evento canonico | Concluido; `AULA` e somente `Evento.tipo`. |
| PostgreSQL migration gate | Concluido em PostgreSQL 16 para banco limpo, `0019 -> 0020`, `0016 -> 0020`, integracao e concorrencia. |
| Backend/Frontend Evento-only | Concluido; aliases sem `/api` e linguagem Aula ativa foram removidos. |
| Usuario persistido | Concluido com vinculo autorizado, perfil e self-service. |
| UI/UX operacional | Concluido no workspace guiado e dashboards; gaps restantes entram em `v0.3.1 Stabilization`. |
| Auth/polling hardening | Concluido com cookie HttpOnly, refresh single-flight, CSRF, RBAC e orcamento de polling. |
| CI/release gate | Concluido com seis required checks, Playwright sem skips e imagens por digest. |
| Infra/release smoke | Concluido no RC5 e em producao, com migration one-shot, readiness e observacao. |

## Evidencia

- Code map e matriz de autorizacao: gerados e sem drift.
- PRs DEV-21: #41-#44.
- PRs DEV-27: #45, #47 e #48.
- RC promovido: `v0.3.0-rc.5`, SHA
  `bfe4ed076c101e4bf9c44bdbff7fa896a6fd7ff6`.
- Producao: schema `0020_auth_sessions_rollback_safe`, smoke autenticado verde e 31/31 amostras
  estaveis, zero `5xx`.

Resultados detalhados ficam em `V03_CLOSURE_MATRIX.md`. O unico proximo planejamento autorizado e
`v0.3.1 Stabilization`; nao criar v0.4.
