# Slice 08 - Evento Contract Alignment

## Contexto

O frontend ja possui rota canonica contextual de Evento e wrappers de compatibilidade, mas ainda mistura status/tipos de Aula com conceitos canonicos de Evento.

## Objetivo

Centralizar o contrato de Evento usado pela UI antes de novas features operacionais.

## Escopo

- Mapear status/tipos usados pela EventoPage.
- Centralizar mappers legado -> canonico.
- Revisar services de Evento, dashboard e rotas `/api`.
- Documentar compatibilidade com `/dias/:dataIso/aulas/:aulaId`.

## Fora de Escopo

- Reescrever a EventoPage.
- Remover AulaPage.
- Renomear persistencia.
- Alterar payloads backend.

## Arquivos Provaveis

- `frontend/jubileu-web/src/types/evento.ts`
- `frontend/jubileu-web/src/services/eventos/*`
- `frontend/jubileu-web/src/workspaces/evento/capabilities.ts`
- `frontend/jubileu-web/src/routes/AppRoutes.tsx`

## Riscos

- Quebrar deep-links legados.
- Criar mappers duplicados.
- Esconder divergencia real de backend.

## Criterios de Aceite

- Status/tipo de Evento passam por um ponto unico de normalizacao.
- Rota canonica e rota legada preservadas.
- Services usam `/api` quando o contrato canonico exige.

## Validacao

- `npm run lint`
- `npm run build`
- Smoke manual em `/dias/:dataIso/eventos/:eventoId` e `/dias/:dataIso/aulas/:aulaId`.

## Linear

- CORE: `CORE-3`, `CORE-4`, `CORE-6`
- DEV sugerida: `DEV-22`
- Branch sugerida: `dev-22-frontend-evento-contract-alignment`
