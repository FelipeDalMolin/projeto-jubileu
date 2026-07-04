# Auditoria De Planejamento

Data da revisao: 2026-07-03.

Este arquivo registra divergencias entre docs vivos, planos v0.3, ADRs, estado Git e Linear.
Use-o antes de executar novos slices para reduzir drift.

## Estado Verificado No Repo

- Checkout canonico de dev no app-host: `/srv/apps/jubileu-dev`.
- Branch original da revisao era um rascunho assistido; branch final de PR recomendada:
  `dev-41-docs-validacao-final`.
- Base integrada mais recente observada: `origin/jubileu-v2` em `3210dd8`.
- Commits locais recentes de docs:
  - `d12370a docs: synchronize architecture memory`
  - `bffc168 docs: clarify dev workspace git flow`
- `docs/generated/code-map.md` esta atualizado segundo `python3 scripts/docs/generate_code_map.py --check`.
- CI existente em `.github/workflows/ci.yml` roda para PR/push em `jubileu-v2`.

## Discordancias Encontradas

| Area | Documento | Situacao | Acao Recomendada |
|---|---|---|---|
| Branch/marco atual | `docs/current/ROADMAP.md`, `docs/current/TEST_PLAN.md` | Ainda citam `jubileu-v2`, `94d4f45`, `4ec4284` e PR2 como marco atual. | Atualizar para separar `estado base integrado` de `branch de trabalho atual`; nao tratar commits antigos como HEAD atual. |
| Fluxo de branch | `docs/plans/v0.3/05-pr-template.md` | Precisava refletir o padrao real: `dev-NN-*`, `core-NN-*`, `chore/*`, `ops/*` e `docs/*`. | Branch final de PR deve seguir o padrao do projeto. |
| Proximas acoes | `docs/plans/v0.3/06-codex-next-actions.md` | Deve apontar para a sequencia release-safe atual, nao para o primeiro PR documental historico. | Manter como guia da proxima sequencia: `dev-41`, cleanup legado, smokes, UI/UX, auth/CI/release. |
| ADR runtime | `docs/adr/ADR-0002-runtime-gateway.md` | Topologia omite explicitamente React SPA, enquanto docs atuais usam `Cloudflare -> NGINX -> React SPA + FastAPI /api -> PostgreSQL`. | Atualizar ADR-0002 para igualar a topologia de `INFRASTRUCTURE.md`. |
| Plano v0.3 | `docs/plans/v0.3/*` | Mistura metas ja realizadas, metas ainda validas e propostas novas. | Criar uma tabela de reconciliacao por slice: `done`, `still-valid`, `superseded`, `blocked`. |
| Tailwind-only | `docs/plans/v0.3/slices/dev-dashboard-tailwind-v1.md` e codigo | Grep ainda encontra muitas classes Bootstrap-like em dashboard, jogador, turma, workspace e usuario. | Manter DEV-40/DEV-42 como pendente; nao declarar UI Tailwind-only como concluida. |
| Polling/auth | `docs/plans/v0.3/01-slices.md` e codigo | Ainda existem `refetchInterval`, `staleTime` baixo e chamadas `{ force: true }`. | Manter DEV-32 como pendente; revisar backoff, 401 e fan-out antes de release. |
| Testes PostgreSQL/E2E | `ROADMAP.md`, `TEST_PLAN.md` | `DATABASE_URL_TEST` e Playwright completo seguem como pendencias documentadas. | Confirmar no CI/ambiente antes de promover release. |

## Linear

Tentativas de leitura via app Linear retornaram repetidamente:

```text
Authentication for Linear was requested and accepted. Retry this tool call now.
```

Por isso, esta auditoria ainda nao confirma estados reais de issues/projetos/documentos no Linear.
Quando o conector estiver funcional, comparar pelo menos:

- DEV-34 a DEV-41;
- DEV-32, DEV-27 e DEV-21;
- DEV-20, DEV-25, DEV-28, DEV-29, DEV-30, DEV-31, DEV-11 e DEV-12;
- documentos/projetos com termos `v0.3`, `ADR`, `Evento`, `release`, `goals`.

## Estado De Slices Sugerido Ate Confirmar Linear

| Slice | Estado sugerido | Motivo |
|---|---|---|
| ADR Evento canonico | done/review | ADR-0001 existe e docs vivos convergem para Evento. |
| Runtime gateway | review | Infra esta bem documentada, mas ADR-0002 deve alinhar topologia com React SPA + `/api`. |
| PostgreSQL migration gate | still-valid | `DATABASE_URL_TEST` continua pendente nos docs. |
| Backend Evento-only | review | Code-map atualizado; validar grep excluindo docs historicos e DB binario local. |
| Frontend Evento-only | review | Rotas canonicas documentadas; validar lint/build e services. |
| Usuario persistido/pagina usuario | review | Docs dizem existir, mas smoke `/usuario` ainda deve ser evidenciado. |
| Tailwind-only UI | still-valid | Grep mostra classes Bootstrap-like ativas. |
| Auth/polling hardening | still-valid | Grep mostra polling e force refresh ativos. |
| CI/release gate | partial | CI existe, mas roda oficialmente em PR/push para `jubileu-v2`; release final ainda depende de smoke e checks. |

## Proxima Sequencia Recomendada

1. Atualizar `ROADMAP.md`, `TEST_PLAN.md`, `ADR-0002` e `05-pr-template.md` com o fluxo app-host/branch final.
2. Destravar Linear e reconciliar issues conforme esta auditoria.
3. Abrir PR de `dev-41-docs-validacao-final` para `jubileu-v2`, deixando GitHub Actions validar docs/backend/frontend.
4. Depois atacar os gaps ainda validos: PostgreSQL gate, Tailwind-only, polling/auth e smoke release.
