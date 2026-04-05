# Slice 04 — Integração API de Eventos

## Contexto

A infraestrutura de endpoints canônicos já existe no backend (`/api/eventos/*`, `/api/partidas/{id}/lances`), mas o fluxo principal de UI ainda não os consome integralmente.

## Objetivo

Integrar no frontend os fluxos de RSVP/check-in/participants/presentes/seed/lances com preservação de compatibilidade e sem alteração de payloads.

## Escopo

- Consumir operações canônicas de evento no workspace.
- Integrar ações self e ações administrativas respeitando RBAC backend.
- Definir estratégia de refetch/sincronização para estados de evento.
- Garantir idempotência de lances no fluxo de UI.

## Fora de escopo

- Mudar contratos backend.
- Remover endpoints legados.
- Alterar semântica de status no backend.

## Arquivos/áreas impactadas

- Serviços frontend de eventos/lances.
- Ações do workspace/painéis.
- Mapeamento de estado e feedback de erro.

## Riscos

- Ações self falharem por sessão sem `jogadorId`.
- Drift entre estado local e estado real em ações concorrentes.
- Regressão de UX se polling não cobrir mudanças de participantes/lances.

## Critérios de aceite

- Fluxos RSVP e check-in funcionando para usuário elegível.
- Fluxos start/end/cancel/seed funcionando para role permitido.
- Fluxo de lances operando com idempotência preservada.

## Checklist de validação

- [ ] RSVP / cancelamento de RSVP integrado.
- [ ] Check-in self e manual integrados.
- [ ] Listagens de participantes/presentes integradas.
- [ ] Seed de partida e criação de lance integrados.
- [ ] Tratamento de erro de autorização/status validado.

## Matriz mínima de cenários

| Cenário | Expectativa |
|---|---|
| Caminho feliz | Usuário e treinador executam fluxos de evento com sucesso |
| Compatibilidade legado | Fluxos existentes de aula continuam sem quebra |
| Regressão esperada | Ação com role inválida retorna erro backend e UI trata corretamente |
| Rollback | Reverter apenas integração de ações mantendo visual/workspace |

## Mapa de endpoints canônicos usados

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

## Dependências para próxima fase

- Fluxos canônicos integrados e estáveis.
- Erros e estados intermediários mapeados na UI.
