> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Slice 05 â€” UI e NavegaÃ§Ã£o de Evento

## Contexto

Slice 05 â€” UI e NavegaÃ§Ã£o de Evento
Contexto

ApÃ³s a introduÃ§Ã£o da rota canÃ´nica contextual de evento e da integraÃ§Ã£o com os endpoints canÃ´nicos de /api/eventos/*, a navegaÃ§Ã£o e a estrutura visual do frontend devem passar a refletir Evento como unidade operacional principal, mantendo a convivÃªncia temporÃ¡ria com o fluxo legado baseado em Aula.

Este slice nÃ£o redefine o domÃ­nio nem altera contratos de backend. Ele reorganiza a experiÃªncia de navegaÃ§Ã£o, os pontos de entrada e a leitura visual do estado para que o usuÃ¡rio entenda claramente que estÃ¡ operando um Evento, ainda que a persistÃªncia e parte do legado permaneÃ§am baseados em Aula.

Alinhamento com baseline arquitetural
/api permanece o prefixo obrigatÃ³rio de integraÃ§Ã£o frontend/backend.
Backend continua sendo source of truth para RBAC, status e permissÃµes.
A persistÃªncia nÃ£o serÃ¡ renomeada nesta fase.
Rotas legadas permanecem disponÃ­veis durante a transiÃ§Ã£o.
A fase deve respeitar a diretriz arquitetural oficial de UI, incluindo evoluÃ§Ã£o progressiva para design system consistente.

ApÃ³s a introduÃ§Ã£o da rota canÃ´nica contextual de evento e da integraÃ§Ã£o com os endpoints canÃ´nicos de /api/eventos/*, a navegaÃ§Ã£o e a estrutura visual do frontend devem passar a refletir Evento como unidade operacional principal, mantendo a convivÃªncia temporÃ¡ria com o fluxo legado baseado em Aula.

Este slice nÃ£o redefine o domÃ­nio nem altera contratos de backend. Ele reorganiza a experiÃªncia de navegaÃ§Ã£o, os pontos de entrada e a leitura visual do estado para que o usuÃ¡rio entenda claramente que estÃ¡ operando um Evento, ainda que a persistÃªncia e parte do legado permaneÃ§am baseados em Aula.

## Objetivo

Ajustar a navegaÃ§Ã£o e a estrutura visual do frontend para:

priorizar a jornada orientada a Evento;
tornar visÃ­veis tipo, status e aÃ§Ãµes do evento com clareza;
melhorar os pontos de entrada a partir de Dias;
manter acessÃ­vel o legado durante o perÃ­odo de coexistÃªncia.

## Escopo

Atualizar a navegaÃ§Ã£o principal para destacar a jornada de eventos.
Ajustar pontos de entrada em pÃ¡ginas de Dia para abrir o workspace do Evento.
Melhorar a sinalizaÃ§Ã£o visual de:
tipo do evento;
status do evento;
aÃ§Ãµes permitidas conforme contexto.
Introduzir componentes base de estado visual:
loading;
empty state;
error state;
badges de status/tipo.
Preservar acesso a fluxos legados durante o perÃ­odo de convivÃªncia.

## Fora de escopo

Atualizar a navegaÃ§Ã£o principal para destacar a jornada de eventos.
Ajustar pontos de entrada em pÃ¡ginas de Dia para abrir o workspace do Evento.
Melhorar a sinalizaÃ§Ã£o visual de:
tipo do evento;
status do evento;
aÃ§Ãµes permitidas conforme contexto.
Introduzir componentes base de estado visual:
loading;
empty state;
error state;
badges de status/tipo.
Preservar acesso a fluxos legados durante o perÃ­odo de convivÃªncia.

## Arquivos/Ã¡reas impactadas

- Navbar e rotas de navegaÃ§Ã£o.
- PÃ¡ginas de lista/contexto (dias/eventos).
- Elementos de estado e aÃ§Ãµes contextuais.

## Riscos

- ConfusÃ£o de UX com caminhos duplicados.
- Aumento de suporte por mudanÃ§a de nomenclatura sem onboarding.
- Quebra de atalhos/bookmarks legados.

## CritÃ©rios de aceite

- NavegaÃ§Ã£o principal evidencia fluxo por Evento.
- UsuÃ¡rio abre evento a partir do contexto de Dia com clareza.
- Legado permanece acessÃ­vel durante transiÃ§Ã£o.

## Checklist de validaÃ§Ã£o

- [ ]  Navbar atualizada com jornada orientada a Evento.

- [ ]  HÃ¡ CTA de abertura de Evento em pÃ¡ginas de Dia.

- [ ]  Estado e tipo do evento sÃ£o exibidos de forma consistente.

- [ ]  HÃ¡ loading, erro e empty state nas telas impactadas.

- [ ]  Links legados continuam funcionais.

- [ ]  O workspace nÃ£o fica semanticamente preso a â€œAulaâ€ na navegaÃ§Ã£o principal.

## Matriz mÃ­nima de cenÃ¡rios

| CenÃ¡rio | Expectativa |
|---|---|
| Caminho feliz | UsuÃ¡rio entra por Dia e navega atÃ© Evento sem ambiguidade |
| Compatibilidade legado | Link antigo continua abrindo conteÃºdo equivalente |
| RegressÃ£o esperada | Link de navegaÃ§Ã£o canÃ´nico falha e fallback legado cobre caminho |
| Rollback | Reverter apenas camada de navegaÃ§Ã£o mantendo rotas e integraÃ§Ã£o |

## DependÃªncias para prÃ³xima fase

- NavegaÃ§Ã£o canÃ´nica estabilizada.
- MÃ©tricas de uso e suporte para validar remoÃ§Ã£o futura de legado.
