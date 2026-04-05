Use $jubileu-backend-feature.

Read:
- docs/refactors/relatorio-arquitetura-plano-refatoracao.md
- references/backend-map.md
- references/domain-rules.md
- references/platform-rules.md
- references/delivery.md

Task:
Implement Slice 00 - Stabilization and Inventory.

Goals:
1. Add a /health endpoint
2. Add smoke tests for startup and critical routes
3. Create initial docs/DOMAIN_MODEL.md and docs/ARCHITECTURE.md scaffolds
4. Analyze Alembic viability on a clean database
5. Do not change domain naming yet
6. Do not change auth flow
7. Do not change public route contracts except adding /health

Output:
- code changes
- technical description
- validation checklist
- explicit note on migration gap risk