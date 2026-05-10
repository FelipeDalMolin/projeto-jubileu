> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Backend Slice 10 - Evento Contracts, Tests and Release Notes

## Contexto

ApÃ³s estabilizar `AULA` e avanÃ§ar `JOGO_LIVRE`, a trilha exige fechamento de contratos e regressÃ£o.

## Objetivo

Consolidar cobertura de testes e documentaÃ§Ã£o de release para evitar drift entre backend, frontend e docs.

## Escopo

- revisar superfÃ­cies pÃºblicas em `docs/API.md`
- consolidar checklist de cenÃ¡rios crÃ­ticos por tipo de evento
- garantir rastreabilidade de release/milestones

## Fora de escopo

- novas features de domÃ­nio
- mudanÃ§as de arquitetura de runtime

## Arquivos/areas impactadas

- `docs/API.md`
- `docs/ROADMAP.md`
- `docs/RELEASES.md`
- `docs/refactors/linear-core-dev-map.md`

## Riscos

- documentaÃ§Ã£o desatualizada frente ao cÃ³digo
- cobertura incompleta de cenÃ¡rios `AULA` e `JOGO_LIVRE`

## Criterios de aceite

- contratos atualizados para lifecycle/lances
- mapa CORE/DEV alinhado com execuÃ§Ã£o real
- matriz de validaÃ§Ã£o consolidada

## Checklist de validacao

- revisar endpoints usados pelo frontend operacional
- revisar riscos PostgreSQL nÃ£o cobertos por SQLite
- registrar hot spots legados remanescentes

- executar a matriz em `docs/refactors/evento-validation-matrix.md`

## Status de Fechamento

- Backend automated validation passed through `.venv\Scripts\python.exe -m pytest` on 2026-05-09.
- Frontend automated validation passed through `npm run lint` and `npm run build` on 2026-05-09.
- Local PostgreSQL API smoke passed for login/profile with `jogadorId`, AULA lifecycle/lance gates and JOGO_LIVRE RSVP/check-in/seed/lance.
- Browser-level visual smoke remains pending; the Vite `/login` route returned HTTP 200, but browser automation was unavailable in this session.
- Linear was reconciled with DEV-28 through DEV-33 created; keep vNext DEV-34 through DEV-36 unopened until this closure is accepted.

## Dependencias para proxima fase

- prÃ³ximos slices de expansÃ£o de tipos de evento alÃ©m de `JOGO_LIVRE`
