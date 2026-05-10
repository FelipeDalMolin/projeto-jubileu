# Backend Slice 10 - Evento Contracts, Tests and Release Notes

## Contexto

Após estabilizar `AULA` e avançar `JOGO_LIVRE`, a trilha exige fechamento de contratos e regressão.

## Objetivo

Consolidar cobertura de testes e documentação de release para evitar drift entre backend, frontend e docs.

## Escopo

- revisar superfícies públicas em `docs/API.md`
- consolidar checklist de cenários críticos por tipo de evento
- garantir rastreabilidade de release/milestones

## Fora de escopo

- novas features de domínio
- mudanças de arquitetura de runtime

## Arquivos/areas impactadas

- `docs/API.md`
- `docs/ROADMAP.md`
- `docs/RELEASES.md`
- `docs/refactors/linear-core-dev-map.md`

## Riscos

- documentação desatualizada frente ao código
- cobertura incompleta de cenários `AULA` e `JOGO_LIVRE`

## Criterios de aceite

- contratos atualizados para lifecycle/lances
- mapa CORE/DEV alinhado com execução real
- matriz de validação consolidada

## Checklist de validacao

- revisar endpoints usados pelo frontend operacional
- revisar riscos PostgreSQL não cobertos por SQLite
- registrar hot spots legados remanescentes

- executar a matriz em `docs/refactors/evento-validation-matrix.md`

## Status de Fechamento

- Backend automated validation passed through `.venv\Scripts\python.exe -m pytest` on 2026-05-09.
- Frontend automated validation passed through `npm run lint` and `npm run build` on 2026-05-09.
- Local PostgreSQL API smoke passed for login/profile with `jogadorId`, AULA lifecycle/lance gates and JOGO_LIVRE RSVP/check-in/seed/lance.
- Browser-level visual smoke remains pending; the Vite `/login` route returned HTTP 200, but browser automation was unavailable in this session.
- Linear was reconciled with DEV-28 through DEV-33 created; keep vNext DEV-34 through DEV-36 unopened until this closure is accepted.

## Dependencias para proxima fase

- próximos slices de expansão de tipos de evento além de `JOGO_LIVRE`
