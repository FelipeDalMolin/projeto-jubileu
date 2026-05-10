> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Slice 04 â€” IntegraÃ§Ã£o API de Eventos

## Contexto

A infraestrutura de endpoints canÃ´nicos jÃ¡ existe no backend (`/api/eventos/*`, `/api/partidas/{id}/lances`), mas o fluxo principal de UI ainda nÃ£o os consome integralmente.

## Objetivo

Integrar no frontend os fluxos de RSVP/check-in/participants/presentes/seed/lances com preservaÃ§Ã£o de compatibilidade e sem alteraÃ§Ã£o de payloads.

## Escopo

- Consumir operaÃ§Ãµes canÃ´nicas de evento no workspace.
- Integrar aÃ§Ãµes self e aÃ§Ãµes administrativas respeitando RBAC backend.
- Definir estratÃ©gia de refetch/sincronizaÃ§Ã£o para estados de evento.
- Garantir idempotÃªncia de lances no fluxo de UI.

## Fora de escopo

- Mudar contratos backend.
- Remover endpoints legados.
- Alterar semÃ¢ntica de status no backend.

## Arquivos/Ã¡reas impactadas

- ServiÃ§os frontend de eventos/lances.
- AÃ§Ãµes do workspace/painÃ©is.
- Mapeamento de estado e feedback de erro.

## Riscos

- AÃ§Ãµes self falharem por sessÃ£o sem `jogadorId`.
- Drift entre estado local e estado real em aÃ§Ãµes concorrentes.
- RegressÃ£o de UX se polling nÃ£o cobrir mudanÃ§as de participantes/lances.

## CritÃ©rios de aceite

- Fluxos RSVP e check-in funcionando para usuÃ¡rio elegÃ­vel.
- Fluxos start/end/cancel/seed funcionando para role permitido.
- Fluxo de lances operando com idempotÃªncia preservada.

## Checklist de validaÃ§Ã£o

- [ ] RSVP / cancelamento de RSVP integrado.
- [ ] Check-in self e manual integrados.
- [ ] Listagens de participantes/presentes integradas.
- [ ] Seed de partida e criaÃ§Ã£o de lance integrados.
- [ ] Tratamento de erro de autorizaÃ§Ã£o/status validado.

## Matriz mÃ­nima de cenÃ¡rios

| CenÃ¡rio | Expectativa |
|---|---|
| Caminho feliz | UsuÃ¡rio e treinador executam fluxos de evento com sucesso |
| Compatibilidade legado | Fluxos existentes de aula continuam sem quebra |
| RegressÃ£o esperada | AÃ§Ã£o com role invÃ¡lida retorna erro backend e UI trata corretamente |
| Rollback | Reverter apenas integraÃ§Ã£o de aÃ§Ãµes mantendo visual/workspace |

## Mapa de endpoints canÃ´nicos usados

- `/api/eventos/{eventoId}/rsvp`
- `/api/eventos/{eventoId}/checkin`
- `/api/eventos/{eventoId}/participants/{jogadorId}/checkin`
- `/api/eventos/{eventoId}/participants`
- `/api/eventos/{eventoId}/presentes`
- `/api/eventos/{eventoId}/start`
- `/api/eventos/{eventoId}/end`
- `/api/eventos/{eventoId}/cancel`
- `/api/eventos/{eventoId}/partidas/seed`
- `/api/partidas/{partidaId}/lances`

## DependÃªncias para prÃ³xima fase

- Fluxos canÃ´nicos integrados e estÃ¡veis.
- Erros e estados intermediÃ¡rios mapeados na UI.
