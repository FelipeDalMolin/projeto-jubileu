# Slice 01 — Auditoria de Contratos

## Contexto

O frontend está em transição entre modelo legado (`Dia -> Aula`) e modelo canônico (`Dia -> Evento`). Antes de alterar navegação e workspace, é necessário congelar contratos e eliminar bloqueios de integração.

## Objetivo

Validar e documentar contratos atuais frontend/backend para eventos, com foco em proxy `/api`, tipos canônicos e compatibilidade de autenticação.

## Escopo

- Auditar chamadas frontend para `/api/eventos/*` e `/api/partidas/{id}/lances`.
- Validar configuração de proxy em dev para não remover indevidamente `/api`.
- Alinhar tipos de `EventoTipo` e `EventoStatus` do frontend aos canônicos do backend.
- Consolidar baseline de contratos em documento técnico.

## Fora de escopo

- Criar novas rotas de página.
- Alterar layout de workspace.
- Implementar fluxo novo de autenticação.

## Arquivos/áreas impactadas

- Tipos e serviços de evento no frontend.
- Configuração de proxy do frontend.
- Documentação da trilha de refactor.

## Riscos

- Manter proxy com rewrite incorreto e gerar 404 em `/api/eventos/*`.
- Persistir mismatch de tipos/status e causar bugs de render/ação.
- Fechar baseline incompleto e bloquear fases seguintes.

## Critérios de aceite

- Contratos de endpoints de evento e lances documentados e validados.
- Tipos frontend refletindo nomenclatura canônica do backend.
- Proxy de dev sem quebra de `/api/eventos/*`.

## Checklist de validação

- [ ] Endpoints de evento listados e confirmados.
- [ ] Endpoints de lances listados e confirmados.
- [ ] Mapeamento de status/tipo frontend vs backend revisado.
- [ ] Comportamento do proxy em dev validado.

## Matriz mínima de cenários

| Cenário | Expectativa |
|---|---|
| Caminho feliz | Frontend chama endpoint canônico `/api/eventos/*` sem rewrite indevido |
| Compatibilidade legado | Fluxos existentes não são afetados por mudanças de tipos/documentação |
| Regressão esperada | Detectar mismatch de status e registrar ajuste obrigatório |
| Rollback | Reverter apenas ajustes de tipagem/proxy mantendo baseline documentado |

## Dependências para próxima fase

- Baseline de contratos fechado e versionado.
- Bloqueio de proxy eliminado.
