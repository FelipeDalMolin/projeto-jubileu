# Projeto Jubileu

Projeto Jubileu é uma aplicação web para gerenciamento de eventos esportivos, organização de jogadores, criação de partidas e acompanhamento de estatísticas de jogo.

O sistema foi projetado para suportar treinos, jogos livres e campeonatos, permitindo organizar eventos por data, registrar presença, formar times, acompanhar partidas e consolidar indicadores da aplicação.

Para configurar o ambiente de desenvolvimento no Windows, consulte [docs/SETUP_DEV_WINDOWS.md](docs/SETUP_DEV_WINDOWS.md).

- [Getting Started](#getting-started)
  - [Usando uma Release](#usando-uma-release)
  - [Desenvolvimento e contribuição](#desenvolvimento-e-contribuição)
- [Guia de Setup](#guia-de-setup)
- [Documentação](#documentação)
- [Arquitetura](#arquitetura)
- [Estruturação do domínio](#estruturação-do-domínio)
- [Releases](#releases)
- [Contribuição](#contribuição)
- Dúvidas, problemas ou sugestões? [Abra uma issue](https://github.com/FelipeDalMolin/projeto-jubileu/issues)

## Getting Started

Se você quer conhecer o projeto rapidamente, pode começar pela documentação de setup e pela estrutura geral da aplicação.

Se você pretende desenvolver, testar ou evoluir o sistema, consulte os guias da pasta `docs/`.

### Usando uma Release

Se você quer apenas executar uma versão publicada do projeto para testes ou validação:

- Acesse a página de [Releases](https://github.com/FelipeDalMolin/projeto-jubileu/releases)
- Escolha a versão desejada
- Siga as instruções de setup do ambiente conforme seu sistema operacional:
  - **Windows**: [docs/QUICK_START.md](docs/QUICK_START.md) (5 min com scripts PowerShell)
  - **Linux/macOS**: [docs/SETUP_LINUX.md](docs/SETUP_LINUX.md)
  - **Windows Detailed**: [docs/SETUP_DEV_WINDOWS.md](docs/SETUP_DEV_WINDOWS.md)

### Desenvolvimento e contribuição

Se você quer rodar o Jubileu localmente, contribuir com código ou evoluir a aplicação:

1. **Comece pelo guia de navegação**: [docs/DOCS_NAVIGATION.md](docs/DOCS_NAVIGATION.md)
2. **Configure seu ambiente**:
   - Windows: [docs/QUICK_START.md](docs/QUICK_START.md)
   - Linux/macOS: [docs/SETUP_LINUX.md](docs/SETUP_LINUX.md)
3. **Entenda o projeto**:
   - [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura geral
   - [docs/DOMAIN_MODEL.md](docs/DOMAIN_MODEL.md) - Domínio da aplicação
   - [docs/UML/Diagramas.md](docs/UML/Diagramas.md) - Diagramas UML
4. **Contribua**: Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para padrões de contribuição (em breve)

## Guia de Setup

Documentação completa para configurar o projeto em diferentes ambientes:

| Sistema | Guia | Timeframe |
|---------|------|-----------|
| **Windows** | [QUICK_START.md](docs/QUICK_START.md) | 5 min (com scripts) |
| **Windows Detalhado** | [SETUP_DEV_WINDOWS.md](docs/SETUP_DEV_WINDOWS.md) | 15 min (manual) |
| **Linux / macOS** | [SETUP_LINUX.md](docs/SETUP_LINUX.md) | 20 min |
| **Resumo Linux** | [SETUP_LINUX_SUMMARY.md](docs/SETUP_LINUX_SUMMARY.md) | Quick reference |
| **Comparação de Scripts** | [SETUP_SCRIPTS_COMPARISON.md](docs/SETUP_SCRIPTS_COMPARISON.md) | Windows vs Linux |
| **Scripts Análise Detalhada** | [SETUP_SCRIPTS_ANALYSIS.md](docs/SETUP_SCRIPTS_ANALYSIS.md) | Aprofundado |
| **Visualização de Scripts** | [SETUP_SCRIPTS_VISUAL.md](docs/SETUP_SCRIPTS_VISUAL.md) | Estrutura visual |

**Recomendação**: Comece por [DOCS_NAVIGATION.md](docs/DOCS_NAVIGATION.md) para escolher o caminho certo para seu caso de uso.

## Documentação

Recursos principais de documentação do projeto:

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura da aplicação
- [DOMAIN_MODEL.md](docs/DOMAIN_MODEL.md) - Modelo de domínio e entidades
- [UML/Diagramas.md](docs/UML/Diagramas.md) - Diagramas UML da aplicação
- [FILE_INVENTORY.md](docs/FILE_INVENTORY.md) - Inventário de arquivos do projeto
- [RESUMO_MELHORIAS.md](docs/RESUMO_MELHORIAS.md) - Histórico de melhorias

## Arquitetura

O Jubileu segue uma arquitetura web baseada em frontend, API e banco de dados, com foco em separação clara de responsabilidades.

```text
React + Vite + TypeScript
          ↓
        NGINX
          ↓
        FastAPI
          ↓
       PostgreSQL
```

## Estruturação do domínio

A aplicação foi estruturada seguindo princípios de **Domain-Driven Design (DDD)** para organizar entidades, agregados e invariantes de negócio. Consulte [docs/DOMAIN_MODEL.md](docs/DOMAIN_MODEL.md) para detalhes completos.

## Releases

| Versão | Descrição | Status | Data |
|--------|-----------|--------|------|
| 0.2.0  | Setup melhorado, otimizações e novos scripts | ✅ Atual | Abril 2026 |
| 0.1.1  | Ajustes e correções | Arquivada | - |
| 0.1.0-alpha | Primeira versão alpha | Arquivada | - |

## Contribuição

Se você quer contribuir, abra uma issue ou envie um pull request. Siga os padrões definidos em [CONTRIBUTING.md](CONTRIBUTING.md) (em desenvolvimento).

---

## Suporte

Dúvidas, problemas ou sugestões? [Abra uma issue](https://github.com/FelipeDalMolin/projeto-jubileu/issues) no repositório.