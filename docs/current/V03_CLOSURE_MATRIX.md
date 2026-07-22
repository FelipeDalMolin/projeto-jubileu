# Matriz de encerramento v0.3.0

Estado de governanca: `NO-GO`. O projeto permanece `atRisk` enquanto autorizacao P0 e
rollback reproduzivel nao estiverem comprovados. Projeto e milestones nao possuem target date
por decisao explicita do responsavel.

Legenda: `sim`, `parcial`, `nao`, `aguarda merge`, `aguarda GO humano`.

| Entrega | Implementado | Testado | Documentado | Aprovado | Evidencia/bloqueio |
|---|---|---|---|---|---|
| DEV-21 PR 1 - Security Gate | sim | sim | sim | sim | PR #41 mesclado em `ffbc290`; seis required checks verdes. |
| DEV-21 PR 2 - contratos/lifecycle/participantes | sim | sim | sim | sim | PR #42 mesclado em `2cdfc02`; seis required checks verdes. |
| DEV-21 PR 3 - equipes/rotacao | sim | sim | sim | sim | PR #43 mesclado em `a19927e`; seis required checks verdes. |
| DEV-21 PR 4 - partidas/lances | sim | sim | sim | sim | PR #44 mesclado em `4664eba`; seis required checks verdes. |
| DEV-27 PR 5 - qualidade/runtime release | sim | parcial | sim | aguarda merge | Suite integral sem skips, bancos Alembic-managed, runtime unico por digest, bundle e rehearsal implementados; gates em execucao. |
| RC3 por digest | nao | nao | parcial | nao | RC1/RC2 permanecem historicos e nao promoviveis. |
| Artefato imutavel do runtime anterior | nao | nao | parcial | nao | Producao atual usa checkout/bind mounts e nao expoe identidade de release. |
| Upgrade Alembic de producao `0016 -> 0020` | nao | nao | parcial | nao | Revisao `0016_usuarios_legacy_nullable` inventariada read-only; ensaio isolado pendente. |
| Backup/restore/rollback isolado | nao | nao | parcial | nao | Nenhuma operacao produtiva autorizada; dump nunca sera artifact publico. |
| Promocao de producao | nao | nao | parcial | aguarda GO humano | Proibida antes das evidencias e de resposta humana `GO v0.3.0`. |
| Documentacao e reconciliacao CORE | nao | nao | parcial | nao | Executar somente apos promocao/smoke e PR documental DEV-27. |
| Release final `v0.3.0` | nao | nao | parcial | nao | Deve apontar para o mesmo commit e digests do RC3, sem rebuild. |

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

## Evidencia em construcao do PR 5

- Playwright passa a executar todos os specs ativos pelo NGINX, sem declaracoes de skip e com
  relatorio JSON validado contra skips/flaky.
- PostgreSQL de integracao recebe schema somente por Alembic; um gate estatico impede
  `Base.metadata.create_all/drop_all` em testes marcados `integration`.
- `compose.server.yml`, `.env.server.example` e scripts de build/deploy por checkout foram removidos.
- `compose.release.yml` exige volume PostgreSQL externo e porta NGINX explicita; API e banco nao
  publicam portas.
- Bundle, backup, restore e rehearsal geram checksums/evidencias redigidas e bloqueiam alvos com
  nome produtivo.
- Resultados exatos e aprovacao desta linha dependem dos gates locais e do merge do PR DEV-27.

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
