# Projeto Jubileu

Projeto Jubileu e uma aplicacao web para gerenciamento de eventos esportivos, organizacao de jogadores, criacao de partidas e acompanhamento de estatisticas de jogo.

O sistema foi projetado para suportar treinos, jogos livres e campeonatos, permitindo organizar eventos por data, registrar presenca, formar times, acompanhar partidas e consolidar indicadores da aplicacao.

Para configurar o ambiente de desenvolvimento, comece por [docs/README.md](docs/README.md) ou pelo [quick start](docs/runbooks/quick-start.md).

- [Getting Started](#getting-started)
  - [Usando uma Release](#usando-uma-release)
  - [Desenvolvimento e contribuicao](#desenvolvimento-e-contribuicao)
- [Guia de Setup](#guia-de-setup)
- [Documentacao](#documentacao)
- [Arquitetura](#arquitetura)
- [Estruturacao do dominio](#estruturacao-do-dominio)
- [Releases](#releases)
- [Contribuicao](#contribuicao)
- Duvidas, problemas ou sugestoes? [Abra uma issue](https://github.com/FelipeDalMolin/projeto-jubileu/issues)

## Getting Started

Se voce quer conhecer o projeto rapidamente, comece pela documentacao de setup e pela estrutura geral da aplicacao.

Se voce pretende desenvolver, testar ou evoluir o sistema, consulte os guias da pasta `docs/`.

### Usando uma Release

Se voce quer apenas executar uma versao publicada do projeto para testes ou validacao:

- Acesse a pagina de [Releases](https://github.com/FelipeDalMolin/projeto-jubileu/releases)
- Escolha a versao desejada
- Siga as instrucoes de setup do ambiente conforme seu sistema operacional:
  - **Windows**: [docs/runbooks/quick-start.md](docs/runbooks/quick-start.md)
  - **Linux/macOS**: [docs/runbooks/setup-linux.md](docs/runbooks/setup-linux.md)
  - **Windows detalhado**: [docs/runbooks/setup-windows.md](docs/runbooks/setup-windows.md)

### Desenvolvimento e contribuicao

Se voce quer rodar o Jubileu localmente, contribuir com codigo ou evoluir a aplicacao:

1. Comece pela navegacao de docs: [docs/README.md](docs/README.md)
2. Configure seu ambiente:
   - Windows: [docs/runbooks/quick-start.md](docs/runbooks/quick-start.md)
   - Linux/macOS: [docs/runbooks/setup-linux.md](docs/runbooks/setup-linux.md)
3. Entenda o projeto:
   - [docs/current/ARCHITECTURE.md](docs/current/ARCHITECTURE.md) - arquitetura geral
   - [docs/current/FRONTEND.md](docs/current/FRONTEND.md) - frontend React/Vite
   - [docs/current/INFRASTRUCTURE.md](docs/current/INFRASTRUCTURE.md) - Docker, NGINX e runtime
   - [docs/current/DOMAIN_MODEL.md](docs/current/DOMAIN_MODEL.md) - dominio da aplicacao
   - [docs/generated/code-map.md](docs/generated/code-map.md) - mapa gerado de entidades, rotas e chamadas API
   - [docs/current/DOCS_SYNC.md](docs/current/DOCS_SYNC.md) - regra de sincronizacao codigo-docs
   - [docs/uml/Diagramas.md](docs/uml/Diagramas.md) - diagramas UML
4. Contribua: consulte [CONTRIBUTING.md](CONTRIBUTING.md) para padroes de contribuicao quando esse arquivo for formalizado.

## Guia de Setup

Documentacao para configurar e operar o projeto:

| Necessidade | Guia | Uso |
|---|---|---|
| Quick start | [quick-start.md](docs/runbooks/quick-start.md) | comandos essenciais |
| Windows detalhado | [setup-windows.md](docs/runbooks/setup-windows.md) | setup Windows |
| Linux / macOS | [setup-linux.md](docs/runbooks/setup-linux.md) | setup Linux/WSL |
| Migrations PostgreSQL | [postgres-migrations.md](docs/runbooks/postgres-migrations.md) | Alembic/PostgreSQL |
| Release v0.3 | [release-v03.md](docs/runbooks/release-v03.md) | gate e smoke |

Recomendacao: comece por [docs/README.md](docs/README.md) para escolher o caminho certo para seu caso de uso.

## Documentacao

Recursos principais de documentacao do projeto:

- [docs/current/](docs/current/) - fonte viva do projeto
- [docs/generated/code-map.md](docs/generated/code-map.md) - inventario gerado do codigo
- [docs/plans/v0.3/](docs/plans/v0.3/) - plano do ciclo atual
- [docs/adr/](docs/adr/) - decisoes arquiteturais
- [docs/runbooks/](docs/runbooks/) - setup, migrations e release
- [docs/archive/](docs/archive/) - historico e relatorios superseded

## Arquitetura

O Jubileu segue uma arquitetura web baseada em frontend, gateway, API e banco de dados.

```text
Cloudflare -> NGINX -> React SPA + FastAPI /api -> PostgreSQL
```

NGINX e o unico entrypoint publico. FastAPI e PostgreSQL nao devem expor portas publicas em producao.

## Estruturacao do dominio

A aplicacao usa `Evento` como entidade operacional canonica. `AULA` e apenas um valor de `Evento.tipo`. Consulte [docs/current/DOMAIN_MODEL.md](docs/current/DOMAIN_MODEL.md) para detalhes completos.

## Releases

| Versao | Descricao | Status | Data |
|---|---|---|---|
| v0.3.0 | Evento canonico, Usuario, Security Gate e release imutavel | Promovida a partir do RC5, sem rebuild | 23 de julho de 2026 |
| 0.2.0 | Setup melhorado, otimizacoes e novos scripts | Arquivado | Abril 2026 |
| 0.1.1 | Ajustes e correcoes | Arquivado | - |
| 0.1.0-alpha | Primeira versao alpha | Arquivado | - |

## Contribuicao

Se voce quer contribuir, abra uma issue ou envie um pull request. Use Linear como tracker oficial de trabalho e GitHub para PRs/codigo.

---

## Suporte

Duvidas, problemas ou sugestoes? [Abra uma issue](https://github.com/FelipeDalMolin/projeto-jubileu/issues) no repositorio.
