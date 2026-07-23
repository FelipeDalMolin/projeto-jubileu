# Matriz de encerramento v0.3.0

Estado de governanca: `GO`. `v0.3.0-rc.5` foi promovida em 23 de julho de 2026 depois de
autorizacao humana, rehearsal reproduzivel, backup imediato, migration, smoke autenticado e
observacao de 15 minutos. Projeto e milestones permaneceram sem target date por decisao explicita
do responsavel.

Legenda: `sim`, `parcial`, `nao`, `em fechamento`.

| Entrega | Implementado | Testado | Documentado | Aprovado | Evidencia/bloqueio |
|---|---|---|---|---|---|
| DEV-21 PR 1 - Security Gate | sim | sim | sim | sim | PR #41 mesclado em `ffbc290`; seis required checks verdes. |
| DEV-21 PR 2 - contratos/lifecycle/participantes | sim | sim | sim | sim | PR #42 mesclado em `2cdfc02`; seis required checks verdes. |
| DEV-21 PR 3 - equipes/rotacao | sim | sim | sim | sim | PR #43 mesclado em `a19927e`; seis required checks verdes. |
| DEV-21 PR 4 - partidas/lances | sim | sim | sim | sim | PR #44 mesclado em `4664eba`; seis required checks verdes. |
| DEV-27 PR 5 - qualidade/runtime release | sim | sim | sim | sim | PRs #45, #47 e #48; seis required checks verdes e aceite operacional completo. |
| RC por digest | sim | sim | sim | sim | RC5 aprovado no SHA `bfe4ed0`; RC1-RC4 permanecem historicos e nao promoviveis. |
| Artefato imutavel do runtime anterior | sim | sim | sim | sim | Backend/frontend OCI e checksums privados; runtime anterior validado antes e depois do schema migrado. |
| Upgrade Alembic de producao `0016 -> 0020` | sim | sim | sim | sim | Migration one-shot executada em producao e readiness confirmou `0020`. |
| Backup/restore/rollback isolado | sim | sim | sim | sim | RC5 passou nas seis fases com dump real, digests e `local_tag_override=false`. |
| Promocao de producao | sim | sim | sim | sim | `GO` humano, smoke aceito e 31/31 amostras estaveis com zero `5xx`. |
| Documentacao e reconciliacao CORE | sim | sim | sim | em fechamento | PR documental DEV-27 e reconciliacao Linear executados apos as evidencias produtivas. |
| Release final `v0.3.0` | sim | sim | sim | em fechamento | Mesmo SHA/manifesto/digests do RC5; sem rebuild e sem alterar tags existentes. |

## Inventario inicial read-only

- Base de desenvolvimento: `origin/jubileu-v2` em `3ea1c1ad7aa7e4102e618e83bb6ee15535bb3053`.
- Checkout produtivo observado: `3210dd81d9126b2df20744f5a4087baaf7d34dfb`.
- Revisao Alembic produtiva observada: `0016_usuarios_legacy_nullable`.
- Volume PostgreSQL observado: `jubileu_prod_db_data`.
- Runtime produtivo observado: API e frontend por bind mount; imagem API local sem manifesto de aplicacao.
- `/srv/apps/jubileu-prod` nao foi modificado.

## Criterio de atualizacao

Cada linha so muda para `sim` depois que houver evidencias reproduziveis de CI/smoke e merge.
`Aprovado` nunca e inferido de teste automatizado: promocao produtiva requer a decisao humana explicita.

## Evidencia local do PR 1

- Backend SQLite/contrato: `259 passed, 4 skipped`; os quatro skips foram reexecutados nos bancos
  PostgreSQL isolados correspondentes.
- PostgreSQL 16: `2 passed` no marker `integration` e `2 passed` no marker `postgresql`, sem skips.
- Coverage branch: `84%`, com `fail-under=81` aprovado.
- Playwright pelo NGINX: `11 passed`, incluindo login/cookies, RBAC visual, `403` sem refresh,
  dashboards e workspace AULA/JOGO_LIVRE.
- Frontend: lint, build e contrato `/api` aprovados.
- Infra/docs: smoke dev, smoke autenticado, contrato de borda, Bash, ShellCheck 0.10.0,
  code-map e matriz de autorizacao aprovados.
- Migration: nenhuma nova; head permanece `0020_auth_sessions_rollback_safe`.

## Evidencia do PR 1 integrado

- PR: `https://github.com/FelipeDalMolin/projeto-jubileu/pull/41`.
- Merge: `ffbc290fb2ee6c048f3c207c0f527a645c7237ff`.
- Required checks: seis de seis aprovados no GitHub Actions.

## Evidencia local do PR 2

- Contratos de lifecycle/participantes: `186 passed` no conjunto de caracterizacao.
- Backend completo: `239 passed, 4 skipped`; os quatro skips foram reexecutados em PostgreSQL 16
  (`2 integration + 2 postgresql`, zero skips).
- Coverage branch: `84%`, com `fail-under=81` aprovado.
- Playwright pelo NGINX: `11 passed`, cobrindo AULA, JOGO_LIVRE, auth, dashboards e polling.
- Frontend: lint, build e contrato `/api` aprovados.
- Migration: nenhuma nova; head permanece `0020_auth_sessions_rollback_safe`.

## Evidencia do PR 2 integrado

- PR: `https://github.com/FelipeDalMolin/projeto-jubileu/pull/42`.
- Merge: `2cdfc024322da0e1abac575680903da796072a7c`.
- Required checks: seis de seis aprovados no GitHub Actions.

## Evidencia local do PR 3

- Backend completo: `240 passed, 4 skipped`; os quatro skips foram reexecutados em PostgreSQL 16.
- PostgreSQL 16: `2 passed` no marker `integration` e `2 passed` no marker `postgresql`, sem skips.
- Coverage branch: `84%`, com `fail-under=81` aprovado.
- Playwright pelo NGINX: `11 passed`; frontend lint, build e contrato `/api` aprovados.
- Concorrencia: dois comandos simultaneos produziram somente uma partida ativa por Evento.
- Arquitetura: equipes/snapshots em `teams.py`; fila/sorteio/seed/proxima partida em `rotation.py`;
  `_legacy.py` contem somente lances; routers delegam regras de equipes.
- Transacoes: conflitos esperados usam savepoints, sem rollback global nos modulos extraidos.
- Migration: nenhuma nova; head permanece `0020_auth_sessions_rollback_safe`.

## Evidencia do PR 3 integrado

- PR: `https://github.com/FelipeDalMolin/projeto-jubileu/pull/43`.
- Merge: `a19927e1d498d0ceae641ee552c48805d37639a9`.
- Required checks: seis de seis aprovados no GitHub Actions.

## Evidencia local do PR 4

- Backend completo: `241 passed, 4 skipped`; os quatro skips foram reexecutados em PostgreSQL 16.
- PostgreSQL 16: `2 passed` no marker `integration` e `2 passed` no marker `postgresql`, sem skips.
- Coverage branch: `84%`, com `fail-under=81` aprovado.
- Playwright pelo NGINX: `11 passed`; frontend lint, build e contrato `/api` aprovados.
- Arquitetura: facades de Evento removidas; routers importam capacidades; partidas/estatisticas e
  lances possuem modulos dedicados.
- Estatisticas: comando individual preserva as demais; update completo remove excedentes antes de
  inserir ausentes; ambos usam o mesmo calculo de placar.
- Transacoes: locks adquirem Evento antes do filho e conflitos esperados usam savepoints, sem
  rollback global nos modulos de Partida.
- Migration: nenhuma nova; head permanece `0020_auth_sessions_rollback_safe`.

## Evidencia do PR 4 integrado

- PR: `https://github.com/FelipeDalMolin/projeto-jubileu/pull/44`.
- Merge: `4664eba69536a21a1df96b0f718843ef16f96d25`.
- Required checks: seis de seis aprovados no GitHub Actions.

## Evidencia do PR 5

- Playwright passa a executar todos os specs ativos pelo NGINX, sem declaracoes de skip e com
  relatorio JSON validado contra skips/flaky.
- PostgreSQL de integracao recebe schema somente por Alembic; um gate estatico impede
  `Base.metadata.create_all/drop_all` em testes marcados `integration`.
- `compose.server.yml`, `.env.server.example` e scripts de build/deploy por checkout foram removidos.
- `compose.release.yml` exige volume PostgreSQL externo e porta NGINX explicita; API e banco nao
  publicam portas.
- Bundle, backup, restore e rehearsal geram checksums/evidencias redigidas e bloqueiam alvos com
  nome produtivo.
- PR: `https://github.com/FelipeDalMolin/projeto-jubileu/pull/45`.
- Merge: `72d5856a74f7065188b8cb7d02f3fc5859283867`.
- Required checks: seis de seis aprovados no GitHub Actions.
- DEV-27 permanece `Em Progresso`: o merge comprova o slice, mas o aceite da issue exige RC aprovado,
  restore/rollback por digest e promocao/smoke autorizados.

### Resultados locais DEV-27 em 2026-07-22 UTC

- Backend unitario: `241 passed, 4 skipped`; os quatro cenarios condicionais foram reexecutados nos
  lanes PostgreSQL correspondentes.
- Coverage branch: `84%`, acima do gate `81%`; smoke `4 passed`; contract `175 passed`.
- PostgreSQL 16: `2 passed` integration e `2 passed` postgresql, zero skips. Alembic passou em banco
  limpo, `0019 -> 0020`, revisao produtiva observada `0016 -> 0020` e segunda execucao de `head`.
- Frontend: lint, build Vite e contrato `/api` aprovados.
- Playwright pelo NGINX: `18 passed`, `0 skipped`, `0 flaky`, cobrindo todos os specs ativos.
- Compose dev/release, Bash, ShellCheck 0.10.0, code-map, matriz de autorizacao e bundle com
  checksums aprovados.
- Smoke do runtime imutavel local: identidade, readiness, frontend e portas privadas aprovados.
- Rehearsal local: seis fases aprovadas; dump `pg_dump -Fc` de `69.398 bytes`, SHA-256
  `67b58ebabbb8b042a6eee0f9fca9e3a8afcedddf99fa232599e12df7aa04d68c`, restore e evidencias
  JSON/Markdown com checksums. Esse ensaio usou `ALLOW_LOCAL_TAGS=1`, a mesma imagem nos dois lados
  e schema `0020 -> 0020`; comprova a mecanica, mas nao substitui o rehearsal bloqueante por digest
  com o runtime produtivo anterior e backup restaurado.
- Producao alterada: nao. Volumes isolados do ensaio foram removidos depois da validacao.

## Evidencia RC3 e decisao de substituicao

- PR documental #46 integrado em `05defd5c320ffff6050ba627898e69821c231b66`; os seis required
  checks passaram novamente nesse SHA.
- `v0.3.0-rc.3` foi criado nesse commit. O workflow `29894288063` publicou backend
  `sha256:e1f7e63e3e2cb094a29f8998e405af4e4b862d4ad1e222febe5fd30d549c98d5` e frontend
  `sha256:0d65b5c5e17e13f29f6eebeb1f8440e42a028f34e70eb2a90d996407a7856474` e passou
  smoke mais `18 passed`, `0 skipped`, `0 flaky`.
- O runtime anterior foi associado ao commit produtivo `3210dd81d9126b2df20744f5a4087baaf7d34dfb`.
  O image ID backend coincide com os fontes copiados para a imagem; o frontend preservado coincide
  byte a byte com `dist` e NGINX montados. Os arquivos OCI privados possuem checksums validados.
- Um dump real `pg_dump -Fc` de producao foi criado com permissao `0600`, validado por
  `pg_restore --list` e restaurado apenas em volume isolado. Nenhum dump foi publicado.
- O rehearsal comprovou restore `0016`, saude do runtime anterior, upgrade `0016 -> 0020`, smoke
  RC3 e saude do runtime anterior sobre `0020`. Depois disso, a copia Alembic antiga rejeitou o nome
  desconhecido `0020_auth_sessions_rollback_safe`; esse check nao mede a compatibilidade da API e
  tornou o script incorretamente vermelho.
- Pela politica imutavel, RC3 permanece historico e nao promovivel. O corretivo DEV-27 valida a
  revisao pelo PostgreSQL, mantem o smoke da API anterior e exige um novo `v0.3.0-rc.4`.
- Na branch corretiva, o mesmo dump e os mesmos quatro digests passaram pelas seis fases, com
  `local_tag_override=false`, schema `0016 -> 0020` e evidencias privadas com checksum. A suite
  browser sobre a base restaurada passou `18 passed`, `0 skipped`, `0 flaky`. Essa prova aprova o
  corretivo, mas nao promove RC3 porque seu bundle imutavel ainda contem o script anterior.
- Producao alterada: nao. A decisao continua `NO-GO`.

## Evidencia RC4 e decisao de substituicao

- O corretivo PR #47 foi integrado em `d4144cd0d29b5d7881f5b362397c5a0b4ce8fe37`, com os seis
  required checks verdes. `v0.3.0-rc.4` aponta exatamente para esse commit.
- O workflow `29896408075` publicou backend
  `sha256:876aee2a29b0d919221a8c6e213ba6eaf24e773c729a7bcfa351e7037c427164` e frontend
  `sha256:f006c05c67ac5d44f0fe51b3a3ece0eb868e68c91631a861939de96fa74168a3`, com smoke e
  `18 passed`, `0 skipped`, `0 flaky`.
- O bundle exato do RC4 e o dump real preservado passaram pelas seis fases do rehearsal:
  restore em `0016`, runtime anterior, migration ate `0020`, RC4, runtime anterior sobre `0020` e
  retorno ao RC4. A suite integral sobre a base restaurada passou `18 passed`, `0 skipped`,
  `0 flaky`; o smoke final tambem passou.
- Um audit posterior encontrou tres vulnerabilidades high e uma moderate no conjunto de
  dependencias de producao: React Router estava em faixa vulneravel e `mqtt`, nao usado pelo codigo
  ativo, trazia dependencias transitivas vulneraveis. Pela regra imutavel, RC4 permanece historico,
  nao e alterado e nao pode ser promovido.
- O corretivo RC5 remove `mqtt`, fixa React Router em versao corrigida e adiciona
  `npm audit --audit-level=high` ao required check `Frontend`. CI, build, manifest, rehearsal e
  Playwright precisam ser repetidos no novo SHA.
- Producao alterada: nao. A decisao continua `NO-GO`.

## Evidencia local do corretivo RC5

- `mqtt` foi removido depois de busca comprovar ausencia de imports no codigo ativo;
  `react-router-dom` foi fixado em `7.18.1` e o lockfile foi reconciliado.
- Node `22.23.1`: `npm ci`, audit completo e audit somente de producao retornaram
  `found 0 vulnerabilities`; lint, build Vite e contrato `/api` passaram.
- Playwright integral pelo NGINX com Node `22.23.1`: `18 passed`, `0 skipped`, `0 flaky`.
- Code-map e matriz de autorizacao permanecem sem drift. Compose dev/release, Bash,
  ShellCheck `0.10.0` e bundle de fixture RC5 com checksum passaram.
- Migration: nenhuma nova; head permanece `0020_auth_sessions_rollback_safe`.
- Producao alterada nessa etapa: nao. O corretivo ainda dependia de PR, seis required checks no
  merge, novo RC imutavel e repeticao do rehearsal real.

## Evidencia integrada e operacional do RC5

- PR #48 integrado em `bfe4ed076c101e4bf9c44bdbff7fa896a6fd7ff6`.
- Seis required checks verdes no workflow `29898758656`.
- Workflow de release `29898968287` publicou backend
  `sha256:59928c4b79764127edc56a0a2cf01d2392d32a1d65a7a668dde4488cc96de92f` e frontend
  `sha256:595355954c989edb6b6e5af387b832f95bb21d6cbd1c0180269759eafd3a1232`.
- Bundle RC5: SHA-256
  `de19e2a1103368e89157ff6fc61467ba1345193d1fdd27b6186cafb4614c452d`.
- Playwright do candidato: `18 passed`, `0 skipped`, `0 flaky`; audit de dependencias: zero
  vulnerabilidades.
- O dump real e os artefatos anteriores passaram nas seis fases do rehearsal: restore em `0016`,
  runtime anterior, migration ate `0020`, RC5, runtime anterior sobre `0020` e retorno ao RC5.
  `local_tag_override=false`; smoke final verde; nenhuma operacao tocou producao durante o ensaio.

## Evidencia da promocao produtiva

- Autorizacoes humanas: `GO v0.3.0`, aceite do smoke e permissao explicita para criar conta
  administrativa nao padrao.
- Backup imediato anterior a migration:
  `production_20260723T020829Z_immediate_pre_migration.dump`, `61.382 bytes`, SHA-256
  `671cd1b5235492c417e1439f5b623da5efdc6bcc00ed5e3a54226a10737fdad8` e
  `pg_restore --list` valido. O dump permanece privado.
- A conta administrativa nao padrao autenticou no runtime anterior. Depois da migration, as quatro
  contas default ficaram inativas, a conta autorizada permaneceu ativa e o primeiro login gravou
  Argon2id preservando o hash legado para rollback durante a janela v0.3.
- Cutover: runtime anterior parado as `2026-07-23T02:08:50Z`; RC5 pronto as
  `2026-07-23T02:09:51Z`.
- Migration one-shot: `0016_usuarios_legacy_nullable -> 0020_auth_sessions_rollback_safe`.
- Smoke: release ref, SHA, digests, Alembic, frontend, readiness e isolamento das portas de API e
  PostgreSQL aprovados.
- Observacao: 31 amostras entre `2026-07-23T02:11:09Z` e `2026-07-23T02:25:43Z`; todas
  `ready/ok/healthy`; API `5xx=0`; NGINX `5xx=0`.
- Evidencia privada: `/srv/backups/jubileu/v0.3.0/promotion-evidence/20260723T021109Z`, com
  checksums.
- Runtime resultante: project `jubileu-v03` em `/srv/ops/stacks/jubileu-v03`, volume externo
  `jubileu_prod_db_data`, NGINX em `127.0.0.1:80`, API e PostgreSQL sem porta de host.
- `/srv/apps/jubileu-prod` nao foi modificado. Restore, downgrade e rollback automatico nao foram
  executados.
