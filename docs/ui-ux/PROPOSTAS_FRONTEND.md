# Propostas de Evolução UX/UI - Frontend Jubileu

## 1. Objetivo

Consolidar a direção de UX/UI do frontend React + Vite + TypeScript para que a
tela `/dias` evolua de uma agenda/lista de dias para um calendário operacional
evento-cêntrico.

A decisão de domínio é:

- Dia é contexto e agregador.
- Evento é a unidade operacional clicável.
- Partida é uma etapa interna do evento.

Esta documentação não propõe alteração de backend nesta rodada, não altera
contratos reais de API, não remove rotas existentes e não exige instalar
Tailwind, shadcn/ui ou qualquer dependência visual agora.

## 2. Diagnóstico da tela atual

O frontend atual usa React, Vite, TypeScript, React Router e `date-fns`. A rota
principal de agenda está em `/dias`, com detalhe em `/dias/:dataIso` e workspace
operacional atual em `/dias/:dataIso/aulas/:aulaId`.

Estado observado:

- `/dias` funciona como calendário mensal com lista de dias que possuem aulas ou
  eventos.
- `/dias/:dataIso` mostra o dia como contexto e lista as aulas/eventos daquele
  dia.
- `/dias/:dataIso/aulas/:aulaId` concentra presença, equipes, partidas, placar e
  súmula em uma tela operacional grande.
- A linguagem visual ainda usa "aula" com frequência, mas os tipos já indicam
  uma transição para evento.
- A stack visual alvo deve convergir para componentes reutilizáveis compatíveis
  com shadcn/ui + Tailwind, sem instalar essas ferramentas nesta etapa.

## 3. Ajuste de linguagem de domínio

### Dia

Dia deve ser tratado como contexto/agregador. Ele responde perguntas como:

- O que acontece nesta data?
- Quais eventos existem neste dia?
- Como está a ocupação de quadras e horários?
- Quais eventos exigem ação do usuário?

### Evento

Evento deve ser a unidade operacional clicável. Ele representa uma aula, jogo
livre, treino, amistoso ou outro acontecimento com horário, status, quadra,
capacidade, participantes e permissões de ação.

Visualmente, o usuário deve navegar para o evento, não apenas para o dia.

### Partida

Partida é etapa interna do evento. Ela não deve ser a unidade principal do
calendário. Partidas aparecem dentro do workspace operacional do evento.

## 4. Fluxo de navegação

### Fluxo atual preservado

```text
/dias
  -> /dias/:dataIso
  -> /dias/:dataIso/aulas/:aulaId
```

A rota `/dias/:dataIso/aulas/:aulaId` deve continuar funcionando como
compatibilidade/legado.

### Fluxo alvo

```text
/dias
  -> calendário mensal com indicadores de eventos

/dias/:dataIso
  -> detalhe do dia com lista/agenda de eventos

/dias/:dataIso/eventos/:eventoId
  -> workspace do evento

/dias/:dataIso/aulas/:aulaId
  -> rota legada preservada, renderizando ou redirecionando futuramente para o
     mesmo WorkspaceEvento
```

A nova rota `/dias/:dataIso/eventos/:eventoId` é alvo futuro. Ela não deve ser
implementada agora se exigir refatoração estrutural.

## 5. `/dias` como calendário operacional

A página `/dias` deve passar a combinar:

- Calendário operacional mensal.
- Painel de eventos do mês ou do dia selecionado.
- Filtros operacionais.
- Resumo de ocupação de quadras/horários.
- Ações rápidas de participação.

O título visual recomendado para a página é "Calendário".

## 6. Event dots no calendário

Cada célula de dia deve mostrar:

- Número do dia no topo.
- Até 3 ou 4 dots de eventos abaixo do número.
- Contador `+N` quando houver mais eventos que o limite visual.
- Tooltip ou `aria-label` com título, horário, quadra e tipo do evento.

Exemplo conceitual:

```text
Dia 12
● evento em que estou inscrito
○ evento sem minha inscrição
◌ evento encerrado/cancelado
+2
```

### Regras visuais

- Dot `filled` (`●`): evento com minha participação/intenção, como `RSVP`,
  `CHECKED_IN` ou participação equivalente.
- Dot `outline` (`○`): evento existente sem minha presença/intenção.
- Dot `muted` (`◌`): evento cancelado, encerrado ou indisponível.
- `+N`: existem mais eventos no mesmo dia além dos dots exibidos.

O clique no dot deve navegar para o evento. Enquanto a rota canônica de evento
não existir, a implementação futura deve preservar o fluxo atual e navegar para
o detalhe compatível disponível.

## 7. Cards e painel de eventos

O painel de eventos deve mostrar melhor:

- Eventos por dia.
- Tipo do evento.
- Horários.
- Quadras.
- Status.
- Capacidade.
- Minha participação.
- Possibilidade de inscrição.

Cada card de evento deve ter:

- Título.
- Tipo.
- Horário de início e fim.
- Quadra.
- Status.
- Capacidade e contadores.
- Badge de minha participação.
- CTA principal: "Abrir evento" ou "Abrir gestão".
- CTA secundário para jogo livre, quando permitido: "Inscrever-se", "Cancelar
  inscrição" ou "Check-in".

## 8. Filtros propostos

A tela `/dias` deve preparar filtros para:

- Tipo de evento.
- Status.
- Quadra.
- Turma.
- Minha participação.
- Inscrição aberta, lotada ou encerrada.
- Faixa de horário.

Na primeira fatia, esses filtros podem ser visuais/documentais ou aplicados
apenas sobre dados mockados, sem alterar contratos de API.

## 9. Uso de quadras e horários

A tela deve preparar uma visualização de uso de quadras/horários.

Primeira versão recomendada:

- `CourtUsageSummary` com resumo por quadra.
- Indicadores de horários ocupados, livres, lotados ou encerrados.
- Sem cálculo complexo e sem dependência de endpoint novo nesta etapa.

Versão futura:

- Grade por quadra x faixa horária.
- Destaque de conflitos de horário.
- Filtro por quadra e tipo de evento.
- Integração com endpoint de calendário.

## 10. Regras UX de participação

### JOGO_LIVRE

- "Inscrever-se" representa RSVP.
- RSVP não significa presença confirmada no local.
- Check-in é uma ação separada.
- Check-in deve ser usado quando o evento está em andamento.
- Apenas `CHECKED_IN` deve entrar futuramente como disponível para montagem de
  times.

### AULA

- Não assumir RSVP público para usuário comum nesta fase.
- Presença de aula continua sendo controlada por treinador/admin.
- Uma mudança para RSVP em aula deve ser decisão futura explícita.

## 11. Contratos futuros recomendados

Estes endpoints são dependências futuras e não devem ser implementados agora.

### Calendário de eventos

```http
GET /api/eventos/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Filtros futuros:

- `tipo`
- `status`
- `quadra_id`
- `turma_id`
- `participacao`
- `inscricao`
- `horario_inicio`
- `horario_fim`

DTO conceitual sugerido:

```ts
type EventoCalendarioDTO = {
  id: number;
  dataIso: string;
  titulo: string;
  tipo: string;
  status: string;
  horarioInicio: string;
  horarioFim: string;
  quadraId?: number | null;
  quadraNome?: string | null;
  turmaId?: number | null;
  turmaNome?: string | null;
  capacidade?: number | null;
  inscritosCount?: number | null;
  checkedInCount?: number | null;
  minhaParticipacao?: string | null;
  canRsvp: boolean;
  canCheckin: boolean;
  canOpenWorkspace: boolean;
};
```

### Deep link canônico do evento

```http
GET /api/eventos/{eventoId}
```

Esse endpoint será necessário para permitir deep link canônico futuro em
`/eventos/:eventoId` e útil para simplificar a leitura de
`/dias/:dataIso/eventos/:eventoId`.

## 12. Proposta A - Calendário operacional incremental

### Conceito

Melhorar a tela atual `/dias` sem quebrar o fluxo existente, mas já
introduzindo visualmente Evento como unidade operacional. Esta proposta não é
apenas embelezamento: ela é a primeira fatia segura do calendário operacional
evento-cêntrico.

### Fluxo

```text
Calendário mensal
  -> dia
  -> cards de eventos
  -> workspace atual da aula/evento
```

### Layout

- Cabeçalho com título "Calendário".
- Filtros acima ou ao lado do calendário.
- Calendário mensal com dots de eventos abaixo do número do dia.
- Painel lateral/direito com "Eventos do mês" ou "Eventos do dia selecionado".
- Cards de evento com tipo, horário, quadra, status, capacidade e minha
  participação.
- CTA principal: "Abrir evento" ou "Abrir gestão".
- CTA secundário para `JOGO_LIVRE`: "Inscrever-se", "Cancelar inscrição" ou
  "Check-in", conforme estado e capability.

Mesmo na Proposta A, os botões de RSVP, check-in e abertura de evento devem ser
pensados como capabilities derivadas de tipo, status, papel do usuário e
participação, evitando condicionais espalhadas por tela.

### Componentes principais

- `CalendarMonth`
- `CalendarDayCell`
- `EventDots`
- `EventAgendaPanel`
- `EventCard`
- `EventFilters`
- `EventStatusBadge`
- `ParticipationBadge`
- `CourtUsageSummary`

### Impacto nos arquivos atuais

Baixo a médio. A implementação futura deve se concentrar em `/dias`,
`DiaLista`, `DiaDetalhe` e estilos. Não deve mexer na lógica pesada de
`AulaPage` na primeira fatia.

### Risco técnico

Baixo, desde que a primeira fatia preserve os serviços atuais, rotas atuais e
contratos existentes.

### Esforço estimado

Pequeno a médio.

### Vantagens

- Preserva rotas atuais.
- Não exige backend novo.
- Não exige refatorar `AulaPage`.
- Introduz visualmente Dia -> Evento -> Partida.
- Permite adicionar dots, filtros, cards e participação de forma incremental.
- Prepara adoção futura de shadcn/ui + Tailwind.

### Desvantagens

- Ainda convive com a rota e a linguagem legada de aula.
- Não resolve de imediato a concentração de lógica em `AulaPage`.
- Pode precisar de mocks intermediários até o endpoint de calendário existir.

### Aderência ao domínio

Alta para uma primeira fatia. Dia vira calendário/contexto, Evento vira unidade
clicável e Partida permanece como etapa interna.

### Aderência a shadcn/ui + Tailwind

Alta. Os componentes propostos mapeiam bem para `Card`, `Badge`, `Button`,
`Tooltip`, `Popover`, `Tabs`, `Select`, `Sheet` e utilitários Tailwind.

### Primeira fatia segura

Após aprovação futura de implementação:

- Aplicar primeiro em `/dias`.
- Adicionar dots visuais de eventos.
- Adicionar cards de evento.
- Adicionar filtros visuais iniciais.
- Não alterar backend.
- Não alterar contratos.
- Não remover o fluxo atual.

## 13. Proposta B - Workspace operacional centrado em Evento

### Conceito

Transformar o evento na unidade de trabalho. Presença, equipes, partidas, súmula
e resumo ficam dentro de um `WorkspaceEvento`.

### Fluxo

```text
Dia
  -> Evento
  -> Participantes / presença
  -> Equipes
  -> Partidas
  -> Súmula / lances
  -> Resumo
```

### Layout

- Trilho de eventos do dia.
- Área central do workspace.
- Painel lateral com status, horário, quadra, capacidade e KPIs.
- Tabs ou steps operacionais.

### Componentes principais

- `WorkspaceEventoPage`
- `EventRail`
- `EventHeader`
- `OperationalStepTabs`
- `ParticipantsPanel`
- `TeamBuilderPanel`
- `MatchesPanel`
- `ScoreSheetPanel`
- `EventSummaryAside`
- `capabilities.ts`

### Impacto nos arquivos atuais

Médio. Exige quebrar gradualmente `AulaPage` em painéis menores, mas não deve
ser a primeira execução pesada.

### Risco técnico

Médio. `AulaPage` concentra muita lógica local, então a transição precisa ser
fatiada.

### Esforço estimado

Médio.

### Vantagens

- Melhor norte arquitetural para Dia -> Evento -> Partida.
- Permite unificar aula, jogo livre e outros eventos.
- Facilita capabilities por tipo, status e papel de usuário.
- Prepara integração real com FastAPI.

### Desvantagens

- Maior risco de regressão se for feito cedo demais.
- Pode virar refatoração grande se não for fatiado.
- Depende de decisões futuras de contrato e deep link.

### Aderência ao domínio

Muito alta. Esta proposta é o destino arquitetural recomendado.

### Aderência a shadcn/ui + Tailwind

Muito alta. O workspace se encaixa bem em tabs, cards, panels, forms, tables e
badges reutilizáveis.

### Primeira fatia segura

Não refatorar `AulaPage` agora. Apenas documentar `WorkspaceEvento` como alvo e
preparar a navegação `/dias/:dataIso/eventos/:eventoId` como decisão futura.

## 14. Proposta C - Dashboard/mobile-first

### Conceito

Otimizar para uso em quadra, com cards grandes, ações rápidas e fluxo guiado.

### Fluxo

```text
Hoje / próximos eventos
  -> abrir evento
  -> ações guiadas
```

### Layout

- Cards verticais.
- Botões grandes.
- Accordions por etapa.
- Foco em celular/tablet.

### Componentes principais

- `TodayOverview`
- `NextEventCard`
- `GuidedStepCard`
- `MobileActionBar`
- `MatchAccordion`
- `QuickActionButton`
- `PlayerCardList`

### Impacto nos arquivos atuais

Médio a alto. Pode exigir mudanças maiores de responsividade e navegação.

### Risco técnico

Médio a alto. Não deve ser prioridade antes de validar a experiência
evento-cêntrica.

### Esforço estimado

Médio a alto.

### Vantagens

- Boa aderência ao uso em quadra.
- Reduz densidade visual.
- Facilita ações rápidas para participação e check-in.

### Desvantagens

- Pode ser menos eficiente para administração em desktop.
- Pode exigir mais mudanças de layout e navegação.
- Depende de validação do fluxo operacional de eventos.

### Aderência ao domínio

Boa, desde que mantenha Evento como unidade principal e Partida como etapa.

### Aderência a shadcn/ui + Tailwind

Alta, especialmente com `Card`, `Accordion`, `Sheet`, `Button`, `Badge` e
componentes responsivos.

### Primeira fatia segura

Melhorar apenas a responsividade dos cards de `/dias` e `/dias/:dataIso`, sem
mexer no workspace.

## 15. Recomendação técnica final

Adotar a Proposta A primeiro com escopo redefinido:

> Proposta A = primeira fatia segura do calendário operacional
> evento-cêntrico.

A Proposta A deve ser executada antes porque:

- Preserva as rotas atuais.
- Não exige backend novo.
- Não exige refatorar `AulaPage` de uma vez.
- Introduz visualmente Dia -> Evento -> Partida.
- Permite adicionar dots, filtros, cards e participação de forma incremental.
- Prepara a adoção futura de shadcn/ui + Tailwind.
- Reduz risco técnico.

A Proposta B deve permanecer como norte arquitetural:

- `WorkspaceEvento` único.
- Capabilities por tipo, status e papel do usuário.
- Aula como tipo de evento.
- Jogo livre com RSVP/check-in.
- Partidas como etapa interna.

A Proposta C deve ser tratada como segunda fase:

- Útil para operação em quadra.
- Deve vir depois que o calendário operacional e o modelo de Evento estiverem
  definidos e validados.

## 16. Critérios de aceite da documentação

Este documento deve conter:

- Diagnóstico da tela atual.
- Ajuste de linguagem: Dia como contexto, Evento como unidade operacional,
  Partida como etapa.
- Explicação dos event dots.
- Regras visuais dos dots: `filled`, `outline`, `muted` e `+N`.
- Fluxo de navegação atual e alvo.
- Filtros propostos.
- Visualização futura de quadras/horários.
- Regras UX de inscrição, RSVP e check-in.
- Três propostas A/B/C revisadas.
- Recomendação técnica final.
- Primeira fatia segura.
- Gaps futuros de backend documentados, mas não implementados.

## 17. Fora de escopo nesta rodada

- Alterar código React.
- Alterar backend.
- Alterar contratos de API.
- Instalar dependências.
- Instalar Tailwind ou shadcn/ui.
- Alterar rotas.
- Remover rotas existentes.
- Refatorar `AulaPage`.
- Implementar `WorkspaceEvento`.
- Implementar endpoints futuros.
