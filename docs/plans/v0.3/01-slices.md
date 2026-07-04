# 01 - Slices v0.3.x

## Slice 01 - Reconciliacao E ADR Evento Canonico

| Campo | Valor |
|---|---|
| Issues | DEV-34, DEV-41, CORE novo se necessario |
| Branch | `dev-34-decisao-evento-canonico` ou `core-NN-adr-evento-canonico` |
| Objetivo | Formalizar que `Evento` e canonico e `AULA` e apenas modo. |
| Arquivos provaveis | `docs/adr/*`, `docs/current/DECISIONS.md`, `docs/current/ROADMAP.md` |
| Fora de escopo | Codigo de aplicacao e migrations. |
| Aceite | ADR publicada, docs vivos sem contradicao, Linear reconciliado. |
| Validacao | `git grep -nE "WorkspaceAula|/aulas/|aula_id|aulaId" -- docs` |
| Risco | Docs historicos continuarem guiando implementacao nova. |
| RELEASES | Registrar decisao em `docs/current/RELEASES.md`. |

## Slice 02 - PostgreSQL Migration Gate Evento + Usuario

| Campo | Valor |
|---|---|
| Issues | DEV-35, DEV-36, DEV-38 |
| Branch | `dev-35-migration-persistence-evento` |
| Objetivo | Validar Alembic em PostgreSQL limpo e migrado. |
| Arquivos provaveis | Alembic, models, runbook de migrations |
| Fora de escopo | UI e novas features. |
| Aceite | `upgrade head` passa em banco limpo e com dados; rollback documentado. |
| Validacao | `python -m alembic heads`, `python -m alembic upgrade head`, `python -m pytest` |
| Risco | Drift SQLite/PostgreSQL em enums/defaults. |
| RELEASES | Registrar resultado do gate e riscos restantes. |

## Slice 03 - Backend Evento-only

| Campo | Valor |
|---|---|
| Issues | DEV-36, DEV-21 se ainda fizer sentido |
| Branch | `dev-36-backend-evento-only` |
| Objetivo | Garantir contratos publicos ativos baseados em Evento. |
| Arquivos provaveis | routers, schemas, services e testes backend |
| Fora de escopo | Redesign UI. |
| Aceite | Sem rotas publicas Aula; respostas usam `evento_id`; testes verdes. |
| Validacao | `python -m pytest`; grep de Aula fora de migrations historicas. |
| Risco | Alias legado reaparecer por conveniencia. |
| RELEASES | Registrar breaking changes de contrato. |

## Slice 04 - Frontend Evento-only

| Campo | Valor |
|---|---|
| Issues | DEV-37, DEV-39 parcialmente |
| Branch | `dev-37-frontend-evento-only` |
| Objetivo | Garantir navegacao e UI baseadas em Evento. |
| Arquivos provaveis | routes, services, hooks, types e workspace |
| Fora de escopo | Nova experiencia visual ampla. |
| Aceite | Rota canonica unica; services usam `/eventos`; lint/build verdes. |
| Validacao | `npm run lint`, `npm run build`, grep de `aulaId`. |
| Risco | Link antigo para `/aulas` em docs/UI. |
| RELEASES | Registrar migracao frontend. |

## Slice 05 - Usuario Persistido E Pagina Usuario

| Campo | Valor |
|---|---|
| Issues | DEV-38, DEV-39 |
| Branch | `dev-38-usuario-persistido` ou `dev-39-pagina-usuario` |
| Objetivo | Fechar `/api/auth/me`, `/api/usuarios/me` e `/usuario`. |
| Arquivos provaveis | auth, usuarios, pagina Usuario, testes |
| Fora de escopo | Dados pessoais sensiveis extras. |
| Aceite | Perfil essencial, jogador vinculado e historico de eventos. |
| Validacao | `python -m pytest`, `npm run lint`, smoke login/usuario. |
| Risco | Divergencia entre sessao local e usuario persistido. |
| RELEASES | Registrar contrato de usuario. |

## Slice 06 - Tailwind-only UI Cleanup

| Campo | Valor |
|---|---|
| Issues | DEV-40 ou nova DEV |
| Branch | `dev-40-ui-operacional-geral` ou `dev-NN-tailwind-only-ui-cleanup` |
| Objetivo | Remover classes Bootstrap-like e consolidar componentes Tailwind. |
| Arquivos provaveis | dashboards, jogadores, turmas, sessao |
| Fora de escopo | Introduzir dependencia de UI sem justificativa explicita. |
| Aceite | Grep sem classes Bootstrap-like em `src`; UI responsiva e consistente. |
| Validacao | `npm run lint`, `npm run build`, grep de classes proibidas. |
| Risco | Refactor visual grande demais para um PR. |
| RELEASES | Registrar cleanup visual e telas tocadas. |

## Slice 07 - Auth Hardening v0.3

| Campo | Valor |
|---|---|
| Issues | Nova DEV/CORE se necessario |
| Branch | `dev-NN-auth-hardening-v03` |
| Objetivo | Impedir segredo inseguro em producao, trocar hash fragil e remover JWT de localStorage. |
| Arquivos provaveis | auth backend, config, AuthContext, services |
| Fora de escopo | SSO e OAuth externo. |
| Aceite | Sem `CHANGE_ME` em prod; hash robusto; storage de sessao seguro. |
| Validacao | pytest auth, lint/build, grep de auth risks. |
| Risco | Quebrar smoke local por remover compatibilidade sem plano. |
| RELEASES | Registrar mudancas de auth e compatibilidade. |

## Slice 08 - Polling/Auth Hardening

| Campo | Valor |
|---|---|
| Issues | DEV-32, DEV-25 como referencia/superseded |
| Branch | `dev-32-polling-auth-hardening-por-canal` |
| Objetivo | Evitar fan-out, loops de 401 e polling excessivo. |
| Arquivos provaveis | TanStack Query, workspace, services de auth |
| Fora de escopo | WebSocket/MQTT. |
| Aceite | Polling por canal, backoff, pausa em 401 e sem force reload excessivo. |
| Validacao | `npm run lint`, `npm run build`, grep de `refetchInterval|staleTime|force: true`. |
| Risco | UI ficar lenta por cache conservador demais. |
| RELEASES | Registrar politica de polling. |

## Slice 09 - CI Release Gate v0.3

| Campo | Valor |
|---|---|
| Issues | DEV-41 e nova DEV |
| Branch | `dev-NN-ci-release-gate-v03` |
| Objetivo | Automatizar pytest, Alembic em PostgreSQL, lint e build. |
| Arquivos provaveis | `.github/workflows`, docs de release |
| Fora de escopo | Deploy automatico de producao. |
| Aceite | CI roda backend, migration gate, lint e build. |
| Validacao | Workflow verde em PR. |
| Risco | CI divergir do ambiente local. |
| RELEASES | Registrar checks obrigatorios. |

## Slice 10 - Infra MVP E Release Smoke

| Campo | Valor |
|---|---|
| Issues | DEV-27, DEV-41 e nova DEV |
| Branch | `dev-27-infra-runtime-gateway-deploy-mvp` ou `dev-NN-v030-release-smoke` |
| Objetivo | Validar NGINX, Docker/runtime, smoke integrado e tag `v0.3.0`. |
| Arquivos provaveis | NGINX, compose, runbooks, releases |
| Fora de escopo | Cloud infra completa. |
| Aceite | NGINX unico publico; FastAPI/Postgres internos; smoke via gateway. |
| Validacao | smoke login, usuario, AULA, JOGO_LIVRE, dashboard. |
| Risco | Ambiente manual nao reproduzivel. |
| RELEASES | Fechar `v0.3.0` com tag e notas. |
