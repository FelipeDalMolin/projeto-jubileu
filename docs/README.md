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

O ciclo ativo e o fechamento de `v0.3.0`. DEV-21 foi integrado; DEV-27 consolida PostgreSQL,
Playwright sem skips, supply chain, bundle e runtime imutavel antes do RC aprovado. RC3 foi
rejeitado no rehearsal e RC4 foi rejeitado pelo audit de dependencias posterior ao build; RC5 e
o proximo candidato. Producao permanece `NO-GO` ate
evidencia de restore/rollback e aprovacao humana explicita.

Nao abrir `v0.4` neste ciclo.
