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

`app/modules/eventos/service.py` e uma facade import-only durante a decomposicao DEV-21. Lifecycle
vive em `lifecycle.py`, RSVP/check-in/consultas de participantes em `participants.py`, times e
snapshots em `teams.py` e fila/sorteio/proxima partida em `rotation.py`. `_legacy.py` contem somente
lances ate o quarto slice; routers nao importam o legado diretamente. Os routers de Dia delegam
regras de equipes ao modulo de capacidade e preservam apenas HTTP, ownership e serializacao.

Comandos concorrentes de rotacao adquirem locks na ordem `Evento -> EventoRotacaoEstado -> filhos`.
Conflitos esperados de unicidade ficam em savepoints SQLAlchemy, sem rollback global da transacao;
o indice parcial PostgreSQL continua sendo a defesa final contra duas partidas ativas.

Comandos canonicos:

- Evento: `POST /api/eventos/{evento_id}/start|end|cancel`;
- partida: `POST /api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start|end`;
- proxima partida: `POST /api/eventos/{evento_id}/partidas/proxima`.

## Direcao De Evolucao

O ciclo `v0.3.x` deve fechar:

- validacao PostgreSQL das migrations de Evento e Usuario;
- hardening de auth/segredos;
- polling/auth hardening;
- UI/UX operacional consistente, com decisao explicita sobre Tailwind puro,
  biblioteca existente ou dependencia nova;
- CI/release gate;
- smoke integrado via NGINX.

O ciclo nao deve abrir `v0.4`. Nova dependencia de UI so deve entrar quando a motivacao,
trade-offs, acessibilidade, manutencao, impacto visual e risco de dependencia estiverem
explicitos no PR.

## Documentacao E Rastreabilidade

- `docs/current/` e a fonte humana viva.
- `docs/current/FRONTEND.md` descreve a arquitetura React/Vite, rotas, services, estado e checks.
- `docs/current/INFRASTRUCTURE.md` descreve Docker, NGINX, runtime dev/server, env e smoke.
- `docs/generated/code-map.md` e o espelho gerado do codigo para entidades, rotas e chamadas API.
- `docs/current/DOCS_SYNC.md` define quando atualizar docs e como rodar o gerador.
- `docs/current/CHAT_CONTEXT.md` e a memoria curta recomendada para novas conversas e agentes.
- Mudancas de model, rota ou service frontend devem rodar `python3 scripts/docs/generate_code_map.py`.
