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
| Slice 04 - Frontend Evento-only | Rotas SPA usam `/dias/:dataIso/eventos/:eventoId`; chamadas API usam `/api/...`; nao ha chamada ativa detectada para `/api/aulas` nem `/api/dias/{diaId}/equipes`. | Alinhado depois da remocao do legado de equipes por dia. | Manter o contrato canonico `estado-equipes` por evento. |
| Slice 05 - Usuario persistido e pagina Usuario | Entidade `Usuario`, rota backend `/api/usuarios/me` e rota frontend `/usuario` existem no mapa. | Coerente. Existencia estrutural esta confirmada; comportamento ainda precisa smoke/evidencia. | Validar `/usuario`, usuario com `jogador_id` e historico em runtime. |
| Slice 06 - Tailwind-only UI cleanup | O code-map nao avalia CSS. Grep encontrou classes Bootstrap-like ativas em dashboards, evento, jogador, turma e usuario. | Ainda valido e nao concluido. | Manter DEV-40/DEV-42 pendentes; priorizar dashboard/workspace/turmas conforme impacto. |
| Slice 07 - Auth hardening v0.3 | O code-map mostra auth login/me. Grep encontrou `JWT_SECRET = CHANGE_ME`, hash de senha via `sha256` e token em `localStorage`. | Ainda valido e importante. | Definir baseline de segredo/hash/sessao antes de release. |
| Slice 08 - Polling/auth hardening | O code-map mostra workspace/rotacao. Grep encontrou `refetchInterval`, `staleTime: 1000` e chamadas `{ force: true }`. | Ainda valido. | Revisar fan-out, backoff, pausa em 401 e cache por canal. |
| Slice 09 - CI release gate v0.3 | `.github/workflows/ci.yml` tem docs-sync, backend coverage/smoke/contract, frontend lint/build/check e Playwright preflight. | Parcial. CI existe, mas nao inclui PostgreSQL real e roda oficialmente para PR/push em `jubileu-v2`. | Adicionar PostgreSQL/migration gate e garantir PR da branch final para `jubileu-v2`. |
| Slice 10 - Infra MVP e release smoke | Code-map nao valida runtime. Docs vivos apontam Cloudflare -> NGINX -> React SPA + FastAPI `/api` -> PostgreSQL. | Coerente como objetivo, mas depende de smoke operacional. | Atualizar ADR-0002 para incluir React SPA e registrar smoke via NGINX. |

## Achados Objetivos

### 1. Evento canonico esta alinhado

O mapa gerado confirma que `Evento` e o centro persistido e operacional:

- `eventos` referencia `dias` e `turmas`;
- `partidas`, `times_evento`, `jogadores_evento`, `lances`, `evento_participantes`,
  `evento_equipes_estado`, `evento_rotacao_estado` e `team_configs` dependem de `eventos`;
- frontend navega por `/dias/:dataIso/eventos/:eventoId`.

Isso sustenta os planos que dizem para nao reintroduzir `Aula` como entidade publica.

### 2. Chamada frontend legada removida

O code-map apontava a chamada frontend:

```text
/api/dias/{diaId}/equipes
```

Mas as rotas backend efetivas usam:

```text
/api/dias/{data_iso}/eventos/{evento_id}/estado-equipes
```

Origem encontrada e removida no cleanup:

- `frontend/jubileu-web/src/services/equipesService.ts`
- `frontend/jubileu-web/src/types/equipes.ts`
- `frontend/jubileu-web/src/services/equipes.ts`

As telas ativas usam `salvarEstadoEquipesEvento` de `diasService.ts`, preservando
`/api/dias/{data_iso}/eventos/{evento_id}/estado-equipes` como contrato canonico.

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

### 5. O plano de branches precisa seguir o padrao real do projeto

O historico recente mostra varios padroes em uso:

- `dev-NN-*` para entregas ligadas a issues DEV;
- `core-NN-*` para decisoes CORE;
- `chore/*` para manutencao/runtime sem issue direta;
- `ops/*` para operacao e runbooks;
- `docs/*` para documentacao sem issue DEV direta.

Se um rascunho herdado existir fora desse padrao, ele deve ser renomeado ou recriado no
padrao acima antes de abrir PR para `jubileu-v2`.

## Itens Que Parecem Equivocados Ou Antigos

| Item | Por que parece antigo/equivocado | Ajuste sugerido |
|---|---|---|
| `06-codex-next-actions.md` recomenda primeiro PR documental v0.3 | ADRs, planos e docs vivos ja existem; a branch final deve ser `dev-41-docs-validacao-final`. | Reescrever como reconciliacao atual, nao como primeiro PR historico. |
| `ROADMAP.md` e `TEST_PLAN.md` citam commits antigos como marco atual | A base integrada e `origin/jubileu-v2` em `3210dd8`; o fechamento documental usa `dev-41-docs-validacao-final`. | Separar marco historico de estado atual. |
| `05-pr-template.md` nao explicava o padrao real de branch | O PR deve usar padrao do projeto. | Documentar `dev-NN-*`, `core-NN-*`, `chore/*`, `ops/*` e `docs/*`. |
| `/api/dias/{diaId}/equipes` em service frontend | Legado morto removido. | Manter guarda contra retorno dessa chamada no code-map. |
| Release plan com tags dev sequenciais | Pode nao refletir tags/branches reais atuais. | Verificar tags Git e Linear antes de seguir nomenclatura. |

## Sequencia Recomendada

1. Corrigir docs de fluxo: `05-pr-template.md`, `06-codex-next-actions.md`, `ROADMAP.md` e `TEST_PLAN.md`.
2. Atualizar `ADR-0002` para igualar a topologia de infra viva.
3. Reconciliar Linear quando o conector destravar.
4. Priorizar proximos slices ainda comprovadamente validos:
   - PostgreSQL migration gate;
   - auth hardening;
   - polling/auth hardening;
   - Tailwind-only cleanup;
   - release smoke via NGINX.
