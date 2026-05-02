# Refactors Execution Index

## Purpose

This index is the entrypoint for executing Jubileu refactors from the technical investigations.

It keeps the execution model split by area:

- `Backend`
- `Frontend`
- `Infra`

No fourth refactor track should be introduced without an explicit architecture decision.

## Source Reports

The following reports are preserved as source material and must not be overwritten by slice execution:

- `docs/refactors/Relatório técnico para implementação no Projeto Jubileu.md`
- `docs/refactors/Investigação técnica do Projeto Jubileu para plan e slices executáveis.md`
- `docs/refactors/execution-plan-domain-v3.md`
- `docs/refactors/relatorio-arquitetura-plano-refatoracao.md`
- `docs/refactors/Investigacao-tecnica-frontend.md`

## Execution Tracks

### Backend

Existing baseline:

- `docs/refactors/Backend/00-stabilization.md`
- `docs/refactors/Backend/01-app-shell-modularization.md`
- `docs/refactors/Backend/02-break-mega-model.md`
- `docs/refactors/Backend/03-api-standardization.md`
- `docs/refactors/Backend/04-auth-jwt-rbac.md`
- `docs/refactors/Backend/05-linux-nginx-deploy.md`

New continuation:

- `docs/refactors/Backend/06-evento-api-contract-hardening.md`
- `docs/refactors/Backend/07-workspace-evento-read-model.md`
- `docs/refactors/Backend/08-auth-session-operational-hardening.md`

### Frontend

Existing baseline:

- `docs/refactors/Frontend/00-overview.md`
- `docs/refactors/Frontend/01-auditoria-contratos.md`
- `docs/refactors/Frontend/02-rotas-evento.md`
- `docs/refactors/Frontend/03-workspace-evento.md`
- `docs/refactors/Frontend/04-integracao-api-eventos.md`
- `docs/refactors/Frontend/05-ui-navegacao-evento.md`
- `docs/refactors/Frontend/06-user-jogador-sessao.md`
- `docs/refactors/Frontend/07-Desmembramento de Arquivos e Redução de Acoplamento.md`

New continuation:

- `docs/refactors/Frontend/08-evento-contract-alignment.md`
- `docs/refactors/Frontend/09-workspace-evento-adapter.md`
- `docs/refactors/Frontend/10-rsvp-checkin-self-actions.md`
- `docs/refactors/Frontend/11-evento-polling-live-stability.md`
- `docs/refactors/Frontend/12-user-jogador-operational-session.md`

### Infra

New operational track:

- `docs/refactors/Infra/00-overview.md`
- `docs/refactors/Infra/01-dev-runtime-postgres-migrations.md`
- `docs/refactors/Infra/02-nginx-api-gateway.md`
- `docs/refactors/Infra/03-deploy-mvp-hardening.md`

`Backend/05-linux-nginx-deploy.md` remains historical context. New deployment/runtime work should be planned in `Infra`.

## Global Product Docs

The execution tracks are supported by:

- `docs/API.md`
- `docs/ROADMAP.md`
- `docs/RELEASES.md`
- `docs/DECISIONS.md`
- `docs/refactors/linear-core-dev-map.md`
- `docs/refactors/execution-plan-roadmap.md`

## Execution Rules

- Preserve current persistence names until a dedicated migration slice exists.
- Keep `/api` as the infrastructure gateway contract.
- Preserve legacy routes while compatibility is required.
- Do not move auth responsibility to the frontend.
- Do not change Workspace, TeamConfig, combined version, KPI, warning, RSVP/check-in, arrival ordering, or match lifecycle behavior outside explicit slices.
- Every slice must define validation and Linear linkage before implementation starts.
