# Arquitetura Atual Do Jubileu

## Topologia Oficial

```text
Cloudflare -> NGINX -> FastAPI -> PostgreSQL
```

Regras nao negociaveis:

- NGINX e o unico servico exposto publicamente.
- FastAPI nao deve expor porta publica em producao.
- PostgreSQL nao deve expor porta publica em producao.
- `/api` e o prefixo de gateway para o backend.
- Toda rota `/api` deve exigir autenticacao, exceto `health`, `login`, `refresh` e `accept-invite` quando formalmente definidos.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind.
- Backend: FastAPI, SQLAlchemy, Alembic.
- Banco: PostgreSQL em dev/prod.
- Gateway: NGINX atras do Cloudflare.
- Release: imagens imutaveis por digest em `compose.release.yml`; sem build ou bind mount.

## Dominio Canonico

```text
Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas
```

`Evento` e a entidade operacional canonica. `AULA` nao e uma entidade publica raiz; e somente um valor de `Evento.tipo`.

## Contratos Publicos

- Rota frontend canonica: `/dias/:dataIso/eventos/:eventoId`.
- APIs ativas devem usar `/eventos`, `evento_id` e `eventoId`.
- Rotas, payloads e componentes baseados em `Aula` nao devem voltar ao codigo ativo.
- A autorizacao critica pertence ao backend.

## Modulos De Evento

O aggregate Evento usa `core.py` para primitivas compartilhadas, `lifecycle.py` para transicoes,
`participants.py` para RSVP/check-in, `teams.py` para times/snapshots e `rotation.py` para
fila/sorteio/proxima partida. Partidas, estatisticas e placar vivem em
`app/modules/partidas/service.py`; lances vivem em `app/modules/partidas/lances.py`. As antigas
facades `app/modules/eventos/service.py` e `_legacy.py` foram removidas: routers importam a
capacidade dona e preservam apenas HTTP, autorizacao, parent ownership e serializacao.

Comandos concorrentes de rotacao adquirem locks na ordem `Evento -> EventoRotacaoEstado -> filhos`.
Conflitos esperados de unicidade ficam em savepoints SQLAlchemy, sem rollback global da transacao;
o indice parcial PostgreSQL continua sendo a defesa final contra duas partidas ativas.

Comandos canonicos:

- Evento: `POST /api/eventos/{evento_id}/start|end|cancel`;
- partida: `POST /api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start|end`;
- proxima partida: `POST /api/eventos/{evento_id}/partidas/proxima`.

## Direcao De Evolucao

O ciclo `v0.3.0` fechou:

- validacao PostgreSQL das migrations de Evento e Usuario;
- hardening de auth/segredos e Security Gate server-side;
- polling/auth hardening;
- UI/UX operacional consistente em Tailwind e componentes locais;
- CI/release gate com seis checks obrigatorios;
- promocao por digest, migration one-shot, readiness e smoke via NGINX.

O proximo ciclo permitido e `v0.3.1 Stabilization`; nao abrir `v0.4`. Nova dependencia de UI so deve entrar quando a motivacao,
trade-offs, acessibilidade, manutencao, impacto visual e risco de dependencia estiverem
explicitos no PR.

## Runtime Promovido v0.3.0

- RC de origem: `v0.3.0-rc.5`.
- SHA: `bfe4ed076c101e4bf9c44bdbff7fa896a6fd7ff6`.
- Backend: `sha256:59928c4b79764127edc56a0a2cf01d2392d32a1d65a7a668dde4488cc96de92f`.
- Frontend: `sha256:595355954c989edb6b6e5af387b832f95bb21d6cbd1c0180269759eafd3a1232`.
- Schema: `0020_auth_sessions_rollback_safe`.
- Operacao: `/srv/ops/stacks/jubileu-v03`; o checkout legado de producao nao e superficie de deploy.

## Documentacao E Rastreabilidade

- `docs/current/` e a fonte humana viva.
- `docs/current/FRONTEND.md` descreve a arquitetura React/Vite, rotas, services, estado e checks.
- `docs/current/INFRASTRUCTURE.md` descreve Docker, NGINX, runtime dev/release, env e smoke.
- `docs/generated/code-map.md` e o espelho gerado do codigo para entidades, rotas e chamadas API.
- `docs/current/DOCS_SYNC.md` define quando atualizar docs e como rodar o gerador.
- `docs/current/CHAT_CONTEXT.md` e a memoria curta recomendada para novas conversas e agentes.
- Mudancas de model, rota ou service frontend devem rodar `python3 scripts/docs/generate_code_map.py`.
