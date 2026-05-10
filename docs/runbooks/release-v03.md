# Runbook - Release v0.3.x

## Objetivo

Publicar `v0.3.0` apenas depois de validar Evento canonico, Usuario, auth, polling, UI Tailwind-only, CI e smoke via gateway.

## Ordem

1. Fechar PR documental de organizacao e planejamento.
2. Reconciliar Linear/GitHub.
3. Executar Slice 02: PostgreSQL migration gate.
4. Executar slices de backend/frontend/usuario.
5. Executar hardening de UI, auth, polling e CI.
6. Rodar smoke integrado via NGINX.
7. Atualizar `docs/current/RELEASES.md`.
8. Criar tag `v0.3.0`.

## Gate Minimo

```powershell
cd backend\jubileu-api-fastapi
python -m pytest
alembic upgrade head

cd ..\..\frontend\jubileu-web
npm ci
npm run lint
npm run build
```

## Smoke Manual

- login;
- `/api/auth/me`;
- `/api/usuarios/me`;
- evento `AULA`: planejado, iniciado, encerrado;
- evento `JOGO_LIVRE`: RSVP, check-in, fila, seed, partida ativa e lance;
- dashboard principal;
- usuario com historico de eventos.
