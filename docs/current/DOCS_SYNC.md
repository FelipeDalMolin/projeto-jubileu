# Sincronizacao Codigo-Docs

Este projeto usa dois tipos de documentacao:

- docs vivos escritos por humanos em `docs/current/`;
- inventarios gerados em `docs/generated/code-map.md` e
  `docs/generated/authorization-matrix.md`.

O objetivo e reduzir drift entre backend, frontend, banco e conversas de planejamento.

## Comando Principal

```bash
python3 scripts/docs/generate_code_map.py
python3 scripts/docs/generate_authorization_matrix.py
```

Validacao sem escrever arquivo:

```bash
python3 scripts/docs/generate_code_map.py --check
python3 scripts/docs/generate_authorization_matrix.py --check
```

O gerador usa apenas biblioteca padrao do Python. Ele nao precisa de FastAPI, Alembic,
Node ou venv instalada.

## O Que O Mapa Gera

`docs/generated/code-map.md` contem:

- entidades SQLAlchemy e tabelas;
- campos com foreign keys;
- relacionamentos ORM;
- ERD Mermaid;
- rotas FastAPI efetivas, considerando `include_router`;
- rotas React;
- chamadas `/api/...` encontradas nos services do frontend;
- leitura arquitetural curta derivada do codigo.

`docs/generated/authorization-matrix.md` contem todos os metodos/paths de produto, politica,
papeis e regra CSRF, derivados do registro executavel do backend.

## Regra De Atualizacao

Atualize docs junto com codigo quando mexer em:

| Mudanca | Atualizar |
|---|---|
| Model, tabela, FK, enum ou migration | `DOMAIN_MODEL.md`, ADR se houver decisao estrutural, mapa gerado |
| Rota backend ou payload publico | `API.md`, mapa gerado, testes de contrato |
| Rota React ou service frontend | `API.md` quando afetar contrato, mapa gerado |
| Fluxo de equipes, presenca, partida ou lance | `DOMAIN_MODEL.md`, `TEST_PLAN.md`, mapa gerado |
| Setup, Docker, portas, deploy | `ARCHITECTURE.md`, runbook correspondente |
| Logs, traces, healthchecks ou reports | `ARCHITECTURE.md`, `INFRASTRUCTURE.md`, `TEST_PLAN.md`, ADR/runbook correspondente |
| Decisao duradoura | `DECISIONS.md` e/ou `docs/adr/` |

## Distribuicao Recomendada

| Area | Papel |
|---|---|
| `README.md` | Entrada externa e visao rapida. |
| `docs/README.md` | Navegacao da documentacao. |
| `docs/current/` | Fonte viva e prioritaria para implementacao. |
| `docs/generated/` | Evidencia derivada do codigo; nao editar manualmente. |
| `docs/runbooks/` | Como rodar, operar e diagnosticar. |
| `docs/adr/` | Decisoes arquiteturais duradouras. |
| `docs/plans/` | Planejamento por ciclo. |
| `docs/archive/` | Historico; nao usar como fonte principal. |
| `skills/` | Instrucoes versionadas para agentes Codex. |
| `.codex/` | Memoria local auto-descoberta, ignorada pelo Git. |
| `.vscode/` | Ergonomia local do editor, ignorada pelo Git. |

## Gate De Drift

O check de CI deve falhar quando `docs/generated/code-map.md` estiver desatualizado.
Quando isso acontecer:

1. rode os dois geradores quando o slice alterar rotas ou autorizacao;
2. revise se o diff representa mudanca real de contrato ou apenas descoberta nova;
3. atualize docs humanos quando o codigo mudou a regra de negocio;
4. commit o mapa gerado junto com a mudanca de codigo.

## Como Ler Drift

- Codigo mudou e mapa mudou: normal; revise docs humanos.
- Mapa aponta rota frontend sem rota backend: provavel service legado ou contrato quebrado.
- Doc humana discorda do mapa: doc humana esta obsoleta ou o codigo violou decisao arquitetural.
- Migration historica cita `Aula`: esperado; nao use isso como linguagem de novo desenvolvimento.
