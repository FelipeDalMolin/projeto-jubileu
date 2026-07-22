# Runbook - release v0.3.x por digest

## Limite de autoridade

RCs podem ser construidos e validados em stacks isoladas. Producao so pode ser alterada depois da
resposta humana literal `GO v0.3.0`. Ate essa resposta, `/srv/apps/jubileu-prod` e somente fonte de
inventario read-only. A promocao opera em `/srv/ops/stacks/jubileu-v03` e nunca faz pull, build ou
edicao no checkout produtivo antigo.

## Preflight do SHA

O SHA precisa pertencer ao historico de `origin/jubileu-v2`, e os seis checks devem estar verdes
exatamente nele:

```bash
sha="$(scripts/release/resolve_release_ref.sh v0.3.0-rc.3)"
GH_TOKEN="$GITHUB_TOKEN" scripts/release/verify_required_checks.sh "$sha" required-checks.json
```

Checks obrigatorios: `Docs sync`, `Backend unit`, `PostgreSQL + Alembic`, `Frontend`,
`Playwright operational` e `Compose + Shell`.

## Artefatos

`.github/workflows/release.yml` constroi backend e frontend uma vez para `linux/amd64`, publica no
GHCR com a SHA completa e registra os digests em `release-manifest.json`. O manifesto tambem contem
Alembic head, workflow, checks e compatibilidade da migration. A tag e o manifesto nunca sao
sobrescritos; qualquer falha posterior a construcao exige outro RC.

O bundle verificavel nao inclui segredos:

```bash
scripts/release/build_release_bundle.sh release-manifest.json release-bundles
sha256sum --check release-bundles/jubileu-v0.3.0-rc.3.tar.gz.sha256
```

## Stack isolada

Preencha `.env.release` fora do Git a partir do exemplo. `BACKEND_IMAGE` e `FRONTEND_IMAGE` devem
conter `@sha256:...`; `POSTGRES_VOLUME_NAME` e `NGINX_PORT` sao obrigatorios.

```bash
export COMPOSE_PROJECT_NAME=jubileu-rc3-validation
export POSTGRES_VOLUME_NAME=jubileu-rc3-validation-postgres
docker volume create "$POSTGRES_VOLUME_NAME"
docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file .env.release \
  -f compose.release.yml up -d --wait jubileu-db
docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file .env.release \
  -f compose.release.yml run --rm migration
docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file .env.release \
  -f compose.release.yml up -d --wait jubileu-api nginx
```

Migration nao roda dentro do startup da API. O NGINX aguarda `/api/ready`; apenas NGINX publica
porta em loopback. API e PostgreSQL nao publicam portas.

## Smoke e Playwright

O smoke faz login antes de consultar `/api/version` e compara release ref, SHA, digests e Alembic
com o manifesto:

```bash
RELEASE_BASE_URL=http://127.0.0.1:"$NGINX_PORT" \
RELEASE_MANIFEST=release-manifest.json \
SMOKE_USERNAME="$JUBILEU_SMOKE_USERNAME" \
SMOKE_PASSWORD="$JUBILEU_SMOKE_PASSWORD" \
scripts/release/smoke_release.sh

cd frontend/jubileu-web
E2E_RUNTIME_MODE=nginx \
E2E_BASE_URL=http://127.0.0.1:"$NGINX_PORT" \
E2E_API_URL=http://127.0.0.1:"$NGINX_PORT" \
E2E_REUSE_EXISTING_SERVER=1 \
npx playwright test --project=chromium --workers=1
node ../../scripts/ci/assert_playwright_results.mjs test-results/results.json
```

Nao ha `test.skip`: prerequisito ausente falha o gate.

## Backup e restore isolado

O backup usa custom format, `umask 077`, valida `pg_restore --list`, cria SHA-256 e remove backups
com mais de 30 dias no diretorio configurado:

```bash
BACKUP_DIR=/srv/backups/jubileu/v0.3.0 RETENTION_DAYS=30 scripts/release/backup_release.sh
```

Restore so aceita project e volume prefixados por `jubileu-rehearsal-` e rejeita qualquer nome com
`prod`:

```bash
COMPOSE_PROJECT_NAME=jubileu-rehearsal-rc3 \
POSTGRES_VOLUME_NAME=jubileu-rehearsal-rc3-postgres \
scripts/release/restore_release.sh /caminho/backup.dump
```

O ensaio completo restaura, valida o runtime anterior, aplica migrations do RC, valida o RC, volta
ao runtime anterior contra o schema migrado e retorna ao RC. Evidencias JSON/Markdown sao redigidas
e recebem checksums:

```bash
scripts/release/rehearse_restore_rollback.sh \
  previous-release-manifest.json release-manifest.json /caminho/backup.dump
```

O rehearsal operacional aceita somente imagens `@sha256`. `ALLOW_LOCAL_TAGS=1` existe apenas para
testar a mecanica durante desenvolvimento; uma evidencia com esse override nao comprova rollback
produtivo.

O dump nunca vira artifact publico. `rollback_release.sh` apenas avalia a classificacao; nunca faz
downgrade ou restore automaticamente.

## Promocao e rollback

Depois do `GO v0.3.0`, copie somente o bundle aprovado para `/srv/ops/stacks/jubileu-v03`, valide
checksums/digests, gere backup fresco, execute migration one-shot e suba os mesmos digests do RC3.
Observe readiness e logs por 15 minutos, exigindo zero `5xx` inesperado no smoke.

- Antes da migration: mantenha o runtime anterior.
- Migration compativel: volte aos digests anteriores contra o mesmo banco.
- Migration incompativel: restore exige uma aprovacao humana separada.
- Nunca execute downgrade, restore ou rollback automaticamente.
