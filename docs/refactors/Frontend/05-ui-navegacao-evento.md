# Slice 05 — UI e Navegação de Evento

## Contexto

Slice 05 — UI e Navegação de Evento
Contexto

Após a introdução da rota canônica contextual de evento e da integração com os endpoints canônicos de /api/eventos/*, a navegação e a estrutura visual do frontend devem passar a refletir Evento como unidade operacional principal, mantendo a convivência temporária com o fluxo legado baseado em Aula.

Este slice não redefine o domínio nem altera contratos de backend. Ele reorganiza a experiência de navegação, os pontos de entrada e a leitura visual do estado para que o usuário entenda claramente que está operando um Evento, ainda que a persistência e parte do legado permaneçam baseados em Aula.

Alinhamento com baseline arquitetural
/api permanece o prefixo obrigatório de integração frontend/backend.
Backend continua sendo source of truth para RBAC, status e permissões.
A persistência não será renomeada nesta fase.
Rotas legadas permanecem disponíveis durante a transição.
A fase deve respeitar a diretriz arquitetural oficial de UI, incluindo evolução progressiva para design system consistente.

Após a introdução da rota canônica contextual de evento e da integração com os endpoints canônicos de /api/eventos/*, a navegação e a estrutura visual do frontend devem passar a refletir Evento como unidade operacional principal, mantendo a convivência temporária com o fluxo legado baseado em Aula.

Este slice não redefine o domínio nem altera contratos de backend. Ele reorganiza a experiência de navegação, os pontos de entrada e a leitura visual do estado para que o usuário entenda claramente que está operando um Evento, ainda que a persistência e parte do legado permaneçam baseados em Aula.

## Objetivo

Ajustar a navegação e a estrutura visual do frontend para:

priorizar a jornada orientada a Evento;
tornar visíveis tipo, status e ações do evento com clareza;
melhorar os pontos de entrada a partir de Dias;
manter acessível o legado durante o período de coexistência.

## Escopo

Atualizar a navegação principal para destacar a jornada de eventos.
Ajustar pontos de entrada em páginas de Dia para abrir o workspace do Evento.
Melhorar a sinalização visual de:
tipo do evento;
status do evento;
ações permitidas conforme contexto.
Introduzir componentes base de estado visual:
loading;
empty state;
error state;
badges de status/tipo.
Preservar acesso a fluxos legados durante o período de convivência.

## Fora de escopo

Atualizar a navegação principal para destacar a jornada de eventos.
Ajustar pontos de entrada em páginas de Dia para abrir o workspace do Evento.
Melhorar a sinalização visual de:
tipo do evento;
status do evento;
ações permitidas conforme contexto.
Introduzir componentes base de estado visual:
loading;
empty state;
error state;
badges de status/tipo.
Preservar acesso a fluxos legados durante o período de convivência.

## Arquivos/áreas impactadas

- Navbar e rotas de navegação.
- Páginas de lista/contexto (dias/eventos).
- Elementos de estado e ações contextuais.

## Riscos

- Confusão de UX com caminhos duplicados.
- Aumento de suporte por mudança de nomenclatura sem onboarding.
- Quebra de atalhos/bookmarks legados.

## Critérios de aceite

- Navegação principal evidencia fluxo por Evento.
- Usuário abre evento a partir do contexto de Dia com clareza.
- Legado permanece acessível durante transição.

## Checklist de validação

- [ ]  Navbar atualizada com jornada orientada a Evento.

- [ ]  Há CTA de abertura de Evento em páginas de Dia.

- [ ]  Estado e tipo do evento são exibidos de forma consistente.

- [ ]  Há loading, erro e empty state nas telas impactadas.

- [ ]  Links legados continuam funcionais.

- [ ]  O workspace não fica semanticamente preso a “Aula” na navegação principal.

## Matriz mínima de cenários

| Cenário | Expectativa |
|---|---|
| Caminho feliz | Usuário entra por Dia e navega até Evento sem ambiguidade |
| Compatibilidade legado | Link antigo continua abrindo conteúdo equivalente |
| Regressão esperada | Link de navegação canônico falha e fallback legado cobre caminho |
| Rollback | Reverter apenas camada de navegação mantendo rotas e integração |

## Dependências para próxima fase

- Navegação canônica estabilizada.
- Métricas de uso e suporte para validar remoção futura de legado.
