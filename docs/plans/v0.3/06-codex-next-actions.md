# 06 - Proximas Acoes Para Agentes

## Proxima Acao Recomendada

Executar a sequencia release-safe em branches finais com o padrao real do projeto.

1. Fechar `dev-41-docs-validacao-final` com docs vivos, code-map, logica calendario/evento
   e reconciliacao de branch/release.
2. Remover o legado `/api/dias/{diaId}/equipes` em branch `chore/frontend-remove-equipes-dia-legacy`
   ou issue DEV equivalente.
3. Validar smokes pendentes de `DEV-39` e `DEV-32`.
4. Executar `DEV-42` por slices de UI/UX operacional.
5. Fechar `CORE-8/DEV-43`, `CORE-9/DEV-44` e `ops-v030-release-smoke`.

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

1. `DEV-41`, `DEV-39`, `DEV-32`
2. `DEV-42`
3. `CORE-8`, `DEV-43`
4. `CORE-9`, `DEV-44`, `DEV-45`
5. `DEV-48` depois dos gates v0.3
