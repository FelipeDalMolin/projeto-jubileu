# Slice 02 — Rotas de Evento

## Contexto

A navegação principal ainda é legada (`/dias/:dataIso/aulas/:aulaId`). É necessário introduzir rota canônica contextual de evento sem quebrar links existentes.

## Objetivo

Introduzir rota canônica `/dias/:dataIso/eventos/:eventoId` preservando a rota legada `/dias/:dataIso/aulas/:aulaId`.

## Escopo

- Adicionar rota canônica contextual no frontend.
- Reusar página/componente de workspace sem duplicação de lógica.
- Preservar rota legada ativa durante ciclo de compatibilidade.
- Definir comportamento de coexistência e depreciação.

## Fora de escopo

- Remover rota legada imediatamente.
- Habilitar `/eventos/:eventoId` sem suporte backend de resolução por id.
- Alterar payloads de APIs existentes.

## Arquivos/áreas impactadas

- Roteamento do frontend.
- Página de workspace (ponte entre rotas).
- Documentação de compatibilidade de rotas.

## Riscos

- Quebra de deep-link antigo.
- Ambiguidade entre rota legada e canônica no analytics/navegação.
- Dependência de endpoint backend inexistente para rota sem `dataIso`.

## Critérios de aceite

- Nova rota contextual de evento funcional.
- Rota legada preservada e funcional.
- Estratégia de coexistência documentada.

## Checklist de validação

- [ ] `/dias/:dataIso/eventos/:eventoId` renderiza workspace.
- [ ] `/dias/:dataIso/aulas/:aulaId` continua funcional.
- [ ] Navegação interna suporta ambos os caminhos.
- [ ] Documentação explicita prazo de coexistência.

## Matriz mínima de cenários

| Cenário | Expectativa |
|---|---|
| Caminho feliz | Acesso por rota canônica contextual abre workspace |
| Compatibilidade legado | Link antigo de aula abre mesma experiência |
| Regressão esperada | Divergência de parâmetros (`aulaId`/`eventoId`) detectada em QA |
| Rollback | Retomar apenas rota legada mantendo fallback intacto |

## Mapa de compatibilidade (old -> new/preservado)

- `/dias/:dataIso/aulas/:aulaId` -> **preservado**
- `/dias/:dataIso/eventos/:eventoId` -> **novo canônico contextual**
- Regra: coexistência por pelo menos um ciclo de release.

## Dependências para próxima fase

- Rota canônica contextual estabilizada.
- Sem regressão da rota legada.
