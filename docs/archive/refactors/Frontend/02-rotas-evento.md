> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Slice 02 â€” Rotas de Evento

## Contexto

A navegaÃ§Ã£o principal ainda Ã© legada (`/dias/:dataIso/aulas/:aulaId`). Ã‰ necessÃ¡rio introduzir rota canÃ´nica contextual de evento sem quebrar links existentes.

## Objetivo

Introduzir rota canÃ´nica `/dias/:dataIso/eventos/:eventoId` preservando a rota legada `/dias/:dataIso/aulas/:aulaId`.

## Escopo

- Adicionar rota canÃ´nica contextual no frontend.
- Reusar pÃ¡gina/componente de workspace sem duplicaÃ§Ã£o de lÃ³gica.
- Preservar rota legada ativa durante ciclo de compatibilidade.
- Definir comportamento de coexistÃªncia e depreciaÃ§Ã£o.

## Fora de escopo

- Remover rota legada imediatamente.
- Habilitar `/eventos/:eventoId` sem suporte backend de resoluÃ§Ã£o por id.
- Alterar payloads de APIs existentes.

## Arquivos/Ã¡reas impactadas

- Roteamento do frontend.
- PÃ¡gina de workspace (ponte entre rotas).
- DocumentaÃ§Ã£o de compatibilidade de rotas.

## Riscos

- Quebra de deep-link antigo.
- Ambiguidade entre rota legada e canÃ´nica no analytics/navegaÃ§Ã£o.
- DependÃªncia de endpoint backend inexistente para rota sem `dataIso`.

## CritÃ©rios de aceite

- Nova rota contextual de evento funcional.
- Rota legada preservada e funcional.
- EstratÃ©gia de coexistÃªncia documentada.

## Checklist de validaÃ§Ã£o

- [ ] `/dias/:dataIso/eventos/:eventoId` renderiza workspace.
- [ ] `/dias/:dataIso/aulas/:aulaId` continua funcional.
- [ ] NavegaÃ§Ã£o interna suporta ambos os caminhos.
- [ ] DocumentaÃ§Ã£o explicita prazo de coexistÃªncia.

## Matriz mÃ­nima de cenÃ¡rios

| CenÃ¡rio | Expectativa |
|---|---|
| Caminho feliz | Acesso por rota canÃ´nica contextual abre workspace |
| Compatibilidade legado | Link antigo de aula abre mesma experiÃªncia |
| RegressÃ£o esperada | DivergÃªncia de parÃ¢metros (`aulaId`/`eventoId`) detectada em QA |
| Rollback | Retomar apenas rota legada mantendo fallback intacto |

## Mapa de compatibilidade (old -> new/preservado)

- `/dias/:dataIso/aulas/:aulaId` -> **preservado**
- `/dias/:dataIso/eventos/:eventoId` -> **novo canÃ´nico contextual**
- Regra: coexistÃªncia por pelo menos um ciclo de release.

## DependÃªncias para prÃ³xima fase

- Rota canÃ´nica contextual estabilizada.
- Sem regressÃ£o da rota legada.
