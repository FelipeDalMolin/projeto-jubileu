# Projeto Jubileu

Projeto Jubileu é uma aplicação web para gerenciamento de eventos esportivos, organização de jogadores, criação de partidas e acompanhamento de estatísticas de jogo.

O sistema foi projetado para suportar treinos, jogos livres e campeonatos, permitindo organizar eventos por data, registrar presença, formar times, acompanhar partidas e consolidar indicadores da aplicação.

Para configurar o ambiente de desenvolvimento no Windows, consulte [docs/SETUP_DEV_WINDOWS.md](docs/SETUP_DEV_WINDOWS.md).

- [Getting Started](#getting-started)
  - [Usando uma Release](#usando-uma-release)
  - [Desenvolvimento e contribuição](#desenvolvimento-e-contribuição)
- [Arquitetura](#arquitetura)
- [Estruturação do domínio](#estruturação-do-domínio)
- [Documentação](#documentação)
- [Releases](#releases)
- [Compatibilidade entre versões do projeto](#compatibilidade-entre-versões-do-projeto)
- [Dúvidas, problemas ou sugestões](#dúvidas-problemas-ou-sugestões)

## Getting Started

Se você quer conhecer o projeto rapidamente, pode começar pela documentação de setup e pela estrutura geral da aplicação.

Se você pretende desenvolver, testar ou evoluir o sistema, consulte os guias da pasta `docs/`.

### Usando uma Release

Se você quer apenas executar uma versão publicada do projeto para testes ou validação:

- acesse a página de [Releases](https://github.com/FelipeDalMolin/projeto-jubileu/releases)
- escolha a versão desejada
- siga as instruções de setup do ambiente em [docs/SETUP_DEV_WINDOWS.md](docs/SETUP_DEV_WINDOWS.md)

### Desenvolvimento e contribuição

Se você quer rodar o Jubileu localmente, contribuir com código ou evoluir a aplicação:

- consulte [docs/SETUP_DEV_WINDOWS.md](docs/SETUP_DEV_WINDOWS.md) para preparar o ambiente
- consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para entender a arquitetura
- consulte [docs/DOMAIN_MODEL.md](docs/DOMAIN_MODEL.md) para entender o domínio da aplicação
- consulte [docs/API.md](docs/API.md) para entender a superfície da API
- consulte [CONTRIBUTING.md](CONTRIBUTING.md) para padrões de contribuição

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

| Descrição                 | Version     | Outcome |
| ------------------------- | -------------------------- |------------------- | ------- |
| Primeira Versão    | 0.1.0-alpha                     | OK           |
| Próxima Versão | 0.1.1                 |  Logged warning       |
