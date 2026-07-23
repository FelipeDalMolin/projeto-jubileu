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
JUBILEU_RC_TAG=v0.3.0-rc.5
sha="$(scripts/release/resolve_release_ref.sh "$JUBILEU_RC_TAG")"
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
sha256sum --check "release-bundles/jubileu-$JUBILEU_RC_TAG.tar.gz.sha256"
```

## Stack isolada

Preencha `.env.release` fora do Git a partir do exemplo. `BACKEND_IMAGE` e `FRONTEND_IMAGE` devem
conter `@sha256:...`; `POSTGRES_VOLUME_NAME` e `NGINX_PORT` sao obrigatorios.

```bash
export COMPOSE_PROJECT_NAME=jubileu-rc5-validation
export POSTGRES_VOLUME_NAME=jubileu-rc5-validation-postgres
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

Restore so aceita project e volume em minusculas prefixados por `jubileu-rehearsal-` e rejeita
qualquer nome com `prod`:

```bash
COMPOSE_PROJECT_NAME=jubileu-rehearsal-rc5 \
POSTGRES_VOLUME_NAME=jubileu-rehearsal-rc5-postgres \
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

Quando o dump ainda contiver senhas no hash legado, o `.env.release` protegido do rehearsal deve
usar o mesmo `JWT_SECRET` vigente no runtime anterior. O valor nunca deve ser exibido, versionado ou
incluido na evidencia; um segredo aleatorio impediria deliberadamente a validacao e o rehash legado.
`REFRESH_TOKEN_HMAC_SECRET` continua separado. Ao testar o runtime anterior sobre o schema migrado,
o script consulta `alembic_version` pelo PostgreSQL e valida a saude da API; a copia Alembic antiga
nao precisa reconhecer revisions novas.

O dump nunca vira artifact publico. `rollback_release.sh` apenas avalia a classificacao; nunca faz
downgrade ou restore automaticamente.

## Promocao e rollback

Depois do `GO v0.3.0`, copie somente o bundle aprovado para `/srv/ops/stacks/jubileu-v03`, valide
checksums/digests, gere backup fresco, execute migration one-shot e suba os mesmos digests do RC
aprovado.
Observe readiness e logs por 15 minutos, exigindo zero `5xx` inesperado no smoke.

Antes de interromper o runtime anterior:

1. confirme uma credencial administrativa nao padrao que continuara ativa depois da migration;
2. se somente contas de desenvolvimento existirem, pare e obtenha autorizacao humana explicita
   para um bootstrap controlado; nunca reative uma conta de senha conhecida em producao;
3. armazene a credencial inicial fora do Git, com modo `0600`, sem exibir seu valor;
4. valide o login no runtime anterior e gere outro `pg_dump -Fc` imediatamente antes da migration;
5. valide checksum e `pg_restore --list` desse dump.

Quando o runtime anterior ainda nao for gerenciado por `compose.release.yml`, o backup deve ser
feito diretamente no container PostgreSQL identificado no inventario. Nao tente executar
`backup_release.sh` contra um project name que ainda nao controla o banco. O dump continua privado,
com `umask 077`, checksum, `pg_restore --list` e retencao definida.

- Antes da migration: mantenha o runtime anterior.
- Migration compativel: volte aos digests anteriores contra o mesmo banco.
- Migration incompativel: restore exige uma aprovacao humana separada.
- Nunca execute downgrade, restore ou rollback automaticamente.

## Evidencia da promocao v0.3.0

- autorizacao: `GO v0.3.0` e aceite explicito do smoke pelo responsavel;
- candidato: `v0.3.0-rc.5` no SHA
  `bfe4ed076c101e4bf9c44bdbff7fa896a6fd7ff6`;
- bundle: SHA-256
  `de19e2a1103368e89157ff6fc61467ba1345193d1fdd27b6186cafb4614c452d`;
- backend: `sha256:59928c4b79764127edc56a0a2cf01d2392d32a1d65a7a668dde4488cc96de92f`;
- frontend: `sha256:595355954c989edb6b6e5af387b832f95bb21d6cbd1c0180269759eafd3a1232`;
- backup imediato pre-migration: SHA-256
  `671cd1b5235492c417e1439f5b623da5efdc6bcc00ed5e3a54226a10737fdad8`, privado e com
  `pg_restore --list` valido;
- migration: `0016_usuarios_legacy_nullable -> 0020_auth_sessions_rollback_safe`;
- smoke: identidade, readiness, frontend e portas privadas aprovados;
- observacao: 31 amostras entre `2026-07-23T02:11:09Z` e `2026-07-23T02:25:43Z`, todas
  saudaveis, com zero `5xx` nos logs da API e do NGINX;
- runtime: `/srv/ops/stacks/jubileu-v03`, project `jubileu-v03`, volume
  `jubileu_prod_db_data`;
- checkout produtivo legado: nao modificado;
- restore, downgrade e rollback automatico: nao executados.
