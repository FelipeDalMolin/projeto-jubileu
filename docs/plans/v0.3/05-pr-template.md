# 05 - PR Template Recomendado

```markdown
## Objetivo

Descrever o objetivo do PR em uma frase.

## Linear

- DEV/CORE:
- Projeto/ciclo:

## Escopo

-

## Fora de escopo

-

## Validacao backend

- [ ] `cd backend/jubileu-api-fastapi`
- [ ] `python -m pytest`
- [ ] `alembic upgrade head` quando aplicavel

## Validacao frontend

- [ ] `cd frontend/jubileu-web`
- [ ] `npm ci` quando aplicavel
- [ ] `npm run lint`
- [ ] `npm run build`

## Smoke

- [ ] login
- [ ] usuario/perfil
- [ ] evento AULA
- [ ] evento JOGO_LIVRE
- [ ] dashboard

## Migracao/compatibilidade

-

## Concorrencia/idempotencia

- [ ] Comandos mutaveis classificados conforme `docs/current/COMMAND_SAFETY.md`
- [ ] Duplo clique/retry nao cria duplicata, ou justificativa registrada
- [ ] `expected_version`, idempotency key, lock ou constraint aplicados quando necessario
- [ ] Teste cobre repeticao/conflito para fluxo sensivel

## Release notes

-

## Riscos

-

## Checklist final

- [ ] Sem reintroduzir Aula como entidade publica
- [ ] Escolhas de UI/dependencias justificadas quando o PR tocar UX
- [ ] `/api` preservado como gateway
- [ ] Command safety revisado para fluxos mutaveis
- [ ] Docs atualizadas
```

## Padrao De Branch

Base de PR: `jubileu-v2`.

Usar o padrao real do repositorio:

- `dev-35-migration-persistence-evento`
- `dev-36-backend-evento-only`
- `dev-37-frontend-evento-only`
- `dev-40-ui-operacional-geral`
- `dev-41-docs-validacao-final`
- `dev-42-ui-ux-cleanup-v03`
- `core-NN-adr-evento-canonico`
- `core-8-auth-security-baseline-v03`
- `core-9-release-policy-v03`
- `chore/server-runtime-hardening`
- `ops/wsl-dev-tunnel-scripts`
- `docs/frontend-ui-proposals-v2`

Regras:

- `dev-NN-*` quando houver issue DEV direta.
- `core-NN-*` quando a entrega for decisao CORE.
- `chore/*` para manutencao/runtime sem issue direta.
- `ops/*` para operacao, scripts e runbooks operacionais.
- `docs/*` para documentacao sem issue DEV direta.
- Se existir rascunho local fora do padrao, recriar ou renomear antes de abrir PR.

Commits devem seguir o padrao ja usado no repo, como `docs: ...`, `chore(server): ...`,
`fix(frontend): ...`, `test(e2e): ...`, `ci: ...` e `ops: ...`.
