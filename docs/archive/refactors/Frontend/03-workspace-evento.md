> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Slice 03 â€” WorkspaceEvento Unificado

## Contexto

O frontend atual renderiza workspace centrado em Aula. A direÃ§Ã£o arquitetural exige um workspace Ãºnico por Evento com comportamento condicional por tipo/capabilities.

## Objetivo

Definir e introduzir `WorkspaceEvento` Ãºnico, com renderizaÃ§Ã£o por capabilities, preservando comportamento atual para eventos tipo AULA.

## Escopo

- Criar estrutura de capabilities por tipo/status/role.
- Centralizar decisÃ£o de render em camada Ãºnica.
- Reaproveitar painÃ©is existentes sem regressÃ£o funcional.
- Preparar separaÃ§Ã£o entre regras de capability e componentes visuais.

## Fora de escopo

- Redesenho visual amplo.
- Reescrita completa dos painÃ©is.
- AlteraÃ§Ãµes de schema backend.

## Arquivos/Ã¡reas impactadas

- PÃ¡gina/container de workspace.
- Componentes de painÃ©is (equipes/partidas/eventos).
- Camada de capabilities.

## Riscos

- RegressÃ£o em fluxo de aula atual.
- Ifs espalhados persistirem e invalidarem o objetivo da fase.
- Capabilities inconsistentes com RBAC/backend status gates.

## CritÃ©rios de aceite

- Workspace Ãºnico por evento implementado.
- Render condicional guiado por capabilities centralizadas.
- Fluxo atual de AULA preservado sem regressÃ£o.

## Checklist de validaÃ§Ã£o

- [ ] Capability registry criado e usado no container principal.
- [ ] PainÃ©is exibidos/ocultos com base em capabilities.
- [ ] Fluxos de equipes/partidas existentes continuam funcionando.
- [ ] Regras de role/status nÃ£o migram para frontend como source of truth.

## Matriz mÃ­nima de cenÃ¡rios

| CenÃ¡rio | Expectativa |
|---|---|
| Caminho feliz | Evento tipo AULA renderiza painÃ©is atuais corretamente |
| Compatibilidade legado | Rota legada continua abrindo o mesmo workspace |
| RegressÃ£o esperada | Capability ausente bloqueia painel indevido e gera alerta de QA |
| Rollback | Voltar container para versÃ£o anterior mantendo mapa de capabilities documentado |

## DependÃªncias para prÃ³xima fase

- WorkspaceEvento estÃ¡vel com capabilities.
- Sem regressÃµes nos painÃ©is legados.
