# Slice 06 — User/Jogador e Sessão

## Contexto

Os fluxos self de Evento dependem de um contexto de sessão que diferencie claramente:

a identidade de acesso do usuário;
o jogador operacional associado à sessão.

No estado atual, o frontend precisa fechar essa modelagem para permitir ações como RSVP e check-in self sem depender de suposições implícitas, mantendo compatibilidade com o modo atual enquanto a transição para o modelo definitivo de autenticação ocorre.

Alinhamento com baseline arquitetural
O backend continua como source of truth de autenticação, autorização e RBAC.
O modelo-alvo oficial é JWT com Bearer token no frontend, access token em memória e refresh token seguro.
A coexistência com headers legados é temporária e existe apenas como compatibilidade.
O frontend não pode normalizar o modo legado como solução definitiva.
Nenhuma lógica crítica de permissão será implementada apenas no cliente.

## Objetivo

Consolidar a sessão do frontend com distinção explícita entre UserProfile e JogadorProfile, permitindo:

ações self de evento;
navegação coerente com contexto operacional;
transição controlada entre modo legado e modo JWT;
manutenção do fluxo atual sem regressão.

## Escopo

- Definir contrato de sessão frontend com `userId`, `role`, `jogadorId`.
- Evoluir página/contexto de usuário para seleção/vínculo operacional de jogador.
- Garantir envio consistente de autenticação para rotas protegidas.
- Mapear e documentar a estratégia de transição:
headers legados → JWT
- Diferenciar claramente:
perfil do usuário;
perfil operacional do jogador.

## Fora de escopo

- Cadastro público de usuário.
- Migração completa para JWT-only nesta fase.
- Mudanças de schema backend não necessárias ao frontend.
- Reescrita total do sistema de auth do backend.

## Arquivos/áreas impactadas

- Contexto de autenticação frontend.
- Página de usuário/perfil.
- Serviços de integração que dependem de credenciais.

## Riscos

- Sessão inconsistente (role sem jogadorId para ações self).
- Quebra de compatibilidade ao alternar modo auth.
- Elevação indevida de privilégio no frontend (deve ser bloqueada no backend).

## Critérios de aceite

- Sessão frontend distingue claramente usuário e jogador operacional.
- Ações self funcionam com autenticação compatível.
- Fluxos administrativos continuam backend-enforced via RBAC.
- Sem quebra de login/uso atual durante transição.

## Checklist de validação

- [ ] Contrato de sessão documentado e implementável.
- [ ] UserPage deixa de ser placeholder e controla contexto operacional.
- [ ] Integração com `/api/auth/*` e compatibilidade legada mapeada.
- [ ] Tentativas sem role/permissão continuam bloqueadas no backend.

## Matriz mínima de cenários

| Cenário | Expectativa |
|---|---|
| Caminho feliz | Usuário autenticado executa ações self com `jogadorId` válido |
| Compatibilidade legado | Fluxo por headers continua disponível sem quebra imediata |
| Regressão esperada | Sessão sem `jogadorId` recebe erro explícito para ações self |
| Rollback | Reverter apenas binding user/jogador mantendo auth anterior |

## Mapa de compatibilidade auth (legado -> novo/preservado)

- Legado: headers `X-User-Id`, `X-Role`, `X-Jogador-Id` -> **preservado temporariamente**
- Novo: JWT via `/api/auth/login` + `/api/auth/me` -> **introduzido**
- Estratégia: coexistência controlada até corte seguro para modo JWT-only.

## Dependências para encerramento da trilha

- Sessão operacional estabilizada em produção.
- Plano de depreciação de compatibilidade legado aprovado.
