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

## Release notes

-

## Riscos

-

## Checklist final

- [ ] Sem reintroduzir Aula como entidade publica
- [ ] Sem Bootstrap/shadcn no ciclo v0.3.x
- [ ] `/api` preservado como gateway
- [ ] Docs atualizadas
```

## Padrao De Branch

Usar:

- `dev-35-migration-persistence-evento`
- `dev-36-backend-evento-only`
- `dev-37-frontend-evento-only`
- `dev-40-ui-operacional-geral`
- `core-NN-adr-evento-canonico`

Nao usar:

- `codex/*`
- `feature/codex-*`
- `fix/codex-*`
