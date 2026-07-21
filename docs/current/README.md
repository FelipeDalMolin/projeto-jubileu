# Fonte Viva

Arquivos desta pasta representam o estado atual do projeto e devem ser priorizados sobre relatorios antigos.

| Arquivo | Uso |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Topologia, stack e regras arquiteturais. |
| [FRONTEND.md](FRONTEND.md) | Estrutura, padrao visual, rotas, services, estado e checks do React/Vite. |
| [INFRASTRUCTURE.md](INFRASTRUCTURE.md) | Docker, NGINX, runtime dev/server, env e smoke. |
| [API.md](API.md) | Contratos publicos e rotas canonicas. |
| [DOMAIN_MODEL.md](DOMAIN_MODEL.md) | Modelo de dominio. |
| [DOCS_SYNC.md](DOCS_SYNC.md) | Regra de sincronizacao entre codigo e docs. |
| [CHAT_CONTEXT.md](CHAT_CONTEXT.md) | Memoria curta para chat e agentes. |
| [ROADMAP.md](ROADMAP.md) | Direcao e janela atual. |
| [RELEASES.md](RELEASES.md) | Notas e criterios de release. |
| [DECISIONS.md](DECISIONS.md) | Indice vivo de decisoes. |

## Espelho Gerado Do Codigo

Use [../generated/code-map.md](../generated/code-map.md) para conferir entidades,
relacionamentos, rotas backend, rotas frontend e chamadas `/api/...` extraidas do codigo.

Gere novamente com:

```bash
python3 scripts/docs/generate_code_map.py
```
