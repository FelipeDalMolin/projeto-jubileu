# Jubileu Decisions

Este arquivo e o indice vivo das decisoes arquiteturais usadas para implementar o ciclo atual.
Discussao detalhada pode existir no Linear, mas a regra ativa para implementacao deve estar aqui ou em `docs/adr/`.

## Decisoes Ativas

| ADR/CORE | Tema | Estado | Regra ativa |
|---|---|---|---|
| ADR-0001 | Evento canonico | Ativa | `Evento` e a entidade publica canonica. `AULA` e apenas valor de `Evento.tipo`. |
| ADR-0002 | Runtime gateway | Ativa | A topologia oficial e `Cloudflare -> NGINX -> FastAPI -> PostgreSQL`. |
| CORE-1 | Principios arquiteturais | Ativa | Evoluir por slices pequenos, com contratos claros e validacao. |
| CORE-2 | Estado, snapshot e eventos | Ativa, superseded em nome | A decisao continua valida como padrao, mas deve ser lida como modelo de `Evento`, nao de entidade `Aula`. |
| CORE-3 | Workspace DTO | Ativa, superseded em nome | Workspace e read-model de UI. A superficie ativa deve usar `WorkspaceEvento`. |
| CORE-4 | Status e tipo | Ativa, superseded em nome | Status/tipo sao regras de dominio impostas pelo backend em `Evento`. |
| CORE-5 | Presenca e check-in | Ativa | RSVP, check-in e jogador vinculado sao fluxos de dominio. |
| CORE-6 | UI modular e indicadores | Ativa | Telas operacionais devem ser modulares, densas, escaneaveis e sem polling descontrolado. |

## Regras Canonicas

- Dominio publico: `Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`.
- `Evento` e a raiz operacional para APIs, frontend e docs vivos.
- `AULA` permanece como modo: `Evento.tipo = AULA`.
- A rota frontend canonica e `/dias/:dataIso/eventos/:eventoId`.
- Nao reintroduzir `/dias/:dataIso/aulas/:aulaId`, `aulaId`, `aula_id` ou `WorkspaceAula` em codigo ativo.
- Referencias antigas a Aula nos docs arquivados sao historicas e nao devem guiar implementacao nova.

## Quando Criar Nova ADR

Crie ou atualize uma ADR quando a mudanca afetar:

- semantica de dominio;
- persistencia e migrations;
- contrato publico de API/frontend;
- autenticacao, autorizacao ou seguranca;
- topologia de deploy;
- politica de release ou compatibilidade.
