# Runbook - Release v0.3.x

## Objetivo

Publicar `v0.3.0` apenas depois de validar Evento canonico, Usuario, auth, polling, UI Tailwind-only, CI e smoke via gateway.

## Ordem

1. Fechar PR documental de organizacao e planejamento.
2. Reconciliar Linear/GitHub.
3. Executar Slice 02: PostgreSQL migration gate.
4. Executar slices de backend/frontend/usuario.
5. Executar hardening de UI, auth, polling e CI.
6. Criar `v0.3.0-rc.1`; o workflow publica imagens por SHA e anexa o manifesto.
7. Rodar stack RC isolada e smoke integrado via NGINX.
8. Atualizar `docs/current/RELEASES.md`.
9. Solicitar aprovacao explicita antes de criar `v0.3.0` ou tocar producao.

## Gate Minimo

O PR deve apresentar os seis required checks: Docs sync, Backend unit, PostgreSQL + Alembic,
Frontend, Playwright operational e Compose + Shell. Resultado verde apenas em SQLite nao libera RC.

## Artefato E Manifesto

O workflow `.github/workflows/release.yml` resolve a ref para SHA completa e comprova que
ela pertence a `origin/jubileu-v2`. Backend e frontend sao publicados uma vez no GHCR e
identificados por digest. O arquivo `release-manifest.json` e a fonte de verdade para RC,
promocao e rollback.

```bash
scripts/release/resolve_release_ref.sh v0.3.0-rc.1
docker compose --project-name jubileu-rc --env-file .env.release -f compose.release.yml config
scripts/release/smoke_release.sh
```

O backup anterior a migration usa `pg_dump -Fc`, permissao restrita, checksum SHA-256 e
validacao por `pg_restore --list`:

```bash
COMPOSE_PROJECT_NAME=jubileu-rc scripts/release/backup_release.sh
```

Rollback somente troca para os digests do manifesto anterior quando a classe da migration
permitir. `scripts/release/rollback_release.sh` e um preflight informativo e nunca aplica
downgrade ou restore.

```powershell
cd backend\jubileu-api-fastapi
python -m pytest
alembic upgrade head

cd ..\..\frontend\jubileu-web
npm ci
npm run lint
npm run build
```

## Smoke Manual

- login;
- `/api/auth/me`;
- `/api/usuarios/me`;
- evento `AULA`: planejado, iniciado, encerrado;
- evento `JOGO_LIVRE`: RSVP, check-in, fila, seed, partida ativa e lance;
- dashboard principal;
- usuario com historico de eventos.

## Endpoints Operacionais

- `/health`: liveness do processo;
- `/api/ready`: PostgreSQL e Alembic head esperado;
- `/api/version`: identidade verificavel contra o manifesto.
