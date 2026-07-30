# DEV-53 - Conformidade Do Slice De Observabilidade

## Escopo

Primeiro slice de `v0.3.1 Stabilization`: correlacao tecnica, logs estruturados, reducao de ruido
de probes, report operacional minimizado e piloto OTel sob demanda.

Baseline auditada em 29 de julho de 2026:

- checkout canonico: `/srv/apps/jubileu-dev`;
- base remota: `origin/jubileu-v2` em `95631ef` (PR #50);
- branch do slice: `felipemolin/dev-55-observabilidade-minima-e-privacidade-operacional-da-v031`,
  criada diretamente da base e publicada como draft PR;
- GitHub: nenhum PR ou issue estava aberto antes da publicacao deste slice;
- Linear: DEV-55 criada como filha de DEV-53, em `Em Progresso`, prioridade `Medium`; DEV-54
  permanece `Planejado` para tratar o gate de dependencias frontend e bloqueia a DEV-55.

Nenhuma promocao, migration, recriacao de container dev ou alteracao do runtime produtivo faz
parte desta auditoria.

## Impacto

- Dominio/schema: nenhum; Alembic permanece em `0020_auth_sessions_rollback_safe`.
- API de produto: nenhuma rota ou payload funcional novo.
- Contrato interno: IDs de correlacao validados, rota normalizada e logs JSON.
- Runtime: Compose dev/release, NGINX, imagem backend, healthchecks e report operacional.
- OTel: traces automaticos FastAPI/SQLAlchemy/Psycopg; desligado por default e sem browser,
  metricas, logs ou spans manuais de negocio.

## Matriz

| Criterio | Evidencia | Estado |
|---|---|---|
| OTel nao altera o runtime base | `OTEL_SDK_DISABLED=true`; overlay separado | Conforme |
| Collector/Aspire nao gerenciam o Jubileu | rede externa privada; nenhuma porta OTel no Compose do app | Conforme |
| Backend funciona sem Collector | request `/api/health` com SDK ativo e endpoint indisponivel | Conforme |
| Build reproduzivel do backend | imagem e jobs backend/PostgreSQL usam `requirements.lock --require-hashes` | Conforme |
| Logs nao guardam path/query/body/header livre | formatter allowlist + templates NGINX fail-closed | Conforme |
| IDs de correlacao nao carregam texto livre | UUID/32-hex, W3C v00 e Ray ID validados | Conforme |
| Probes nao geram ruido continuo | probes 2xx omitidos; readiness usa uma consulta | Conforme |
| Report nao coleta dados nominais/raw | agregados, `0700`/`0600`, retencao e guardas de path | Conforme |
| Gate protege os novos contratos | unittest ops, `nginx -t`, overlay Compose e Bash no `Compose + Shell` | Conforme no diff |
| Mapas gerados | code-map e authorization matrix sem drift | Conforme |
| Backend unit/smoke/contract | 253 passed, 4 skips PostgreSQL condicionais, coverage 84%, smoke 4, contract 187 | Conforme local |
| Frontend lint/build/contrato | lint, Vite build e `check:api-contract` | Conforme local |
| Runtime dev carregou novo Compose/NGINX | SHA do arquivo montado difere do host; containers ainda usam config anterior | Pendente janela controlada |
| Gate `Frontend` | `npm audit --audit-level=high` encontrou advisories altos atuais | Bloqueado |
| PostgreSQL/Alembic e Playwright completos | obrigatorios no PR; nao exigidos para a passagem documental local | Pendente CI/PR |
| Rastreabilidade Linear | DEV-55 e DEV-54 filhas de DEV-53; dependencia registrada | Conforme |

## Blocker De Dependencias Frontend

A passagem local encontrou dois grupos atuais:

- React Router `7.18.1`: [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2),
  corrigido apenas em `8.3.0`. O advisory declara impacto no modo RSC instavel, nao usado por esta
  SPA, mas o required check nao permite ignorar severidade alta.
- `brace-expansion` transitivo do tooling ESLint:
  [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg). A correcao sugerida
  pelo npm atravessa major de ESLint.

Nao foi aplicado downgrade, `audit fix --force` nem excecao no gate. A resolucao pertence a
DEV-54, em branch e PR proprios, com lint, build, contrato e Playwright, preservando o bloqueio de
severidade alta.

## Condicoes Para Sair De Draft

1. resolver a DEV-54 sem reduzir o gate de severidade alta;
2. obter os seis required checks verdes no SHA exato;
3. recriar somente os containers dev afetados em janela controlada e repetir smoke;
4. manter producao e `/srv/apps/jubileu-prod` intocados;
5. habilitacao produtiva de OTel continua fora do PR ate canary aprovado.
