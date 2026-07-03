# Revisao Plans Versus Code Map

Data da revisao: 2026-07-03.

Objetivo: cruzar `docs/plans/v0.3/*` com `docs/generated/code-map.md` e docs vivos
para validar se as proximas etapas ainda estao alinhadas ao codigo descoberto.

## Evidencias Usadas

- `python3 scripts/docs/generate_code_map.py --check`: mapa gerado atualizado.
- `docs/generated/code-map.md`: entidades, rotas backend, rotas frontend e chamadas `/api`.
- `docs/current/API.md`, `DOMAIN_MODEL.md`, `FRONTEND.md`, `INFRASTRUCTURE.md`.
- `docs/plans/v0.3/*` e `docs/plans/v0.3/slices/dev-dashboard-tailwind-v1.md`.
- Greps pontuais para auth, polling, classes Bootstrap-like e chamadas de equipes.

## Veredito Curto

Os planos v0.3 estao majoritariamente coerentes como backlog tecnico, mas misturam
tres estados diferentes: itens ja materializados no codigo, itens ainda validos e itens
obsoletos por mudanca de fluxo/branch. O `code-map` confirma a arquitetura `Evento`
como eixo real do backend/frontend, mas tambem aponta uma chamada legada suspeita
no frontend e nao comprova sozinho gates de PostgreSQL, UI, auth, polling ou release.

## Cruzamento Por Slice

| Plano/Slice | Evidencia do code-map | Avaliacao | Proxima acao |
|---|---|---|---|
| Slice 01 - ADR Evento canonico | `Evento`, `EventoParticipante`, `TimeEvento`, `Partida`, `Lance` e rotas `/eventos` aparecem como superficie ativa; rota SPA canonica e `/dias/:dataIso/eventos/:eventoId`. | Alinhado. Parece concluido no repo, faltando reconciliar Linear/estado de PR. | Marcar como done/review depois de confirmar Linear. |
| Slice 02 - PostgreSQL migration gate | O mapa mostra tabelas e FKs, mas nao valida Alembic em PostgreSQL limpo/migrado. | Coerente e ainda valido. O code-map nao substitui migration gate. | Criar/rodar gate PostgreSQL com `DATABASE_URL_TEST` ou service Postgres no CI. |
| Slice 03 - Backend Evento-only | Rotas publicas ativas usam `/api/dias/{data_iso}/eventos...`, `/api/eventos...`, `/api/partidas...`; nao ha rota publica `/api/aulas`. Existem rotas sem `/api` por compatibilidade. | Majoritariamente alinhado. As rotas sem `/api` nao sao contradicao se permanecerem compatibilidade interna/local. | Manter regra: novo frontend chama apenas `/api/...`; validar grep excluindo docs historicos e DB binario local. |
| Slice 04 - Frontend Evento-only | Rotas SPA usam `/dias/:dataIso/eventos/:eventoId`; chamadas API usam `/api/...`; nao ha chamada ativa detectada para `/api/aulas`. | Alinhado, com uma excecao suspeita: `equipesService.ts` chama `/api/dias/{diaId}/equipes`, rota que nao existe no backend efetivo. | Tratar `equipesService.ts`/`types/equipes.ts` como legado/codigo morto ou migrar para `estado-equipes` por evento. |
| Slice 05 - Usuario persistido e pagina Usuario | Entidade `Usuario`, rota backend `/api/usuarios/me` e rota frontend `/usuario` existem no mapa. | Coerente. Existencia estrutural esta confirmada; comportamento ainda precisa smoke/evidencia. | Validar `/usuario`, usuario com `jogador_id` e historico em runtime. |
| Slice 06 - Tailwind-only UI cleanup | O code-map nao avalia CSS. Grep encontrou classes Bootstrap-like ativas em dashboards, evento, jogador, turma e usuario. | Ainda valido e nao concluido. | Manter DEV-40/DEV-42 pendentes; priorizar dashboard/workspace/turmas conforme impacto. |
| Slice 07 - Auth hardening v0.3 | O code-map mostra auth login/me. Grep encontrou `JWT_SECRET = CHANGE_ME`, hash de senha via `sha256` e token em `localStorage`. | Ainda valido e importante. | Definir baseline de segredo/hash/sessao antes de release. |
| Slice 08 - Polling/auth hardening | O code-map mostra workspace/rotacao. Grep encontrou `refetchInterval`, `staleTime: 1000` e chamadas `{ force: true }`. | Ainda valido. | Revisar fan-out, backoff, pausa em 401 e cache por canal. |
| Slice 09 - CI release gate v0.3 | `.github/workflows/ci.yml` tem docs-sync, backend coverage/smoke/contract, frontend lint/build/check e Playwright preflight. | Parcial. CI existe, mas nao inclui PostgreSQL real e roda oficialmente para PR/push em `jubileu-v2`. | Adicionar PostgreSQL/migration gate e garantir PR da branch atual para `jubileu-v2`. |
| Slice 10 - Infra MVP e release smoke | Code-map nao valida runtime. Docs vivos apontam Cloudflare -> NGINX -> React SPA + FastAPI `/api` -> PostgreSQL. | Coerente como objetivo, mas depende de smoke operacional. | Atualizar ADR-0002 para incluir React SPA e registrar smoke via NGINX. |

## Achados Objetivos

### 1. Evento canonico esta alinhado

O mapa gerado confirma que `Evento` e o centro persistido e operacional:

- `eventos` referencia `dias` e `turmas`;
- `partidas`, `times_evento`, `jogadores_evento`, `lances`, `evento_participantes`,
  `evento_equipes_estado`, `evento_rotacao_estado` e `team_configs` dependem de `eventos`;
- frontend navega por `/dias/:dataIso/eventos/:eventoId`.

Isso sustenta os planos que dizem para nao reintroduzir `Aula` como entidade publica.

### 2. Ha uma chamada frontend sem rota backend correspondente

O code-map lista chamada frontend:

```text
/api/dias/{diaId}/equipes
```

Mas as rotas backend efetivas usam:

```text
/api/dias/{data_iso}/eventos/{evento_id}/estado-equipes
```

Origem encontrada:

- `frontend/jubileu-web/src/services/equipesService.ts`
- `frontend/jubileu-web/src/types/equipes.ts`

Esse service parece legado/codigo morto, porque as telas ativas usam `salvarEstadoEquipesEvento`
de `diasService.ts`. Ainda assim, enquanto existir, o `code-map` corretamente sinaliza drift
potencial entre frontend e backend.

### 3. Usuario esta estruturalmente presente

O mapa confirma:

- tabela/classe `Usuario`;
- rota backend `/api/usuarios/me`;
- rota frontend `/usuario`.

Logo, o plano de usuario nao deve ser tratado como inexistente. O que falta e evidencia de
comportamento: usuario autenticado, `jogador_id`, historico e estados vazios.

### 4. Gates tecnicos ainda nao foram todos provados

O code-map nao prova:

- Alembic em PostgreSQL limpo/migrado;
- Playwright completo;
- smoke manual/publico;
- politica de release/tag;
- seguranca de auth;
- qualidade visual Tailwind-only.

Portanto, planos de PostgreSQL gate, E2E, auth hardening, UI cleanup e release smoke ainda
sao validos mesmo com a arquitetura principal ja materializada.

### 5. O plano de branches precisa ser atualizado

`docs/plans/v0.3/05-pr-template.md` diz para nao usar `codex/*`, mas o trabalho atual esta em
`codex/docs-skills-sync`. A regra mais coerente com o fluxo atual e:

- permitir `codex/*` como branch de trabalho assistido;
- exigir PR para `jubileu-v2`;
- deixar GitHub Actions validar a branch por PR;
- usar nomes `dev-*` quando a branch representar diretamente uma issue Linear.

## Itens Que Parecem Equivocados Ou Antigos

| Item | Por que parece antigo/equivocado | Ajuste sugerido |
|---|---|---|
| `06-codex-next-actions.md` recomenda primeiro PR documental v0.3 | ADRs, planos e docs vivos ja existem; a branch atual tem novos commits de docs. | Reescrever como reconciliacao atual, nao como primeiro PR historico. |
| `ROADMAP.md` e `TEST_PLAN.md` citam commits antigos como marco atual | HEAD atual e `codex/docs-skills-sync`; base integrada e `origin/jubileu-v2` em `3210dd8`. | Separar marco historico de estado atual. |
| `05-pr-template.md` proibe `codex/*` | Contradiz o fluxo real de Codex via workspace/IDE. | Trocar para regra condicional: `codex/*` permitido para trabalho assistido, PR obrigatorio para branch alvo. |
| `/api/dias/{diaId}/equipes` em service frontend | Nao existe rota backend efetiva equivalente. | Remover se morto ou migrar para `estado-equipes` por evento. |
| Release plan com tags dev sequenciais | Pode nao refletir tags/branches reais atuais. | Verificar tags Git e Linear antes de seguir nomenclatura. |

## Sequencia Recomendada

1. Corrigir docs de fluxo: `05-pr-template.md`, `06-codex-next-actions.md`, `ROADMAP.md` e `TEST_PLAN.md`.
2. Atualizar `ADR-0002` para igualar a topologia de infra viva.
3. Resolver ou arquivar `equipesService.ts` e `types/equipes.ts` se forem legado.
4. Reconciliar Linear quando o conector destravar.
5. Priorizar proximos slices ainda comprovadamente validos:
   - PostgreSQL migration gate;
   - auth hardening;
   - polling/auth hardening;
   - Tailwind-only cleanup;
   - release smoke via NGINX.
