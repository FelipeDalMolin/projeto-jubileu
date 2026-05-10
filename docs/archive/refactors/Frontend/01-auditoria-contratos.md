> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Slice 01 â€” Auditoria de Contratos

## Contexto

O frontend estÃ¡ em transiÃ§Ã£o entre modelo legado (`Dia -> Aula`) e modelo canÃ´nico (`Dia -> Evento`). Antes de alterar navegaÃ§Ã£o e workspace, Ã© necessÃ¡rio congelar contratos e eliminar bloqueios de integraÃ§Ã£o.

## Objetivo

Validar e documentar contratos atuais frontend/backend para eventos, com foco em proxy `/api`, tipos canÃ´nicos e compatibilidade de autenticaÃ§Ã£o.

## Escopo

- Auditar chamadas frontend para `/api/eventos/*` e `/api/partidas/{id}/lances`.
- Validar configuraÃ§Ã£o de proxy em dev para nÃ£o remover indevidamente `/api`.
- Alinhar tipos de `EventoTipo` e `EventoStatus` do frontend aos canÃ´nicos do backend.
- Consolidar baseline de contratos em documento tÃ©cnico.

## Fora de escopo

- Criar novas rotas de pÃ¡gina.
- Alterar layout de workspace.
- Implementar fluxo novo de autenticaÃ§Ã£o.

## Arquivos/Ã¡reas impactadas

- Tipos e serviÃ§os de evento no frontend.
- ConfiguraÃ§Ã£o de proxy do frontend.
- DocumentaÃ§Ã£o da trilha de refactor.

## Riscos

- Manter proxy com rewrite incorreto e gerar 404 em `/api/eventos/*`.
- Persistir mismatch de tipos/status e causar bugs de render/aÃ§Ã£o.
- Fechar baseline incompleto e bloquear fases seguintes.

## CritÃ©rios de aceite

- Contratos de endpoints de evento e lances documentados e validados.
- Tipos frontend refletindo nomenclatura canÃ´nica do backend.
- Proxy de dev sem quebra de `/api/eventos/*`.

## Checklist de validaÃ§Ã£o

- [ ] Endpoints de evento listados e confirmados.
- [ ] Endpoints de lances listados e confirmados.
- [ ] Mapeamento de status/tipo frontend vs backend revisado.
- [ ] Comportamento do proxy em dev validado.

## Matriz mÃ­nima de cenÃ¡rios

| CenÃ¡rio | Expectativa |
|---|---|
| Caminho feliz | Frontend chama endpoint canÃ´nico `/api/eventos/*` sem rewrite indevido |
| Compatibilidade legado | Fluxos existentes nÃ£o sÃ£o afetados por mudanÃ§as de tipos/documentaÃ§Ã£o |
| RegressÃ£o esperada | Detectar mismatch de status e registrar ajuste obrigatÃ³rio |
| Rollback | Reverter apenas ajustes de tipagem/proxy mantendo baseline documentado |

## DependÃªncias para prÃ³xima fase

- Baseline de contratos fechado e versionado.
- Bloqueio de proxy eliminado.
