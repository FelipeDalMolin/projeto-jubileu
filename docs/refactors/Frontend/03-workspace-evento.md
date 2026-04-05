# Slice 03 — WorkspaceEvento Unificado

## Contexto

O frontend atual renderiza workspace centrado em Aula. A direção arquitetural exige um workspace único por Evento com comportamento condicional por tipo/capabilities.

## Objetivo

Definir e introduzir `WorkspaceEvento` único, com renderização por capabilities, preservando comportamento atual para eventos tipo AULA.

## Escopo

- Criar estrutura de capabilities por tipo/status/role.
- Centralizar decisão de render em camada única.
- Reaproveitar painéis existentes sem regressão funcional.
- Preparar separação entre regras de capability e componentes visuais.

## Fora de escopo

- Redesenho visual amplo.
- Reescrita completa dos painéis.
- Alterações de schema backend.

## Arquivos/áreas impactadas

- Página/container de workspace.
- Componentes de painéis (equipes/partidas/eventos).
- Camada de capabilities.

## Riscos

- Regressão em fluxo de aula atual.
- Ifs espalhados persistirem e invalidarem o objetivo da fase.
- Capabilities inconsistentes com RBAC/backend status gates.

## Critérios de aceite

- Workspace único por evento implementado.
- Render condicional guiado por capabilities centralizadas.
- Fluxo atual de AULA preservado sem regressão.

## Checklist de validação

- [ ] Capability registry criado e usado no container principal.
- [ ] Painéis exibidos/ocultos com base em capabilities.
- [ ] Fluxos de equipes/partidas existentes continuam funcionando.
- [ ] Regras de role/status não migram para frontend como source of truth.

## Matriz mínima de cenários

| Cenário | Expectativa |
|---|---|
| Caminho feliz | Evento tipo AULA renderiza painéis atuais corretamente |
| Compatibilidade legado | Rota legada continua abrindo o mesmo workspace |
| Regressão esperada | Capability ausente bloqueia painel indevido e gera alerta de QA |
| Rollback | Voltar container para versão anterior mantendo mapa de capabilities documentado |

## Dependências para próxima fase

- WorkspaceEvento estável com capabilities.
- Sem regressões nos painéis legados.
