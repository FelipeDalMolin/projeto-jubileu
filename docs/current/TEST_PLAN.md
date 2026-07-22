# Plano canonico de testes e rastreabilidade

## Regra de aceite

Codigo existente nao equivale a entrega concluida. Cada slice exige teste executado, documentacao,
evidencia GitHub e rastreabilidade no Linear. PostgreSQL 16 e a referencia para migrations,
integracao, locks e concorrencia; SQLite permanece somente como suite unitaria rapida.

## Required checks

Os nomes abaixo sao estaveis e bloqueantes em `jubileu-v2`:

| Check | Evidencia minima |
|---|---|
| `Docs sync` | code-map e matriz de autorizacao gerados sem drift. |
| `Backend unit` | pytest com branch coverage `>=81%`, smoke e contract. |
| `PostgreSQL + Alembic` | banco limpo, `0019 -> head`, `0016 -> head`, segunda execucao de head, integracao e concorrencia sem skips. |
| `Frontend` | Node 22, `npm ci`, audit de dependencias, lint, build e contrato `/api`. |
| `Playwright operational` | suite completa pelo NGINX, zero skips, zero flaky e resultado JSON. |
| `Compose + Shell` | Compose dev/release, bundle, Bash e ShellCheck 0.10.0. |

Relatorios de cobertura, JUnit, Playwright, logs redigidos e matriz de autorizacao sao publicados
como artifacts. Vercel nao e gate oficial nem runtime suportado.

## Separacao dos bancos

- Unitarios usam SQLite em memoria e podem criar schema com `Base.metadata.create_all()`.
- Testes marcados `integration` usam somente um PostgreSQL previamente migrado por Alembic.
- `scripts/ci/check_test_db_boundaries.py` proibe `create_all()` e `drop_all()` nos modulos de
  integracao.
- Integracao limpa somente dados via `TRUNCATE ... RESTART IDENTITY CASCADE`; nao cria nem remove
  schema.
- Markers `integration` e `postgresql` geram JUnit e passam por
  `scripts/ci/assert_junit_no_skips.py`.

## Alembic

O gate usa bancos independentes:

1. vazio -> `head`;
2. vazio -> `0019_proxima_partida_idempotente` -> `head` -> `head`;
3. vazio -> revisao produtiva observada `0016_usuarios_legacy_nullable` -> `head` -> `head`;
4. banco exclusivo para a suite `integration`, migrado ate `head`.

O head esperado permanece `0020_auth_sessions_rollback_safe`. O segundo `upgrade head` valida
idempotencia operacional da migration; migrations nunca sao executadas por `create_all()`.

## Playwright pelo NGINX

A suite executa Chromium, sequencialmente, contra o mesmo origin NGINX. Prerequisito indisponivel
falha o teste; nenhum arquivo ativo declara `test.skip`. O antigo arquivo UC06-UC09 composto apenas
por skips foi removido, porque os fluxos agora possuem fixtures auditaveis em
`operational-workspace.spec.ts`.

Cobertura browser:

- UC01: login, cookie HttpOnly, reload, refresh concorrente e logout;
- UC02-UC05: cadastros, Dia e Evento pela UI;
- UC06-UC09: AULA/JOGO_LIVRE, presenca/RSVP, chegada, equipes/fila, partida, lance e proxima partida;
- UC10: dashboards, rastreabilidade, erro, vazio e mobile;
- contratos: somente `/api`, `X-Request-ID`, `403` sem refresh, um retry por request, sessao
  expirada unica e orcamento de polling.

Comando canonico:

```bash
cd frontend/jubileu-web
E2E_RUNTIME_MODE=nginx \
E2E_BASE_URL=http://127.0.0.1:8080 \
E2E_API_URL=http://127.0.0.1:8080 \
E2E_REUSE_EXISTING_SERVER=1 \
npx playwright test --project=chromium --workers=1
node ../../scripts/ci/assert_playwright_results.mjs test-results/results.json
```

## Backend

```bash
cd backend/jubileu-api-fastapi
python -m coverage run --branch -m pytest -q -rs
python -m coverage report -m --fail-under=81
python -m pytest -q -m smoke -rs
python -m pytest -q -m contract -rs
DATABASE_URL_TEST="$POSTGRES_INTEGRATION_URL" \
  python -m pytest -q -m integration --strict-markers -rs --junitxml=integration-junit.xml
DATABASE_URL_TEST="$POSTGRES_CONCURRENCY_URL" \
  python -m pytest -q -m postgresql --strict-markers -rs --junitxml=postgresql-junit.xml
```

## Frontend e documentacao

```bash
cd frontend/jubileu-web
npm ci
npm run audit:security
npm run lint
npm run build
npm run check:api-contract

cd ../..
python3 scripts/docs/generate_code_map.py --check
python3 scripts/docs/generate_authorization_matrix.py --check
```

## Release candidate

O workflow de release so constroi depois de comprovar os seis required checks no SHA exato. O RC
usa imagens por digest, volume externo isolado, migration one-shot, readiness, versao autenticada,
smoke e a mesma suite Playwright integral. O smoke compara `release_ref`, Git SHA, digests e Alembic
com `release-manifest.json` e confirma que API/PostgreSQL nao publicam portas.

Backup usa `pg_dump -Fc`, `pg_restore --list`, SHA-256 e retencao de 30 dias. O rehearsal restaura
em project/volume isolados, valida runtime anterior, migra, valida RC, testa runtime anterior contra
o schema migrado e retorna ao RC. A revisao do schema e lida diretamente no PostgreSQL: a copia
Alembic do runtime anterior nao precisa conhecer revisions criadas pelo RC. Evidencias JSON/Markdown
sao redigidas. Nenhum dump vira artifact.

## Estado do fechamento v0.3

- DEV-21 PRs #41-#44: integrados, seis required checks verdes em cada merge.
- DEV-27 PR #45: gate, runtime unico por digest, bundle e rehearsal integrados em `72d5856`; a
  issue permanece aberta ate as evidencias operacionais e eventual promocao autorizada.
- RC1 e RC2: historicos e nao promoviveis.
- RC3: build, smoke e Playwright verdes, mas rejeitado depois da construcao porque o rehearsal
  executava `alembic current` com a copia antiga sobre o schema `0020`.
- RC4: build, smoke, Playwright e rehearsal real verdes, mas rejeitado depois da construcao porque
  o lockfile ainda continha vulnerabilidades de producao; permanece historico e nao promovivel.
- RC5: proximo candidato obrigatorio depois do corretivo DEV-27. O check `Frontend` passa a falhar
  em vulnerabilidade high/critical. Producao permanece `NO-GO` ate evidencia isolada completa e
  resposta humana `GO v0.3.0`.

Resultados exatos por PR e bloqueios pendentes ficam em `V03_CLOSURE_MATRIX.md`.
