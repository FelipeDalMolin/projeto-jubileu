# Matriz de encerramento v0.3.0

Estado de governanca: `NO-GO`. O projeto permanece `atRisk` enquanto autorizacao P0 e
rollback reproduzivel nao estiverem comprovados. Projeto e milestones nao possuem target date
por decisao explicita do responsavel.

Legenda: `sim`, `parcial`, `nao`, `aguarda merge`, `aguarda GO humano`.

| Entrega | Implementado | Testado | Documentado | Aprovado | Evidencia/bloqueio |
|---|---|---|---|---|---|
| DEV-21 PR 1 - Security Gate | sim | sim | sim | aguarda merge | `259 passed`; cobertura 84%; PostgreSQL `2 integration + 2 postgresql`; Playwright/NGINX `11 passed`; lint/build/contrato/docs/smoke verdes. |
| DEV-21 PR 2 - contratos/lifecycle/participantes | nao | nao | nao | nao | Depende do merge do PR 1. |
| DEV-21 PR 3 - equipes/rotacao | nao | nao | nao | nao | Depende do merge do PR 2; concorrencia PostgreSQL obrigatoria. |
| DEV-21 PR 4 - partidas/lances | nao | nao | nao | nao | Depende do merge do PR 3; nenhuma migration nova esperada. |
| DEV-27 PR 5 - qualidade/runtime release | nao | nao | nao | nao | Depende do fechamento DEV-21. |
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
