> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
Use $jubileu-backend-feature.

Read:
- docs/refactors/relatorio-arquitetura-plano-refatoracao.md
- references/backend-map.md
- references/domain-rules.md
- references/target-architecture.md
- references/refactor-rules.md
- references/delivery.md

Task:
Implement Slice 02 - Domain Reorganization and Service Extraction.

Goals:
1. Reduce the responsibilities currently concentrated in models/dia_aula.py
2. Start extracting service logic from routers/dias.py and routers/partidas.py
3. Keep persistence names and existing tables unchanged for now
4. Preserve Workspace and snapshot behavior
5. Add or update tests for extracted logic
6. Do not rename Aula to Evento yet
7. Do not change auth flow

Output:
- code changes
- technical description
- validation checklist
- explicit note on what remains legacy
