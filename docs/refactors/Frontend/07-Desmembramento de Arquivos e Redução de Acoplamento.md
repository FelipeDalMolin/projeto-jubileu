# Slice 07 — Desmembramento de Arquivos e Redução de Acoplamento

## Contexto

Contexto

A trilha de migração para Eventos e Workspace unificado aumenta o risco de acoplamento excessivo caso a implementação continue concentrada em arquivos legados grandes, com mistura de:

navegação;
layout;
regras de domínio;
integração HTTP;
renderização de painéis.

A investigação anterior já indicou pontos claros de concentração excessiva de responsabilidade, tanto no frontend quanto no backend. Este slice existe para transformar essa constatação em uma frente explícita de execução, reduzindo risco estrutural durante a evolução.

Alinhamento com baseline arquitetural
A refatoração deve ser incremental e compatibilidade-first.
Não é uma reescrita.
O objetivo é reduzir acoplamento sem mudar contratos desnecessariamente.
O backend continua preservando nomes de persistência nesta fase.
O frontend deve caminhar para uma estrutura mais modular e coerente com workspaces, serviços e componentes reutilizáveis.

## Objetivo

Identificar, priorizar e executar o desmembramento de arquivos com responsabilidade excessiva, para permitir que os slices anteriores sejam implementados com menor risco, maior legibilidade e melhor manutenção.

## Escopo

Identificar arquivos grandes ou com mistura excessiva de responsabilidades.
Definir para cada arquivo:
qual é o problema;
como dividir;
qual a ordem segura de desmembramento.
Propor estruturas-alvo mínimas para frontend e backend.
Reduzir o risco de continuar empilhando lógica nova sobre estruturas legadas saturadas.

## Fora de escopo

Renomear domínio persistido (Aula → Evento) nesta fase.
Reescrever todo o frontend ou backend.
Alterar contratos de API apenas por motivo de organização interna.
Refatoração estética sem ganho estrutural.

Critérios de priorização

Um arquivo entra nesta fase quando apresentar um ou mais dos seguintes sinais:

mistura de UI e regra de domínio;
mistura de dados e navegação;
mistura de renderização e persistência;
tamanho elevado com baixa coesão;
reutilização difícil;
impacto direto na migração para Evento.
Arquivos candidatos prioritários — Frontend
1. frontend/jubileu-web/src/pages/dias/AulaPage.tsx

Problema

nome e semântica legados;
tende a virar ponto de acoplamento entre rota, workspace e domínio;
risco alto de acumular compatibilidade, conversão de rota e renderização de painéis em um lugar só.

Divisão sugerida

pages/eventos/EventoPage.tsx → página canônica
pages/dias/AulaPage.tsx → wrapper/compatibilidade temporária
workspaces/evento/WorkspaceEventoPage.tsx → centro real da experiência
2. frontend/jubileu-web/src/hooks/useWorkspaceAula.ts

Problema

hook legado tende a carregar conceitos de aula para uma experiência que passará a ser centrada em evento;
alto risco de virar ponto de acoplamento entre polling, carregamento, transformação e semântica legada.

Divisão sugerida

hooks/useWorkspaceEvento.ts
hooks/useEventoCapabilities.ts
hooks/useEventoRefetch.ts ou equivalente, se houver lógica de atualização separada
3. frontend/jubileu-web/src/services/eventosService.ts

Problema

tende a concentrar muitas operações diferentes do domínio de eventos;
conforme crescerem ações e fluxos, perde coesão rapidamente.

Divisão sugerida

services/eventos/eventoActionsService.ts
services/eventos/eventoParticipantsService.ts
services/eventos/lancesService.ts

ou, se o projeto preferir menos arquivos:

manter um service único agora, mas explicitar a futura divisão.
4. frontend/jubileu-web/src/context/AuthContext.tsx

Problema

mistura estado de sessão, comportamento de login e transição de compatibilidade;
tende a crescer demais quando incorporar jogadorId, JWT, refresh e sessão operacional.

Divisão sugerida

context/AuthContext.tsx → provider/contexto
hooks/useAuthSession.ts
services/authService.ts
utils/auth/* para helpers puros
5. frontend/jubileu-web/src/routes/AppRoutes.tsx

Problema

concentra todas as rotas do sistema;
conforme a navegação de evento crescer, tende a ficar mais difícil de manter.

Divisão sugerida

routes/authRoutes.tsx
routes/diasRoutes.tsx
routes/eventosRoutes.tsx
routes/dashboardRoutes.tsx
routes/AppRoutes.tsx como agregador
6. frontend/jubileu-web/src/components/layout/Navbar.tsx

Problema

tende a acumular navegação, estado de sessão, atalhos e contexto visual.

Divisão sugerida

components/layout/Navbar.tsx
components/layout/NavLinks.tsx
components/layout/UserMenu.tsx
components/layout/ContextBreadcrumb.tsx ou equivalente
Arquivos candidatos prioritários — Backend
1. backend/jubileu-api-fastapi/app/routers/dias.py

Problema

concentra múltiplas responsabilidades:
dia
aula
presença
times
estado de equipes
estado
workspace

Divisão sugerida

routers/dias.py → apenas leitura/escopo de dia
routers/aulas.py → lifecycle de aula/evento persistido
routers/aula_equipes.py
routers/aula_workspace.py

ou equivalente por módulos/services, mantendo compatibilidade de rotas.

2. backend/jubileu-api-fastapi/app/services/workspace_aula.py

Problema

tende a centralizar meta, kpis, warnings, partidas e evolução futura de timeline;
risco alto de virar “mega-serviço” conforme WorkspaceEvento evoluir.

Divisão sugerida

services/workspace/meta_builder.py
services/workspace/kpis_builder.py
services/workspace/warnings_builder.py
services/workspace/partidas_builder.py
services/workspace/timeline_builder.py (quando existir)
3. backend/jubileu-api-fastapi/app/models/dia_aula.py

Problema

já foi apontado como mega-modelo na análise arquitetural;
concentra múltiplas entidades e reduz coesão.

Divisão sugerida

models/dia.py
models/aula.py
models/time_aula.py
models/jogador_aula.py
models/partida.py
models/evento_participante.py
models/lance.py

sem renomear persistência nesta fase.

Ordem segura de desmembramento
Frontend — AulaPage / WorkspaceAula
Frontend — AppRoutes
Frontend — AuthContext
Frontend — Navbar
Frontend — eventosService
Backend — routers/dias.py
Backend — workspace_aula.py
Backend — models/dia_aula.py
Estratégia de execução
Abordagem obrigatória
desmembrar junto com a fase que já toca aquele arquivo
evitar refatorar arquivos isoladamente sem motivo funcional
sempre preservar o comportamento antes de remover legado
Regra prática

Se um arquivo já vai ser alterado por um slice e está excessivamente concentrado, o desmembramento deve ocorrer na mesma janela, desde que:

não aumente muito o risco;
não altere contratos;
produza uma estrutura mais clara para o passo seguinte.
Riscos
Desmembrar cedo demais e introduzir regressões.
Desmembrar tarde demais e empilhar mais lógica sobre arquivos ruins.
Criar fragmentação excessiva sem ganho real.
Misturar refatoração estrutural com mudança de domínio e gerar diffs difíceis de revisar.
Critérios de aceite
Arquivos críticos deixam de concentrar responsabilidades incompatíveis.
O workspace de evento passa a ter uma estrutura mais modular.
A navegação deixa de depender excessivamente de AulaPage.
A sessão/auth fica mais clara e evolutiva.
Não há quebra de contrato por causa do desmembramento.
Checklist de validação
 AulaPage deixou de ser centro semântico da experiência.
 Há separação clara entre page, workspace e painéis.
 AppRoutes não concentra toda a lógica de roteamento.
 AuthContext não concentra sozinho toda a lógica de auth/sessão.
 dias.py foi mapeado como ponto crítico de backend.
 workspace_aula.py tem plano explícito de modularização.
 Critérios de priorização

Um arquivo entra nesta fase quando apresentar um ou mais dos seguintes sinais:

mistura de UI e regra de domínio;
mistura de dados e navegação;
mistura de renderização e persistência;
tamanho elevado com baixa coesão;
reutilização difícil;
impacto direto na migração para Evento.
Arquivos candidatos prioritários — Frontend
1. frontend/jubileu-web/src/pages/dias/AulaPage.tsx

Problema

nome e semântica legados;
tende a virar ponto de acoplamento entre rota, workspace e domínio;
risco alto de acumular compatibilidade, conversão de rota e renderização de painéis em um lugar só.

Divisão sugerida

pages/eventos/EventoPage.tsx → página canônica
pages/dias/AulaPage.tsx → wrapper/compatibilidade temporária
workspaces/evento/WorkspaceEventoPage.tsx → centro real da experiência
2. frontend/jubileu-web/src/hooks/useWorkspaceAula.ts

Problema

hook legado tende a carregar conceitos de aula para uma experiência que passará a ser centrada em evento;
alto risco de virar ponto de acoplamento entre polling, carregamento, transformação e semântica legada.

Divisão sugerida

hooks/useWorkspaceEvento.ts
hooks/useEventoCapabilities.ts
hooks/useEventoRefetch.ts ou equivalente, se houver lógica de atualização separada
3. frontend/jubileu-web/src/services/eventosService.ts

Problema

tende a concentrar muitas operações diferentes do domínio de eventos;
conforme crescerem ações e fluxos, perde coesão rapidamente.

Divisão sugerida

services/eventos/eventoActionsService.ts
services/eventos/eventoParticipantsService.ts
services/eventos/lancesService.ts

ou, se o projeto preferir menos arquivos:

manter um service único agora, mas explicitar a futura divisão.
4. frontend/jubileu-web/src/context/AuthContext.tsx

Problema

mistura estado de sessão, comportamento de login e transição de compatibilidade;
tende a crescer demais quando incorporar jogadorId, JWT, refresh e sessão operacional.

Divisão sugerida

context/AuthContext.tsx → provider/contexto
hooks/useAuthSession.ts
services/authService.ts
utils/auth/* para helpers puros
5. frontend/jubileu-web/src/routes/AppRoutes.tsx

Problema

concentra todas as rotas do sistema;
conforme a navegação de evento crescer, tende a ficar mais difícil de manter.

Divisão sugerida

routes/authRoutes.tsx
routes/diasRoutes.tsx
routes/eventosRoutes.tsx
routes/dashboardRoutes.tsx
routes/AppRoutes.tsx como agregador
6. frontend/jubileu-web/src/components/layout/Navbar.tsx

Problema

tende a acumular navegação, estado de sessão, atalhos e contexto visual.

Divisão sugerida

components/layout/Navbar.tsx
components/layout/NavLinks.tsx
components/layout/UserMenu.tsx
components/layout/ContextBreadcrumb.tsx ou equivalente
Arquivos candidatos prioritários — Backend
1. backend/jubileu-api-fastapi/app/routers/dias.py

Problema

concentra múltiplas responsabilidades:
dia
aula
presença
times
estado de equipes
estado
workspace

Divisão sugerida

routers/dias.py → apenas leitura/escopo de dia
routers/aulas.py → lifecycle de aula/evento persistido
routers/aula_equipes.py
routers/aula_workspace.py

ou equivalente por módulos/services, mantendo compatibilidade de rotas.

2. backend/jubileu-api-fastapi/app/services/workspace_aula.py

Problema

tende a centralizar meta, kpis, warnings, partidas e evolução futura de timeline;
risco alto de virar “mega-serviço” conforme WorkspaceEvento evoluir.

Divisão sugerida

services/workspace/meta_builder.py
services/workspace/kpis_builder.py
services/workspace/warnings_builder.py
services/workspace/partidas_builder.py
services/workspace/timeline_builder.py (quando existir)
3. backend/jubileu-api-fastapi/app/models/dia_aula.py

Problema

já foi apontado como mega-modelo na análise arquitetural;
concentra múltiplas entidades e reduz coesão.

Divisão sugerida

models/dia.py
models/aula.py
models/time_aula.py
models/jogador_aula.py
models/partida.py
models/evento_participante.py
models/lance.py

sem renomear persistência nesta fase.

Ordem segura de desmembramento
Frontend — AulaPage / WorkspaceAula
Frontend — AppRoutes
Frontend — AuthContext
Frontend — Navbar
Frontend — eventosService
Backend — routers/dias.py
Backend — workspace_aula.py
Backend — models/dia_aula.py
Estratégia de execução
Abordagem obrigatória
desmembrar junto com a fase que já toca aquele arquivo
evitar refatorar arquivos isoladamente sem motivo funcional
sempre preservar o comportamento antes de remover legado
Regra prática

Se um arquivo já vai ser alterado por um slice e está excessivamente concentrado, o desmembramento deve ocorrer na mesma janela, desde que:

não aumente muito o risco;
não altere contratos;
produza uma estrutura mais clara para o passo seguinte.
Riscos
Desmembrar cedo demais e introduzir regressões.
Desmembrar tarde demais e empilhar mais lógica sobre arquivos ruins.
Criar fragmentação excessiva sem ganho real.
Misturar refatoração estrutural com mudança de domínio e gerar diffs difíceis de revisar.
Critérios de aceite
Arquivos críticos deixam de concentrar responsabilidades incompatíveis.
O workspace de evento passa a ter uma estrutura mais modular.
A navegação deixa de depender excessivamente de AulaPage.
A sessão/auth fica mais clara e evolutiva.
Não há quebra de contrato por causa do desmembramento.
Checklist de validação
 AulaPage deixou de ser centro semântico da experiência.
 Há separação clara entre page, workspace e painéis.
 AppRoutes não concentra toda a lógica de roteamento.
 AuthContext não concentra sozinho toda a lógica de auth/sessão.
 dias.py foi mapeado como ponto crítico de backend.
 workspace_aula.py tem plano explícito de modularização.