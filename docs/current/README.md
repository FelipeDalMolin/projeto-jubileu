# Fonte Viva

Arquivos desta pasta representam o estado atual do projeto e devem ser priorizados sobre relatorios antigos.

| Arquivo | Uso |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Topologia, stack e regras arquiteturais. |
| [FRONTEND.md](FRONTEND.md) | Estrutura, padrao visual, rotas, services, estado e checks do React/Vite. |
| [INFRASTRUCTURE.md](INFRASTRUCTURE.md) | Docker, NGINX, runtime dev/release por digest, env e smoke. |
| [API.md](API.md) | Contratos publicos e rotas canonicas. |
| [DOMAIN_MODEL.md](DOMAIN_MODEL.md) | Modelo de dominio. |
| [CALENDAR_EVENT_LOGIC.md](CALENDAR_EVENT_LOGIC.md) | Reconciliacao produto/arquitetura para Calendario, Dia e Evento. |
| [COMMAND_SAFETY.md](COMMAND_SAFETY.md) | Politica para concorrencia, idempotencia e comandos mutaveis. |
| [DOCS_SYNC.md](DOCS_SYNC.md) | Regra de sincronizacao entre codigo e docs. |
| [CHAT_CONTEXT.md](CHAT_CONTEXT.md) | Memoria curta para chat e agentes. |
| [ROADMAP.md](ROADMAP.md) | Direcao e janela atual. |
| [RELEASES.md](RELEASES.md) | Notas e criterios de release. |
| [DECISIONS.md](DECISIONS.md) | Indice vivo de decisoes. |
| [PLANNING_AUDIT.md](PLANNING_AUDIT.md) | Auditoria de drift entre planos, ADRs, Linear e estado atual. |
| [PLAN_CODEMAP_REVIEW.md](PLAN_CODEMAP_REVIEW.md) | Cruzamento dos planos v0.3 com o mapa gerado do codigo. |
| [V03_CLOSURE_MATRIX.md](V03_CLOSURE_MATRIX.md) | Estado auditavel do Security Gate, candidatos RC, rollback e promocao. |
| [DEV53_OBSERVABILITY_CONFORMANCE.md](DEV53_OBSERVABILITY_CONFORMANCE.md) | Matriz do slice v0.3.1 de logs, reports, OTel e gates. |

## Espelho Gerado Do Codigo

Use [../generated/code-map.md](../generated/code-map.md) para conferir entidades,
relacionamentos, rotas backend, rotas frontend e chamadas `/api/...` extraidas do codigo.
A politica completa de RBAC fica em
[../generated/authorization-matrix.md](../generated/authorization-matrix.md).

Gere novamente com:

```bash
python3 scripts/docs/generate_code_map.py
python3 scripts/docs/generate_authorization_matrix.py
```
