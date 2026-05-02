# Slice 08 - Auth Session Operational Hardening

## Contexto

O backend possui JWT e modo compativel, mas o fluxo operacional `user + jogador` precisa ficar confiavel para RSVP/check-in e acoes self.

## Objetivo

Endurecer contratos de auth/session sem remover compatibilidade antes da migracao completa.

## Escopo

- Revisar `/api/auth/login` e `/api/auth/me`.
- Definir contrato minimo de usuario atual, role e `jogadorId`.
- Garantir que RBAC continue backend-enforced.
- Documentar modo legado e condicoes de remocao futura.

## Fora de Escopo

- Criar registro publico.
- Remover auth legado imediatamente.
- Mover autorizacao para frontend.
- Renomear entidades de dominio.

## Arquivos Provaveis

- `backend/jubileu-api-fastapi/app/modules/auth/*`
- `backend/jubileu-api-fastapi/app/deps_auth.py`
- `backend/jubileu-api-fastapi/tests/test_auth_jwt_rbac.py`

## Riscos

- Quebrar desenvolvimento local baseado em headers legados.
- Deixar self actions sem jogador operacional.
- Mascarar erro de token expirado como fallback silencioso.

## Criterios de Aceite

- Login e `/me` documentados.
- RBAC preservado.
- Modo legado explicitamente documentado.
- Nenhum fluxo publico de registro introduzido.

## Validacao

- `pytest tests/test_auth_jwt_rbac.py`
- Smoke de rotas protegidas.
- Revisao de impacto frontend.

## Linear

- CORE: `CORE-5`
- DEV sugerida: `DEV-26`
- Branch sugerida: `dev-26-backend-auth-session-hardening`
