# Documentacao Do Projeto Jubileu

Este diretorio separa a fonte viva do projeto, planos por ciclo, ADRs, runbooks e historico.

## Leitura Recomendada

| Necessidade | Caminho |
|---|---|
| Estado atual do projeto | [current/](current/) |
| Frontend atual | [current/FRONTEND.md](current/FRONTEND.md) |
| Infraestrutura atual | [current/INFRASTRUCTURE.md](current/INFRASTRUCTURE.md) |
| Mapa gerado do codigo | [generated/code-map.md](generated/code-map.md) |
| Sincronizacao codigo-docs | [current/DOCS_SYNC.md](current/DOCS_SYNC.md) |
| Memoria curta para chat/agentes | [current/CHAT_CONTEXT.md](current/CHAT_CONTEXT.md) |
| Plano de execucao v0.3.x | [plans/v0.3/](plans/v0.3/) |
| Decisoes arquiteturais | [adr/](adr/) e [current/DECISIONS.md](current/DECISIONS.md) |
| Setup, migrations e release | [runbooks/](runbooks/) |
| Relatorios e slices antigos | [archive/](archive/) |
| Material academico | [academic/](academic/) |
| Diagramas UML | [uml/](uml/) |

## Regra De Uso

- Use `current/` e `plans/v0.3/` para implementar trabalho novo.
- Use `generated/code-map.md` para conferir o que o codigo realmente expoe.
- Use `adr/` para decisoes estruturais.
- Use `runbooks/` para operar o projeto.
- Use `archive/` apenas como contexto historico.

## Sincronizacao

Quando alterar models, rotas backend, rotas frontend ou services de API, rode:

```bash
python3 scripts/docs/generate_code_map.py
```

Para validar drift sem reescrever o arquivo:

```bash
python3 scripts/docs/generate_code_map.py --check
```

## Ciclo Atual

`v0.3.0` foi promovida em 23 de julho de 2026 a partir do RC5 aprovado, no SHA
`bfe4ed076c101e4bf9c44bdbff7fa896a6fd7ff6`, reutilizando os mesmos digests e sem rebuild.
DEV-21 e DEV-27 encerram o Security Gate, PostgreSQL/Alembic, Playwright sem skips, supply chain,
backup/restore/rollback e runtime imutavel. RC1-RC4 permanecem historicos e nao promoviveis.

O ciclo autorizado e DEV-53 `v0.3.1 Stabilization`; o primeiro slice de observabilidade e a
DEV-55, publicado para validacao como draft PR. A DEV-54 trata separadamente o gate de
dependencias frontend que bloqueia sua conclusao. Nao abrir `v0.4`.
