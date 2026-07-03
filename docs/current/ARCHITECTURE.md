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

## Direcao De Evolucao

O ciclo `v0.3.x` deve fechar:

- validacao PostgreSQL das migrations de Evento e Usuario;
- hardening de auth/segredos;
- polling/auth hardening;
- UI Tailwind-only;
- CI/release gate;
- smoke integrado via NGINX.

O ciclo nao deve abrir `v0.4` nem adicionar framework visual novo.

## Documentacao E Rastreabilidade

- `docs/current/` e a fonte humana viva.
- `docs/current/FRONTEND.md` descreve a arquitetura React/Vite, rotas, services, estado e checks.
- `docs/current/INFRASTRUCTURE.md` descreve Docker, NGINX, runtime dev/server, env e smoke.
- `docs/generated/code-map.md` e o espelho gerado do codigo para entidades, rotas e chamadas API.
- `docs/current/DOCS_SYNC.md` define quando atualizar docs e como rodar o gerador.
- `docs/current/CHAT_CONTEXT.md` e a memoria curta recomendada para novas conversas e agentes.
- Mudancas de model, rota ou service frontend devem rodar `python3 scripts/docs/generate_code_map.py`.
