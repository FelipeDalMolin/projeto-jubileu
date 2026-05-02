# Slice 12 - User/Jogador Operational Session

## Contexto

Fluxos self de Evento dependem de diferenciar usuario autenticado, papel e jogador vinculado.

## Objetivo

Consolidar uma sessao operacional clara para `UserProfile` e `JogadorProfile`.

## Escopo

- Expor claramente `role`, `userId`, `jogadorId` e modo de auth.
- Impedir acoes self quando `jogadorId` for ausente.
- Tornar fallback legado explicito na UI.
- Alinhar frontend com `/api/auth/login` e `/api/auth/me`.

## Fora de Escopo

- Registro publico.
- Remover compatibilidade legacy headers.
- Mudar RBAC backend.

## Arquivos Provaveis

- `frontend/jubileu-web/src/context/AuthContext.tsx`
- `frontend/jubileu-web/src/pages/LoginPage.tsx`
- `frontend/jubileu-web/src/pages/UsuarioPerfil.tsx`
- `frontend/jubileu-web/src/services/authService.ts`

## Riscos

- Quebrar login local de desenvolvimento.
- Mascarar falha real de auth.
- Permitir acao self com jogador incorreto.

## Criterios de Aceite

- Sessao mostra role e jogador operacional.
- Acoes self exigem jogador quando necessario.
- Erro de token expirado e modo legado sao visiveis.
- Backend segue como fonte de verdade de autorizacao.

## Validacao

- `npm run lint`
- `npm run build`
- Smoke de login, `/me`, perfil, RSVP/check-in bloqueado e permitido.

## Linear

- CORE: `CORE-5`
- DEV sugerida: `DEV-26`
- Branch sugerida: `dev-26-frontend-user-jogador-session`
