# Plano de Slices - Calendário Operacional de Eventos

## 1. Objetivo geral

Planejar a execução incremental da evolução de `/dias` para um calendário
operacional evento-cêntrico, preservando o fluxo legado atual e evitando uma
grande refatoração inicial.

A direção de produto e domínio é:

- Dia é contexto/agregador.
- Evento é a unidade operacional clicável.
- Partida é etapa interna do evento.

Este plano complementa `docs/ui-ux/PROPOSTAS_FRONTEND.md` e organiza a execução
em slices pequenos, verificáveis e reversíveis.

## 2. Premissas e restrições

- Stack oficial do frontend: React + Vite + TypeScript.
- Backend alvo: FastAPI.
- Banco alvo: PostgreSQL.
- `/dias` deve continuar existindo.
- O fluxo atual `/dias -> /dias/:dataIso -> /dias/:dataIso/aulas/:aulaId` deve
  continuar funcionando.
- A rota futura desejada é `/dias/:dataIso/eventos/:eventoId`.
- `/dias/:dataIso/aulas/:aulaId` deve ser preservada como rota legada.
- Não alterar backend durante estes slices iniciais, salvo quando houver slice
  futuro explicitamente aprovado para integração.
- Não alterar contratos reais de API até o backend existir para calendário de
  eventos.
- Não instalar Tailwind/shadcn antes de decisão específica.
- Não refatorar `AulaPage` nos slices iniciais.
- Não remover rotas existentes.

## 3. Fluxo atual e fluxo alvo

### Fluxo atual

```text
/dias
  -> calendário/lista de dias

/dias/:dataIso
  -> detalhe do dia com aulas/eventos

/dias/:dataIso/aulas/:aulaId
  -> workspace atual da aula
```

### Fluxo alvo

```text
/dias
  -> calendário operacional com event dots, filtros e agenda

/dias/:dataIso
  -> detalhe do dia com lista/agenda de eventos

/dias/:dataIso/eventos/:eventoId
  -> workspace contextual do evento

/dias/:dataIso/aulas/:aulaId
  -> compatibilidade legada, renderizando ou redirecionando futuramente para o
     mesmo workspace do evento
```

## 4. Ordem de execução dos slices

1. Slice 00 - Guardrails, diagnóstico e documentação.
2. Slice 01 - Base visual incremental do calendário.
3. Slice 02 - Event dots no calendário.
4. Slice 03 - Cards de evento e painel de agenda.
5. Slice 04 - Filtros visuais e estado de URL.
6. Slice 05 - Resumo de ocupação de quadras/horários.
7. Slice 06 - Capabilities de UI para ações de evento.
8. Slice 07 - Rota contextual futura de evento.
9. Slice 08 - `WorkspaceEvento` como norte arquitetural.

Cada slice deve terminar com aplicação navegável, sem quebrar o fluxo legado.

## 5. Critérios de "Ready for Codex"

Antes de iniciar qualquer slice:

- Escopo do slice aprovado por escrito.
- Arquivos permitidos listados.
- Fora de escopo explícito.
- Comandos de validação definidos.
- Estado inicial de Git conferido com `git status -sb`.
- Contratos reais de API e rotas existentes protegidos.
- Decisão clara sobre usar mock/local state ou integração real.
- Critério de rollback definido.

Um slice não está pronto se exigir alterar backend, instalar dependências ou
refatorar `AulaPage` sem aprovação específica.

## 6. Critérios de "Done"

Um slice está concluído quando:

- O fluxo atual continua funcionando.
- O novo comportamento do slice aparece na UI ou na documentação aprovada.
- Nenhuma rota existente foi removida.
- Nenhum contrato real de API foi alterado sem autorização.
- `npm run build` ou validação equivalente foi executada quando houver mudança
  em código React.
- O diff está restrito aos arquivos aprovados.
- Há rollback simples documentado.
- O resultado foi descrito com limitações conhecidas.

## 7. Riscos e rollback

Riscos principais:

- Misturar visual de evento com contrato de backend ainda inexistente.
- Antecipar a rota futura e quebrar a rota legada de aula.
- Espalhar condicionais de RSVP/check-in diretamente nas telas.
- Transformar a evolução incremental em refatoração grande de `AulaPage`.
- Introduzir filtros que pareçam reais, mas ainda não tenham fonte de dados
  confiável.

Rollback geral:

- Reverter apenas o commit do slice.
- Se a mudança for CSS/visual, retornar ao layout anterior mantendo os dados.
- Se a mudança envolver rota futura, remover somente a rota nova e preservar as
  rotas legadas.
- Se a mudança envolver mocks, remover mocks novos sem tocar no serviço atual.

## 8. Comandos de validação

Para documentação:

```bash
git status -sb
git diff -- docs/ui-ux/FRONTEND_EVENT_CALENDAR_SLICES.md
```

Para implementação futura de frontend:

```bash
cd frontend/jubileu-web
npm run build
npm run lint --if-present
```

Para inspeção de escopo:

```bash
git diff --name-only
git diff --cached --name-only
```

Quando um arquivo novo ainda estiver untracked:

```bash
git diff --no-index -- /dev/null docs/ui-ux/FRONTEND_EVENT_CALENDAR_SLICES.md || true
```

## 9. O que não deve ser feito nesta fase

- Não alterar backend.
- Não alterar contratos reais de API.
- Não remover rotas.
- Não instalar dependências.
- Não instalar Tailwind/shadcn.
- Não refatorar `AulaPage`.
- Não implementar `WorkspaceEvento` como refatoração completa.
- Não substituir o fluxo legado por rota futura.
- Não misturar arquivos gerados, reports ou test-results nos commits.
- Não usar `git add .`.
- Não usar `git clean`.
- Não apagar diretórios untracked fora do escopo.
- Não stagear `backend/`, `backups/`, `reports/`,
  `frontend/jubileu-web/playwright-report/` ou
  `frontend/jubileu-web/test-results/`.

## Slice 00 - Guardrails, diagnóstico e documentação

### Objetivo

Formalizar o plano, confirmar o estado atual e proteger o escopo antes de
qualquer alteração de UI.

### Escopo

- Manter `PROPOSTAS_FRONTEND.md` como referência estratégica.
- Criar e versionar este plano de slices.
- Registrar restrições, ordem de execução e critérios de validação.

### Fora de escopo

- Código React.
- Backend.
- Rotas.
- Dependências.
- Refatoração de `AulaPage`.

### Arquivos provavelmente impactados

- `docs/ui-ux/PROPOSTAS_FRONTEND.md`
- `docs/ui-ux/FRONTEND_EVENT_CALENDAR_SLICES.md`

### Dependências

- Decisão já registrada de Dia -> Evento -> Partida.
- Branch limpa ou com alterações conhecidas e isoladas.

### Risco técnico

Baixo.

### Critérios de aceite

- Documento de slices criado.
- Escopo incremental claro.
- Slices ordenados.
- Restrições explícitas.

### Validação esperada

```bash
git status -sb
git diff -- docs/ui-ux/FRONTEND_EVENT_CALENDAR_SLICES.md
```

### Rollback

Remover o arquivo de documentação do slice ou reverter o commit documental.

## Slice 01 - Base visual incremental do calendário

### Objetivo

Preparar `/dias` para deixar de parecer apenas lista de dias e começar a se
comportar visualmente como calendário operacional.

### Escopo

- Ajustar título e microcopy de `/dias` para "Calendário".
- Melhorar hierarquia visual do calendário mensal.
- Preparar layout para painel lateral ou seção de eventos.
- Manter dados e navegação atuais.

### Fora de escopo

- Event dots reais.
- Filtros funcionais.
- Nova rota de evento.
- Alterações em `AulaPage`.

### Arquivos provavelmente impactados

- `frontend/jubileu-web/src/pages/dias/DiaLista.tsx`
- `frontend/jubileu-web/src/App.css`

### Dependências

- Documento de propostas aprovado.
- Nenhuma dependência externa nova.

### Risco técnico

Baixo.

### Critérios de aceite

- `/dias` continua abrindo.
- Clique em dia existente continua levando para `/dias/:dataIso`.
- Layout segue responsivo.
- Sem alteração de contrato ou serviço.

### Validação esperada

```bash
cd frontend/jubileu-web
npm run build
npm run lint --if-present
```

### Rollback

Reverter o commit do slice, retornando o layout anterior de `/dias`.

## Slice 02 - Event dots no calendário

### Objetivo

Adicionar indicadores visuais de eventos dentro das células do calendário.

### Escopo

- Criar representação visual de dots por evento.
- Suportar estados `filled`, `outline`, `muted` e contador `+N`.
- Usar os dados mockados atuais como fonte inicial.
- Adicionar `aria-label` ou `title` com título, horário, quadra e tipo quando
  disponível.

### Fora de escopo

- Endpoint real de calendário.
- RSVP/check-in funcional.
- Rota nova de evento.
- Reescrever modelo de dados.

### Arquivos provavelmente impactados

- `frontend/jubileu-web/src/pages/dias/DiaLista.tsx`
- `frontend/jubileu-web/src/types/dia.ts`
- `frontend/jubileu-web/src/services/diasService.ts`

### Dependências

- Slice 01 concluído.
- Decisão de como derivar dots a partir de `Dia.aulas` enquanto o conceito de
  `EventoCalendarioDTO` ainda é futuro.

### Risco técnico

Baixo.

### Critérios de aceite

- Dias com eventos exibem dots.
- Dias sem eventos não exibem dots.
- Mais de 3 ou 4 eventos exibe contador `+N`.
- Clique no dia continua compatível com o fluxo atual.

### Validação esperada

```bash
cd frontend/jubileu-web
npm run build
npm run lint --if-present
```

### Rollback

Remover os dots e retornar a célula do calendário ao comportamento anterior.

## Slice 03 - Cards de evento e painel de agenda

### Objetivo

Mostrar eventos como unidades operacionais clicáveis em um painel do mês ou do
dia selecionado.

### Escopo

- Criar cards de evento com tipo, horário, status e participação quando houver.
- Exibir painel "Eventos do dia selecionado" ou "Eventos do mês".
- Manter CTA principal compatível com rota atual.
- Usar linguagem "evento" sem remover a compatibilidade com "aula".

### Fora de escopo

- Workspace novo.
- Check-in real.
- Inscrição real.
- Backend novo.

### Arquivos provavelmente impactados

- `frontend/jubileu-web/src/pages/dias/DiaLista.tsx`
- `frontend/jubileu-web/src/pages/dias/DiaDetalhe.tsx`
- `frontend/jubileu-web/src/App.css`

### Dependências

- Slice 02 concluído.
- Definição de fallback de navegação: enquanto não existir rota de evento, card
  pode navegar para `/dias/:dataIso` ou para a rota legada da aula quando houver
  `aulaId`.

### Risco técnico

Baixo a médio.

### Critérios de aceite

- Cards aparecem para eventos existentes.
- CTA principal não quebra o fluxo legado.
- Dia selecionado no calendário reflete painel de eventos.
- Estado vazio é claro quando não houver eventos.

### Validação esperada

```bash
cd frontend/jubileu-web
npm run build
npm run lint --if-present
```

### Rollback

Remover painel/cards e manter apenas calendário/lista anterior.

## Slice 04 - Filtros visuais e estado de URL

### Objetivo

Introduzir filtros operacionais sem depender ainda de contrato real de API.

### Escopo

- Filtros visuais para tipo, status, quadra, turma, participação, inscrição e
  faixa de horário.
- Persistir filtros simples em query string quando fizer sentido.
- Aplicar filtros apenas sobre dados disponíveis no frontend.

### Fora de escopo

- Chamada real com filtros para backend.
- Alterar contrato de API.
- Criar endpoint novo.
- Autocomplete avançado.

### Arquivos provavelmente impactados

- `frontend/jubileu-web/src/pages/dias/DiaLista.tsx`
- `frontend/jubileu-web/src/App.css`

### Dependências

- Slice 03 concluído.
- Lista mínima de valores mockados para filtros.

### Risco técnico

Médio.

### Critérios de aceite

- Filtros não quebram carregamento inicial.
- URL pode ser compartilhada sem erro.
- Limpar filtros retorna à visão padrão.
- Filtros sem dados exibem estado vazio compreensível.

### Validação esperada

```bash
cd frontend/jubileu-web
npm run build
npm run lint --if-present
```

### Rollback

Remover leitura/escrita de query string e retornar aos dados sem filtro.

## Slice 05 - Resumo de ocupação de quadras/horários

### Objetivo

Preparar uma primeira visualização de ocupação operacional sem implementar uma
grade complexa.

### Escopo

- Criar resumo por quadra quando houver dados.
- Mostrar horários ocupados, livres, lotados ou encerrados quando possível.
- Exibir fallback quando não houver quadra cadastrada.
- Documentar limitações de dados.
- Usar somente dados já disponíveis no frontend ou nos mocks aprovados.
- Se não houver dados suficientes de quadra/horário, entregar
  placeholder/estado vazio e documentar a dependência futura.

### Fora de escopo

- Grade completa quadra x horário.
- Detecção robusta de conflito.
- Backend de disponibilidade.
- Reserva de quadra.

### Arquivos provavelmente impactados

- `frontend/jubileu-web/src/pages/dias/DiaLista.tsx`
- `frontend/jubileu-web/src/pages/dias/DiaDetalhe.tsx`
- `frontend/jubileu-web/src/App.css`

### Dependências

- Slice 03 concluído.
- Campos de quadra disponíveis nos dados atuais, mocks aprovados ou fallback
  visual definido.

### Risco técnico

Médio.

### Critérios de aceite

- Resumo não quebra quando `quadra` estiver ausente.
- Eventos com quadra aparecem agrupados ou destacados.
- O resumo ajuda a entender ocupação sem parecer fonte definitiva.
- Ausência de dados suficientes exibe placeholder/estado vazio claro.
- Dependência futura de dados de quadra/horário fica documentada.

### Validação esperada

```bash
cd frontend/jubileu-web
npm run build
npm run lint --if-present
```

### Rollback

Remover o resumo de ocupação e manter calendário/cards.

## Slice 06 - Capabilities de UI para ações de evento

### Objetivo

Centralizar decisões de UI para ações como abrir evento, RSVP e check-in, sem
espalhar condicionais por tela.

### Escopo

- Criar helper conceitual ou módulo leve para capabilities de UI.
- Derivar ações visíveis a partir de tipo, status, papel do usuário e
  participação.
- Aplicar capabilities em cards de evento.
- Enquanto não houver backend, exibir CTAs desabilitados, demonstrativos ou
  direcionados ao fluxo legado, sem simular persistência.

### Fora de escopo

- Persistir RSVP/check-in.
- Criar endpoints.
- Mudar autenticação/autorização.
- Refatorar `AulaPage`.

### Arquivos provavelmente impactados

- `frontend/jubileu-web/src/pages/dias/DiaLista.tsx`
- `frontend/jubileu-web/src/types/dia.ts`
- `frontend/jubileu-web/src/App.css`

### Dependências

- Slice 03 concluído.
- Regras UX de `JOGO_LIVRE` e `AULA` aprovadas.

### Risco técnico

Médio.

### Critérios de aceite

- Cards mostram CTAs compatíveis com o estado mockado.
- RSVP não é tratado como presença física.
- Check-in aparece como ação separada quando aplicável.
- A lógica fica centralizada o suficiente para migração futura.

### Validação esperada

```bash
cd frontend/jubileu-web
npm run build
npm run lint --if-present
```

### Rollback

Remover o helper de capabilities e voltar a CTAs estáticos.

## Slice 07 - Rota contextual futura de evento

### Objetivo

Preparar a rota alvo `/dias/:dataIso/eventos/:eventoId` sem quebrar a rota
legada.

### Escopo

- Adicionar rota contextual somente quando aprovado.
- Renderizar uma tela ponte ou reaproveitar o workspace atual de forma
  compatível.
- Garantir que `/dias/:dataIso/aulas/:aulaId` continue funcionando.

### Fora de escopo

- Remover rota de aula.
- Deep link canônico `/eventos/:eventoId`.
- Refatoração completa de `AulaPage`.
- Endpoint `GET /api/eventos/{eventoId}`.

### Arquivos provavelmente impactados

- `frontend/jubileu-web/src/routes/AppRoutes.tsx`
- `frontend/jubileu-web/src/pages/dias/DiaDetalhe.tsx`
- `frontend/jubileu-web/src/pages/dias/AulaPage.tsx`

### Dependências

- Slice 03 concluído.
- Decisão explícita de navegação para evento.
- Critério claro para mapear `eventoId` para `aulaId` enquanto o modelo real não
  existir.

### Risco técnico

Médio a alto.

### Critérios de aceite

- Rota nova abre sem quebrar rotas existentes.
- Rota legada continua abrindo.
- Navegação de volta para `/dias/:dataIso` funciona.
- Nenhuma rota existente é removida.

### Validação esperada

```bash
cd frontend/jubileu-web
npm run build
npm run lint --if-present
```

### Rollback

Remover a rota nova e voltar os CTAs para a rota legada.

## Slice 08 - WorkspaceEvento como norte arquitetural

### Objetivo

Planejar a futura extração do workspace operacional sem executar uma grande
refatoração de uma vez.

### Escopo

- Documentar a decomposição de `AulaPage` em painéis.
- Identificar fronteiras: participantes, equipes, partidas, súmula e resumo.
- Preparar nomes e responsabilidades de componentes futuros.
- Definir estratégia de migração gradual.

### Fora de escopo

- Reescrever `AulaPage`.
- Alterar backend.
- Alterar contratos.
- Implementar `WorkspaceEvento` completo.

### Arquivos provavelmente impactados

- `docs/ui-ux/PROPOSTAS_FRONTEND.md`
- `docs/ui-ux/FRONTEND_EVENT_CALENDAR_SLICES.md`
- Documentação futura de arquitetura frontend.

### Dependências

- Validação da experiência evento-cêntrica em `/dias`.
- Decisão futura sobre contratos de evento.

### Risco técnico

Baixo enquanto documental; alto se executado como refatoração grande sem
fatiamento.

### Critérios de aceite

- Fronteiras de componentes futuras estão claras.
- Nenhuma implementação prematura foi feita.
- `AulaPage` continua como fonte operacional legada até slice específico.

### Validação esperada

```bash
git status -sb
git diff -- docs/ui-ux/FRONTEND_EVENT_CALENDAR_SLICES.md
```

### Rollback

Reverter apenas a documentação arquitetural.
