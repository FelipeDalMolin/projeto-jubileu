> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# Slice 07 â€” Desmembramento de Arquivos e ReduÃ§Ã£o de Acoplamento

## Contexto

Contexto

A trilha de migraÃ§Ã£o para Eventos e Workspace unificado aumenta o risco de acoplamento excessivo caso a implementaÃ§Ã£o continue concentrada em arquivos legados grandes, com mistura de:

navegaÃ§Ã£o;
layout;
regras de domÃ­nio;
integraÃ§Ã£o HTTP;
renderizaÃ§Ã£o de painÃ©is.

A investigaÃ§Ã£o anterior jÃ¡ indicou pontos claros de concentraÃ§Ã£o excessiva de responsabilidade, tanto no frontend quanto no backend. Este slice existe para transformar essa constataÃ§Ã£o em uma frente explÃ­cita de execuÃ§Ã£o, reduzindo risco estrutural durante a evoluÃ§Ã£o.

Alinhamento com baseline arquitetural
A refatoraÃ§Ã£o deve ser incremental e compatibilidade-first.
NÃ£o Ã© uma reescrita.
O objetivo Ã© reduzir acoplamento sem mudar contratos desnecessariamente.
O backend continua preservando nomes de persistÃªncia nesta fase.
O frontend deve caminhar para uma estrutura mais modular e coerente com workspaces, serviÃ§os e componentes reutilizÃ¡veis.

## Objetivo

Identificar, priorizar e executar o desmembramento de arquivos com responsabilidade excessiva, para permitir que os slices anteriores sejam implementados com menor risco, maior legibilidade e melhor manutenÃ§Ã£o.

## Escopo

Identificar arquivos grandes ou com mistura excessiva de responsabilidades.
Definir para cada arquivo:
qual Ã© o problema;
como dividir;
qual a ordem segura de desmembramento.
Propor estruturas-alvo mÃ­nimas para frontend e backend.
Reduzir o risco de continuar empilhando lÃ³gica nova sobre estruturas legadas saturadas.

## Fora de escopo

Renomear domÃ­nio persistido (Aula â†’ Evento) nesta fase.
Reescrever todo o frontend ou backend.
Alterar contratos de API apenas por motivo de organizaÃ§Ã£o interna.
RefatoraÃ§Ã£o estÃ©tica sem ganho estrutural.

CritÃ©rios de priorizaÃ§Ã£o

Um arquivo entra nesta fase quando apresentar um ou mais dos seguintes sinais:

mistura de UI e regra de domÃ­nio;
mistura de dados e navegaÃ§Ã£o;
mistura de renderizaÃ§Ã£o e persistÃªncia;
tamanho elevado com baixa coesÃ£o;
reutilizaÃ§Ã£o difÃ­cil;
impacto direto na migraÃ§Ã£o para Evento.
Arquivos candidatos prioritÃ¡rios â€” Frontend
1. frontend/jubileu-web/src/pages/dias/AulaPage.tsx

Problema

nome e semÃ¢ntica legados;
tende a virar ponto de acoplamento entre rota, workspace e domÃ­nio;
risco alto de acumular compatibilidade, conversÃ£o de rota e renderizaÃ§Ã£o de painÃ©is em um lugar sÃ³.

DivisÃ£o sugerida

pages/eventos/EventoPage.tsx â†’ pÃ¡gina canÃ´nica
pages/dias/AulaPage.tsx â†’ wrapper/compatibilidade temporÃ¡ria
workspaces/evento/WorkspaceEventoPage.tsx â†’ centro real da experiÃªncia
2. frontend/jubileu-web/src/hooks/useWorkspaceAula.ts

Problema

hook legado tende a carregar conceitos de aula para uma experiÃªncia que passarÃ¡ a ser centrada em evento;
alto risco de virar ponto de acoplamento entre polling, carregamento, transformaÃ§Ã£o e semÃ¢ntica legada.

DivisÃ£o sugerida

hooks/useWorkspaceEvento.ts
hooks/useEventoCapabilities.ts
hooks/useEventoRefetch.ts ou equivalente, se houver lÃ³gica de atualizaÃ§Ã£o separada
3. frontend/jubileu-web/src/services/eventosService.ts

Problema

tende a concentrar muitas operaÃ§Ãµes diferentes do domÃ­nio de eventos;
conforme crescerem aÃ§Ãµes e fluxos, perde coesÃ£o rapidamente.

DivisÃ£o sugerida

services/eventos/eventoActionsService.ts
services/eventos/eventoParticipantsService.ts
services/eventos/lancesService.ts

ou, se o projeto preferir menos arquivos:

manter um service Ãºnico agora, mas explicitar a futura divisÃ£o.
4. frontend/jubileu-web/src/context/AuthContext.tsx

Problema

mistura estado de sessÃ£o, comportamento de login e transiÃ§Ã£o de compatibilidade;
tende a crescer demais quando incorporar jogadorId, JWT, refresh e sessÃ£o operacional.

DivisÃ£o sugerida

context/AuthContext.tsx â†’ provider/contexto
hooks/useAuthSession.ts
services/authService.ts
utils/auth/* para helpers puros
5. frontend/jubileu-web/src/routes/AppRoutes.tsx

Problema

concentra todas as rotas do sistema;
conforme a navegaÃ§Ã£o de evento crescer, tende a ficar mais difÃ­cil de manter.

DivisÃ£o sugerida

routes/authRoutes.tsx
routes/diasRoutes.tsx
routes/eventosRoutes.tsx
routes/dashboardRoutes.tsx
routes/AppRoutes.tsx como agregador
6. frontend/jubileu-web/src/components/layout/Navbar.tsx

Problema

tende a acumular navegaÃ§Ã£o, estado de sessÃ£o, atalhos e contexto visual.

DivisÃ£o sugerida

components/layout/Navbar.tsx
components/layout/NavLinks.tsx
components/layout/UserMenu.tsx
components/layout/ContextBreadcrumb.tsx ou equivalente
Arquivos candidatos prioritÃ¡rios â€” Backend
1. backend/jubileu-api-fastapi/app/routers/dias.py

Problema

concentra mÃºltiplas responsabilidades:
dia
aula
presenÃ§a
times
estado de equipes
estado
workspace

DivisÃ£o sugerida

routers/dias.py â†’ apenas leitura/escopo de dia
routers/aulas.py â†’ lifecycle de aula/evento persistido
routers/aula_equipes.py
routers/aula_workspace.py

ou equivalente por mÃ³dulos/services, mantendo compatibilidade de rotas.

2. backend/jubileu-api-fastapi/app/services/workspace_aula.py

Problema

tende a centralizar meta, kpis, warnings, partidas e evoluÃ§Ã£o futura de timeline;
risco alto de virar â€œmega-serviÃ§oâ€ conforme WorkspaceEvento evoluir.

DivisÃ£o sugerida

services/workspace/meta_builder.py
services/workspace/kpis_builder.py
services/workspace/warnings_builder.py
services/workspace/partidas_builder.py
services/workspace/timeline_builder.py (quando existir)
3. backend/jubileu-api-fastapi/app/models/dia_aula.py

Problema

jÃ¡ foi apontado como mega-modelo na anÃ¡lise arquitetural;
concentra mÃºltiplas entidades e reduz coesÃ£o.

DivisÃ£o sugerida

models/dia.py
models/aula.py
models/time_aula.py
models/jogador_aula.py
models/partida.py
models/evento_participante.py
models/lance.py

sem renomear persistÃªncia nesta fase.

Ordem segura de desmembramento
Frontend â€” AulaPage / WorkspaceAula
Frontend â€” AppRoutes
Frontend â€” AuthContext
Frontend â€” Navbar
Frontend â€” eventosService
Backend â€” routers/dias.py
Backend â€” workspace_aula.py
Backend â€” models/dia_aula.py
EstratÃ©gia de execuÃ§Ã£o
Abordagem obrigatÃ³ria
desmembrar junto com a fase que jÃ¡ toca aquele arquivo
evitar refatorar arquivos isoladamente sem motivo funcional
sempre preservar o comportamento antes de remover legado
Regra prÃ¡tica

Se um arquivo jÃ¡ vai ser alterado por um slice e estÃ¡ excessivamente concentrado, o desmembramento deve ocorrer na mesma janela, desde que:

nÃ£o aumente muito o risco;
nÃ£o altere contratos;
produza uma estrutura mais clara para o passo seguinte.
Riscos
Desmembrar cedo demais e introduzir regressÃµes.
Desmembrar tarde demais e empilhar mais lÃ³gica sobre arquivos ruins.
Criar fragmentaÃ§Ã£o excessiva sem ganho real.
Misturar refatoraÃ§Ã£o estrutural com mudanÃ§a de domÃ­nio e gerar diffs difÃ­ceis de revisar.
CritÃ©rios de aceite
Arquivos crÃ­ticos deixam de concentrar responsabilidades incompatÃ­veis.
O workspace de evento passa a ter uma estrutura mais modular.
A navegaÃ§Ã£o deixa de depender excessivamente de AulaPage.
A sessÃ£o/auth fica mais clara e evolutiva.
NÃ£o hÃ¡ quebra de contrato por causa do desmembramento.
Checklist de validaÃ§Ã£o
 AulaPage deixou de ser centro semÃ¢ntico da experiÃªncia.
 HÃ¡ separaÃ§Ã£o clara entre page, workspace e painÃ©is.
 AppRoutes nÃ£o concentra toda a lÃ³gica de roteamento.
 AuthContext nÃ£o concentra sozinho toda a lÃ³gica de auth/sessÃ£o.
 dias.py foi mapeado como ponto crÃ­tico de backend.
 workspace_aula.py tem plano explÃ­cito de modularizaÃ§Ã£o.
 CritÃ©rios de priorizaÃ§Ã£o

Um arquivo entra nesta fase quando apresentar um ou mais dos seguintes sinais:

mistura de UI e regra de domÃ­nio;
mistura de dados e navegaÃ§Ã£o;
mistura de renderizaÃ§Ã£o e persistÃªncia;
tamanho elevado com baixa coesÃ£o;
reutilizaÃ§Ã£o difÃ­cil;
impacto direto na migraÃ§Ã£o para Evento.
Arquivos candidatos prioritÃ¡rios â€” Frontend
1. frontend/jubileu-web/src/pages/dias/AulaPage.tsx

Problema

nome e semÃ¢ntica legados;
tende a virar ponto de acoplamento entre rota, workspace e domÃ­nio;
risco alto de acumular compatibilidade, conversÃ£o de rota e renderizaÃ§Ã£o de painÃ©is em um lugar sÃ³.

DivisÃ£o sugerida

pages/eventos/EventoPage.tsx â†’ pÃ¡gina canÃ´nica
pages/dias/AulaPage.tsx â†’ wrapper/compatibilidade temporÃ¡ria
workspaces/evento/WorkspaceEventoPage.tsx â†’ centro real da experiÃªncia
2. frontend/jubileu-web/src/hooks/useWorkspaceAula.ts

Problema

hook legado tende a carregar conceitos de aula para uma experiÃªncia que passarÃ¡ a ser centrada em evento;
alto risco de virar ponto de acoplamento entre polling, carregamento, transformaÃ§Ã£o e semÃ¢ntica legada.

DivisÃ£o sugerida

hooks/useWorkspaceEvento.ts
hooks/useEventoCapabilities.ts
hooks/useEventoRefetch.ts ou equivalente, se houver lÃ³gica de atualizaÃ§Ã£o separada
3. frontend/jubileu-web/src/services/eventosService.ts

Problema

tende a concentrar muitas operaÃ§Ãµes diferentes do domÃ­nio de eventos;
conforme crescerem aÃ§Ãµes e fluxos, perde coesÃ£o rapidamente.

DivisÃ£o sugerida

services/eventos/eventoActionsService.ts
services/eventos/eventoParticipantsService.ts
services/eventos/lancesService.ts

ou, se o projeto preferir menos arquivos:

manter um service Ãºnico agora, mas explicitar a futura divisÃ£o.
4. frontend/jubileu-web/src/context/AuthContext.tsx

Problema

mistura estado de sessÃ£o, comportamento de login e transiÃ§Ã£o de compatibilidade;
tende a crescer demais quando incorporar jogadorId, JWT, refresh e sessÃ£o operacional.

DivisÃ£o sugerida

context/AuthContext.tsx â†’ provider/contexto
hooks/useAuthSession.ts
services/authService.ts
utils/auth/* para helpers puros
5. frontend/jubileu-web/src/routes/AppRoutes.tsx

Problema

concentra todas as rotas do sistema;
conforme a navegaÃ§Ã£o de evento crescer, tende a ficar mais difÃ­cil de manter.

DivisÃ£o sugerida

routes/authRoutes.tsx
routes/diasRoutes.tsx
routes/eventosRoutes.tsx
routes/dashboardRoutes.tsx
routes/AppRoutes.tsx como agregador
6. frontend/jubileu-web/src/components/layout/Navbar.tsx

Problema

tende a acumular navegaÃ§Ã£o, estado de sessÃ£o, atalhos e contexto visual.

DivisÃ£o sugerida

components/layout/Navbar.tsx
components/layout/NavLinks.tsx
components/layout/UserMenu.tsx
components/layout/ContextBreadcrumb.tsx ou equivalente
Arquivos candidatos prioritÃ¡rios â€” Backend
1. backend/jubileu-api-fastapi/app/routers/dias.py

Problema

concentra mÃºltiplas responsabilidades:
dia
aula
presenÃ§a
times
estado de equipes
estado
workspace

DivisÃ£o sugerida

routers/dias.py â†’ apenas leitura/escopo de dia
routers/aulas.py â†’ lifecycle de aula/evento persistido
routers/aula_equipes.py
routers/aula_workspace.py

ou equivalente por mÃ³dulos/services, mantendo compatibilidade de rotas.

2. backend/jubileu-api-fastapi/app/services/workspace_aula.py

Problema

tende a centralizar meta, kpis, warnings, partidas e evoluÃ§Ã£o futura de timeline;
risco alto de virar â€œmega-serviÃ§oâ€ conforme WorkspaceEvento evoluir.

DivisÃ£o sugerida

services/workspace/meta_builder.py
services/workspace/kpis_builder.py
services/workspace/warnings_builder.py
services/workspace/partidas_builder.py
services/workspace/timeline_builder.py (quando existir)
3. backend/jubileu-api-fastapi/app/models/dia_aula.py

Problema

jÃ¡ foi apontado como mega-modelo na anÃ¡lise arquitetural;
concentra mÃºltiplas entidades e reduz coesÃ£o.

DivisÃ£o sugerida

models/dia.py
models/aula.py
models/time_aula.py
models/jogador_aula.py
models/partida.py
models/evento_participante.py
models/lance.py

sem renomear persistÃªncia nesta fase.

Ordem segura de desmembramento
Frontend â€” AulaPage / WorkspaceAula
Frontend â€” AppRoutes
Frontend â€” AuthContext
Frontend â€” Navbar
Frontend â€” eventosService
Backend â€” routers/dias.py
Backend â€” workspace_aula.py
Backend â€” models/dia_aula.py
EstratÃ©gia de execuÃ§Ã£o
Abordagem obrigatÃ³ria
desmembrar junto com a fase que jÃ¡ toca aquele arquivo
evitar refatorar arquivos isoladamente sem motivo funcional
sempre preservar o comportamento antes de remover legado
Regra prÃ¡tica

Se um arquivo jÃ¡ vai ser alterado por um slice e estÃ¡ excessivamente concentrado, o desmembramento deve ocorrer na mesma janela, desde que:

nÃ£o aumente muito o risco;
nÃ£o altere contratos;
produza uma estrutura mais clara para o passo seguinte.
Riscos
Desmembrar cedo demais e introduzir regressÃµes.
Desmembrar tarde demais e empilhar mais lÃ³gica sobre arquivos ruins.
Criar fragmentaÃ§Ã£o excessiva sem ganho real.
Misturar refatoraÃ§Ã£o estrutural com mudanÃ§a de domÃ­nio e gerar diffs difÃ­ceis de revisar.
CritÃ©rios de aceite
Arquivos crÃ­ticos deixam de concentrar responsabilidades incompatÃ­veis.
O workspace de evento passa a ter uma estrutura mais modular.
A navegaÃ§Ã£o deixa de depender excessivamente de AulaPage.
A sessÃ£o/auth fica mais clara e evolutiva.
NÃ£o hÃ¡ quebra de contrato por causa do desmembramento.
Checklist de validaÃ§Ã£o
 AulaPage deixou de ser centro semÃ¢ntico da experiÃªncia.
 HÃ¡ separaÃ§Ã£o clara entre page, workspace e painÃ©is.
 AppRoutes nÃ£o concentra toda a lÃ³gica de roteamento.
 AuthContext nÃ£o concentra sozinho toda a lÃ³gica de auth/sessÃ£o.
 dias.py foi mapeado como ponto crÃ­tico de backend.
 workspace_aula.py tem plano explÃ­cito de modularizaÃ§Ã£o.
