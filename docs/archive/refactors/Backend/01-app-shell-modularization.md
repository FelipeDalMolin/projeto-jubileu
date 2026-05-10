> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
Use $jubileu-backend-feature.

Read:
- docs/refactors/relatorio-arquitetura-plano-refatoracao.md
- references/backend-map.md
- references/target-architecture.md
- references/refactor-rules.md
- references/platform-rules.md
- references/delivery.md

Task:
Implement Slice 01 - App Shell Modularization.

Goals:
1. Introduce app/core/config.py
2. Introduce app/db/session.py
3. Introduce app/db/base.py
4. Refactor app/main.py into create_app() composition root
5. Update deps.py to use the new SessionLocal source
6. Preserve all current behavior and route contracts
7. Do not modularize business domains yet
8. Do not change auth behavior
9. Keep /api gateway assumptions intact

Output:
- code changes
- technical description
- validation checklist
