# Documentacao Do Projeto Jubileu

Este diretorio separa a fonte viva do projeto, planos por ciclo, ADRs, runbooks e historico.

## Leitura Recomendada

| Necessidade | Caminho |
|---|---|
| Estado atual do projeto | [current/](current/) |
| Plano de execucao v0.3.x | [plans/v0.3/](plans/v0.3/) |
| Decisoes arquiteturais | [adr/](adr/) e [current/DECISIONS.md](current/DECISIONS.md) |
| Setup, migrations e release | [runbooks/](runbooks/) |
| Relatorios e slices antigos | [archive/](archive/) |
| Material academico | [academic/](academic/) |
| Diagramas UML | [uml/](uml/) |

## Regra De Uso

- Use `current/` e `plans/v0.3/` para implementar trabalho novo.
- Use `adr/` para decisoes estruturais.
- Use `runbooks/` para operar o projeto.
- Use `archive/` apenas como contexto historico.

## Ciclo Atual

O ciclo ativo e `v0.3.x`. O objetivo e fechar a base operacional com `Evento` canonico, `Usuario` persistido, validacao PostgreSQL, hardening de auth/polling, UI Tailwind-only e release gate.

Nao abrir `v0.4` neste ciclo.
