> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Slice 06 â€” User/Jogador e SessÃ£o

## Contexto

Os fluxos self de Evento dependem de um contexto de sessÃ£o que diferencie claramente:

a identidade de acesso do usuÃ¡rio;
o jogador operacional associado Ã  sessÃ£o.

No estado atual, o frontend precisa fechar essa modelagem para permitir aÃ§Ãµes como RSVP e check-in self sem depender de suposiÃ§Ãµes implÃ­citas, mantendo compatibilidade com o modo atual enquanto a transiÃ§Ã£o para o modelo definitivo de autenticaÃ§Ã£o ocorre.

Alinhamento com baseline arquitetural
O backend continua como source of truth de autenticaÃ§Ã£o, autorizaÃ§Ã£o e RBAC.
O modelo-alvo oficial Ã© JWT com Bearer token no frontend, access token em memÃ³ria e refresh token seguro.
A coexistÃªncia com headers legados Ã© temporÃ¡ria e existe apenas como compatibilidade.
O frontend nÃ£o pode normalizar o modo legado como soluÃ§Ã£o definitiva.
Nenhuma lÃ³gica crÃ­tica de permissÃ£o serÃ¡ implementada apenas no cliente.

## Objetivo

Consolidar a sessÃ£o do frontend com distinÃ§Ã£o explÃ­cita entre UserProfile e JogadorProfile, permitindo:

aÃ§Ãµes self de evento;
navegaÃ§Ã£o coerente com contexto operacional;
transiÃ§Ã£o controlada entre modo legado e modo JWT;
manutenÃ§Ã£o do fluxo atual sem regressÃ£o.

## Escopo

- Definir contrato de sessÃ£o frontend com `userId`, `role`, `jogadorId`.
- Evoluir pÃ¡gina/contexto de usuÃ¡rio para seleÃ§Ã£o/vÃ­nculo operacional de jogador.
- Garantir envio consistente de autenticaÃ§Ã£o para rotas protegidas.
- Mapear e documentar a estratÃ©gia de transiÃ§Ã£o:
headers legados â†’ JWT
- Diferenciar claramente:
perfil do usuÃ¡rio;
perfil operacional do jogador.

## Fora de escopo

- Cadastro pÃºblico de usuÃ¡rio.
- MigraÃ§Ã£o completa para JWT-only nesta fase.
- MudanÃ§as de schema backend nÃ£o necessÃ¡rias ao frontend.
- Reescrita total do sistema de auth do backend.

## Arquivos/Ã¡reas impactadas

- Contexto de autenticaÃ§Ã£o frontend.
- PÃ¡gina de usuÃ¡rio/perfil.
- ServiÃ§os de integraÃ§Ã£o que dependem de credenciais.

## Riscos

- SessÃ£o inconsistente (role sem jogadorId para aÃ§Ãµes self).
- Quebra de compatibilidade ao alternar modo auth.
- ElevaÃ§Ã£o indevida de privilÃ©gio no frontend (deve ser bloqueada no backend).

## CritÃ©rios de aceite

- SessÃ£o frontend distingue claramente usuÃ¡rio e jogador operacional.
- AÃ§Ãµes self funcionam com autenticaÃ§Ã£o compatÃ­vel.
- Fluxos administrativos continuam backend-enforced via RBAC.
- Sem quebra de login/uso atual durante transiÃ§Ã£o.

## Checklist de validaÃ§Ã£o

- [ ] Contrato de sessÃ£o documentado e implementÃ¡vel.
- [ ] UserPage deixa de ser placeholder e controla contexto operacional.
- [ ] IntegraÃ§Ã£o com `/api/auth/*` e compatibilidade legada mapeada.
- [ ] Tentativas sem role/permissÃ£o continuam bloqueadas no backend.

## Matriz mÃ­nima de cenÃ¡rios

| CenÃ¡rio | Expectativa |
|---|---|
| Caminho feliz | UsuÃ¡rio autenticado executa aÃ§Ãµes self com `jogadorId` vÃ¡lido |
| Compatibilidade legado | Fluxo por headers continua disponÃ­vel sem quebra imediata |
| RegressÃ£o esperada | SessÃ£o sem `jogadorId` recebe erro explÃ­cito para aÃ§Ãµes self |
| Rollback | Reverter apenas binding user/jogador mantendo auth anterior |

## Mapa de compatibilidade auth (legado -> novo/preservado)

- Legado: headers `X-User-Id`, `X-Role`, `X-Jogador-Id` -> **preservado temporariamente**
- Novo: JWT via `/api/auth/login` + `/api/auth/me` -> **introduzido**
- EstratÃ©gia: coexistÃªncia controlada atÃ© corte seguro para modo JWT-only.

## DependÃªncias para encerramento da trilha

- SessÃ£o operacional estabilizada em produÃ§Ã£o.
- Plano de depreciaÃ§Ã£o de compatibilidade legado aprovado.
