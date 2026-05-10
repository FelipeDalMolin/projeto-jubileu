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
