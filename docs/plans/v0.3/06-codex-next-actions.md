# 06 - Proximas Acoes Para Agentes

## Proxima Acao Recomendada

Continuar a sequencia release-safe em branches finais com o padrao real do projeto.

1. Revisar e abrir PRs empilhados para `dev-41-docs-validacao-final`,
   `chore/frontend-remove-equipes-dia-legacy` e `dev-41-smoke-validacao-final`.
2. Executar `DEV-42` por slices de UI/UX operacional.
3. Fechar `CORE-8/DEV-43`, `CORE-9/DEV-44` e `ops-v030-release-smoke`.

## Branches Recomendadas

- `dev-41-docs-validacao-final`
- `chore/frontend-remove-equipes-dia-legacy`
- `dev-41-smoke-validacao-final`
- `dev-42-ui-ux-cleanup-v03`
- `core-8-auth-security-baseline-v03`
- `dev-43-auth-hardening-v03`
- `core-9-release-policy-v03`
- `dev-44-ci-release-gate-v03`
- `ops-v030-release-smoke`

## Ordem De Issues Para Reconciliar

1. `DEV-42`
2. `CORE-8`, `DEV-43`
3. `CORE-9`, `DEV-44`, `DEV-45`
4. `DEV-48` depois dos gates v0.3
