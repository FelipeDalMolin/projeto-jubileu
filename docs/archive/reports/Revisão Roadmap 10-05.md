> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# RevisÃ£o tÃ©cnica e roadmap do projeto Jubileu

## Resumo executivo

Este relatÃ³rio analisa o repositÃ³rio îˆ€urlîˆ‚FelipeDalMolin/projeto-jubileuîˆ‚https://github.com/FelipeDalMolin/projeto-jubileuîˆ a partir dos conectores habilitados em îˆ€urlîˆ‚GitHubîˆ‚https://github.comîˆ e îˆ€urlîˆ‚Linearîˆ‚https://linear.appîˆ. O quadro geral Ã© de um projeto que evoluiu em ciclos relativamente claros: bootstrap de backend/frontend no fim de 2025, onda forte de PRs focadas em `WorkspaceAula` e UI modular em janeiro de 2026, depois uma retomada importante em abril-maio de 2026 para promover `Evento` a entidade canÃ´nica, introduzir `Usuario` persistido e atualizar frontend, contratos e documentaÃ§Ã£o. O commit atual de topo observado no cÃ³digo Ã© â€œajustes e remoÃ§Ã£o Aula como domÃ­nioâ€, o que confirma que o corte canÃ´nico estÃ¡ materializado no working tree. îˆ€fileciteîˆ‚turn126file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn128file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn96file0îˆ‚L1-L1îˆ

A conclusÃ£o principal Ã© que o projeto estÃ¡ tecnicamente mais maduro do que a documentaÃ§Ã£o histÃ³rica de janeiro sugeria, mas ainda nÃ£o estÃ¡ â€œpronto para operar com baixo riscoâ€ sem fechar quatro frentes: hardening de autenticaÃ§Ã£o/segredos, automaÃ§Ã£o de CI/CD e release gate, consolidaÃ§Ã£o de polling/performance na UI operacional, e padronizaÃ§Ã£o visual/acessÃ­vel dos dashboards. O backlog aberto no Linear estÃ¡ coerente com esse diagnÃ³stico, especialmente nas trilhas DEV-35 a DEV-41 e DEV-27/DEV-32. îˆ€fileciteîˆ‚turn98file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn99file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn100file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn101file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn102file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn103file0îˆ‚L1-L1îˆ

As maiores prioridades para as prÃ³ximas semanas, em ordem, sÃ£o: fechar a migraÃ§Ã£o canÃ´nica com validaÃ§Ã£o real em PostgreSQL e rollback controlado; substituir/fortalecer o modelo atual de autenticaÃ§Ã£o; estabilizar a UI operacional com foco em polling, feedback de erro e consistÃªncia de design; e automatizar a esteira mÃ­nima de qualidade com pytest, lint, build, migraÃ§Ãµes e smoke checks. OrÃ§amento, tamanho do time, meta de release e ambiente produtivo nÃ£o foram especificados; por isso, as estimativas abaixo sÃ£o apresentadas em esforÃ§o por papel, nÃ£o como compromisso rÃ­gido de calendÃ¡rio. îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn128file0îˆ‚L1-L1îˆ

## Fontes, escopo e limitaÃ§Ãµes

As fontes primÃ¡rias usadas aqui foram: o prÃ³prio cÃ³digo e documentaÃ§Ã£o do repositÃ³rio, os PRs histÃ³ricos visÃ­veis no GitHub, os commits recuperÃ¡veis por busca no conector, e o backlog/projeto do Linear. No Linear, os artefatos centrais encontrados foram as equipes â€œJubileu Coreâ€ e â€œJubileu Devâ€, alÃ©m do projeto â€œEvento Canonico + Usuarioâ€, que formaliza a retomada de maio de 2026. îˆ€fileciteîˆ‚turn95file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn90file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn96file0îˆ‚L1-L1îˆ

HÃ¡ trÃªs limitaÃ§Ãµes relevantes. A primeira Ã© que o conector do GitHub nÃ£o expÃ´s uma listagem consolidada de tags/releases nativas nem uma contagem formal de contributors; por isso, a anÃ¡lise de releases foi ancorada no arquivo `docs/RELEASES.md` do prÃ³prio repositÃ³rio, e a anÃ¡lise de autoria se baseia na autoria observÃ¡vel em PRs e issues do Linear. A segunda Ã© que nÃ£o houve captura de runtime real em navegador, profiling ou Lighthouse; a avaliaÃ§Ã£o de UI/UX, performance e acessibilidade Ã© baseada em inspeÃ§Ã£o de cÃ³digo. A terceira Ã© que nÃ£o hÃ¡ evidÃªncia suficiente, nos conectores expostos, para afirmar a existÃªncia de pipelines automatizados; o que existe de forma comprovÃ¡vel Ã© uma validaÃ§Ã£o manual documentada por build/lint/pytest e smoke local. îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn111file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn112file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn113file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn114file0îˆ‚L1-L1îˆ

## EvoluÃ§Ã£o do projeto

A trajetÃ³ria observÃ¡vel do cÃ³digo tem quatro fases. A primeira, entre novembro e dezembro de 2025, Ã© de fundaÃ§Ã£o tÃ©cnica: entrada do frontend React/Vite, evoluÃ§Ã£o do backend FastAPI e vÃ¡rias correÃ§Ãµes de integraÃ§Ã£o, migraÃ§Ã£o e ambiente. A segunda, em janeiro de 2026, Ã© a fase mais â€œprocessadaâ€ por branches e PRs, quando entram `WorkspaceAula`, KPIs, warnings, UI modular, testes do endpoint versionado, fluxo de presenÃ§a, `TeamConfig` e status/tipo da aula. A terceira, em marÃ§o e abril de 2026, Ã© de organizaÃ§Ã£o documental e ajustes de autenticaÃ§Ã£o/evento. A quarta, jÃ¡ em maio de 2026, Ã© o corte de domÃ­nio: rotaÃ§Ã£o manual, decisÃ£o de `Evento` canÃ´nico, migraÃ§Ã£o de persistÃªncia e introduÃ§Ã£o de `Usuario`. îˆ€fileciteîˆ‚turn120file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn115file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn116file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn117file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn118file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn126file0îˆ‚L1-L1îˆ

O histÃ³rico de PRs confirma que o fluxo formal de integraÃ§Ã£o observado no GitHub foi especialmente forte em janeiro. PR #1 implementou o `WorkspaceAula` com endpoint versionado; PR #4 adicionou warnings e testes; PR #10 estabilizou `TeamConfig`; PR #11 consolidou a nova UI do workspace. Todas essas PRs foram mergeadas na branch `jubileu-v2`, com autoria observÃ¡vel concentrada em Felipe Dal Molin, o que sugere uma estrutura de manutenÃ§Ã£o altamente centralizada. îˆ€fileciteîˆ‚turn112file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn113file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn114file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn111file0îˆ‚L1-L1îˆ

Ã‰ importante notar tambÃ©m uma mudanÃ§a de convenÃ§Ã£o de branch. No GitHub histÃ³rico, as PRs usam `feature/DEV-*`; no Linear de maio, os itens jÃ¡ sugerem branches no padrÃ£o `felipemolin/dev-*`. Isso nÃ£o Ã© um problema em si, mas Ã© um sinal de drift de workflow: o projeto parece ter migrado de um modelo de feature branches â€œcurtas e semÃ¢nticasâ€ para um modelo mais orientado a issue e retomada contÃ­nua em branch pessoal. Sem padronizaÃ§Ã£o explÃ­cita, isso tende a elevar o custo de revisÃ£o, rastreabilidade e automaÃ§Ã£o. îˆ€fileciteîˆ‚turn112file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn114file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn98file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn99file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn100file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn101file0îˆ‚L1-L1îˆ

Outro ponto importante Ã© a divergÃªncia documental interna. `docs/DECISIONS.md` ainda registra que `WorkspaceEvento` deveria ser introduzido como adapter/read-model de transiÃ§Ã£o e que `WorkspaceAula` permaneceria vÃ¡lido durante a transiÃ§Ã£o. JÃ¡ `docs/ROADMAP.md` e `docs/API.md` afirmam explicitamente que `Evento` Ã© a entidade canÃ´nica, que as rotas pÃºblicas baseadas em `Aula` foram removidas e que a rota canÃ´nica do frontend passou a ser `/dias/:dataIso/eventos/:eventoId`. O cÃ³digo atual confirma a segunda visÃ£o. Portanto, existe uma decisÃ£o antiga que jÃ¡ foi superada na prÃ¡tica, mas ainda nÃ£o foi formalmente substituÃ­da por um ADR de corte. îˆ€fileciteîˆ‚turn130file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn128file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn129file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn126file0îˆ‚L1-L1îˆ

```mermaid
timeline
    title EvoluÃ§Ã£o observÃ¡vel do projeto
    2025-11 : Entrada do frontend React/Vite
            : Primeiros commits de UI operacional
    2025-12 : Bootstrap de ambiente, backend FastAPI, fixes de integraÃ§Ã£o
    2026-01 : WorkspaceAula
            : KPIs e warnings
            : status/tipo da aula
            : confirmaÃ§Ã£o de presenÃ§as
            : TeamConfig
            : nova UI modular
    2026-04 : organizaÃ§Ã£o de docs e ajustes de auth/evento
    2026-05 : rotaÃ§Ã£o manual
            : corte canÃ´nico para Evento
            : Usuario persistido
            : roadmap/releases/API atualizados
```

A linha do tempo acima resume a cadÃªncia observada no histÃ³rico de commits, PRs e nos artefatos de roadmap/release do repositÃ³rio. îˆ€fileciteîˆ‚turn115file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn111file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn126file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ

## DiagnÃ³stico tÃ©cnico do cÃ³digo e dos dashboards

Do ponto de vista arquitetural, o estado atual Ã© coerente com o corte â€œEvento-firstâ€. O arquivo principal da API inclui routers de `dias`, `eventos`, `partidas`, `auth` e `usuarios`, e tambÃ©m preserva aliases sob `/api`. No domÃ­nio, `Evento`, `TimeEvento`, `JogadorEvento` e `Usuario` jÃ¡ aparecem como modelos ativos; o roadmap e a API pÃºblica tambÃ©m foram atualizados para essa nomenclatura. Isso Ã© positivo porque reduz a ambiguidade entre modelo persistido, contrato pÃºblico e UI. îˆ€fileciteîˆ‚turn126file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn129file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn128file0îˆ‚L1-L1îˆ

Ao mesmo tempo, hÃ¡ um risco forte em autenticaÃ§Ã£o e seguranÃ§a operacional. O backend usa `JWT_SECRET` com valor default `"CHANGE_ME"`, e o serviÃ§o de autenticaÃ§Ã£o implementa seu prÃ³prio mecanismo com `sha256`, `hmac` e token caseiro, alÃ©m de popular usuÃ¡rios default e persisti-los. No frontend, o token Ã© salvo em `localStorage` e a sessÃ£o Ã© reconstruÃ­da a partir desse storage. Isso funciona para MVP local, mas Ã© fraco para um ambiente minimamente exposto: hÃ¡ acoplamento excessivo a segredos default, superfÃ­cie para vazamento de token em XSS e ausÃªncia de uma camada explÃ­cita de rotaÃ§Ã£o/revogaÃ§Ã£o/sessÃ£o segura. îˆ€fileciteîˆ‚turn29file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn31file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn37file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn38file0îˆ‚L1-L1îˆ

No backend de domÃ­nio, a situaÃ§Ã£o Ã© melhor. HÃ¡ suÃ­te de testes pytest relevante, com `conftest.py` configurando banco SQLite em memÃ³ria e `TestClient` para FastAPI, alÃ©m de testes de smoke e contratos crÃ­ticos de rota. O repositÃ³rio tambÃ©m documenta que `pytest`, `npm run build` e `npm run lint` foram executados com sucesso em 2026-05-09 para o corte canÃ´nico. O ponto fraco aqui nÃ£o Ã© ausÃªncia total de testes, e sim o gap entre teste â€œunitÃ¡rio/in-memoryâ€ e validaÃ§Ã£o real de produÃ§Ã£o: as prÃ³prias notas de release falam em risco PostgreSQL e em smoke visual pendente no navegador. îˆ€fileciteîˆ‚turn71file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn72file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn69file22îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn69file29îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ

No frontend operacional, a principal fragilidade Ã© performance previsÃ­vel sob polling. O `QueryClient` usa `staleTime: 1000` e `retry: 1`; a `WorkspaceEventoPage` abre mÃºltiplas queries com `refetchInterval` entre 2200 ms e 4000 ms, dependendo da aba, e o dashboard home tambÃ©m forÃ§a carregamentos em paralelo na montagem. Isso explica por que o Linear abriu explicitamente DEV-32 para hardening de polling/auth por canal: o cÃ³digo jÃ¡ estÃ¡ melhor do que uma UI puramente â€œmanualâ€, mas ainda pode fan-outar chamadas, produzir rajadas de 401 e degradar bastante a experiÃªncia em rede ruim ou sessÃ£o expirada. îˆ€fileciteîˆ‚turn66file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn40file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn53file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn102file0îˆ‚L1-L1îˆ

Nos dashboards, hÃ¡ um achado importante de consistÃªncia visual/tÃ©cnica. O `package.json` da web lista React, React Router, TanStack Query e Tailwind; `main.tsx` importa apenas `index.css`; `index.css` inicia apenas Tailwind. PorÃ©m as telas de dashboard usam amplamente classes como `container`, `row`, `col-*`, `card`, `btn`, `alert`, `placeholder-wave` e `table-responsive`, que sÃ£o idiomÃ¡ticas de Bootstrap. Como eu nÃ£o encontrei import explÃ­cito de Bootstrap nos arquivos inspecionados, hÃ¡ grande chance de dependÃªncia implÃ­cita, CSS residual ou inconsistÃªncia de design. Na prÃ¡tica, isso tende a produzir dÃ­vida visual, fragilidade em responsividade e dificuldade para construir um design system coerente. îˆ€fileciteîˆ‚turn12file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn58file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn59file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn53file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn131file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn132file0îˆ‚L1-L1îˆ

Em UX funcional, os dashboards sÃ£o Ãºteis como â€œscan surfacesâ€, mas ainda sÃ£o superficiais. `DashboardHome` exibe resumos, atividade recente e top artilheiros; `DashboardJogadores` e `DashboardPartidas` jÃ¡ tÃªm filtros, ordenaÃ§Ã£o e drill-down simples. O problema Ã© que eles nÃ£o fecham o ciclo analÃ­tico: nÃ£o hÃ¡ visualizaÃ§Ã£o grÃ¡fica de sÃ©rie temporal, nÃ£o hÃ¡ comparaÃ§Ã£o entre turmas, nÃ£o hÃ¡ meta explÃ­cita por perÃ­odo, e a hierarquia visual ainda depende muito de tabelas e cards genÃ©ricos. Isso Ã© coerente com o prÃ³prio roadmap, que classifica DEV-43 como apenas parcialmente implementado. îˆ€fileciteîˆ‚turn53file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn131file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn132file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn128file0îˆ‚L1-L1îˆ

HÃ¡ tambÃ©m gaps claros de acessibilidade. O `index.html` ainda estÃ¡ com `lang="en"`, tÃ­tulo genÃ©rico `jubileu-web` e favicon padrÃ£o do Vite. O componente de tabs usa apenas botÃµes estilizados, sem semÃ¢ntica ARIA de tabs/tablist/panels. O `RankingTable` torna `<th>` clicÃ¡vel com `role="button"` e `onClick`, mas sem affordance de teclado equivalente. Os botÃµes customizados nÃ£o trazem foco visÃ­vel explÃ­cito. Em resumo: a interface deve funcionar para muitos usuÃ¡rios, mas ainda nÃ£o estÃ¡ pronta para ser considerada robusta em acessibilidade. îˆ€fileciteîˆ‚turn55file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn51file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn52file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn133file0îˆ‚L1-L1îˆ

### SÃ­ntese dos achados tÃ©cnicos

| Ãrea | DiagnÃ³stico | Severidade | Leitura prÃ¡tica |
|---|---|---:|---|
| Modelo de domÃ­nio | `Evento` e `Usuario` jÃ¡ sÃ£o canÃ´nicos no cÃ³digo ativo | Alta | DecisÃ£o correta; precisa fechamento formal e rollout |
| SeguranÃ§a/auth | segredo default, token em `localStorage`, auth caseira | Alta | principal risco operacional imediato |
| Testes backend | existem e cobrem contratos crÃ­ticos | MÃ©dia | base razoÃ¡vel, mas ainda insuficiente para release sem CI |
| Frontend tests | nÃ£o hÃ¡ evidÃªncia forte de suÃ­te dedicada na inspeÃ§Ã£o | MÃ©dia | build/lint nÃ£o substituem teste de comportamento |
| Polling/performance | mÃºltiplas queries com intervalos curtos e `staleTime` baixo | Alta | risco de flood, UX instÃ¡vel e erros repetidos |
| Dashboards | Ãºteis, mas visualmente inconsistentes e pouco analÃ­ticos | MÃ©dia | precisam de design system e mais profundidade |
| Acessibilidade | tabs, tabela ordenÃ¡vel, foco e metadados de documento incompletos | MÃ©dia | correÃ§Ã£o relativamente barata e de alto valor |
| CI/CD | validaÃ§Ã£o documentada Ã© manual | Alta | gargalo para previsibilidade e release seguro |

A tabela acima sintetiza o que o cÃ³digo e os artefatos internos mostram hoje: evoluÃ§Ã£o boa no domÃ­nio e no contrato, mas maturidade ainda incompleta em seguranÃ§a, operaÃ§Ã£o e governanÃ§a de qualidade. îˆ€fileciteîˆ‚turn126file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn29file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn31file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn71file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn72file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn40file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn53file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ

## Backlog priorizado e recomendaÃ§Ãµes de produto

O backlog aberto do Linear Ã© razoavelmente alinhado ao estado real do repositÃ³rio. Em especial, DEV-35 a DEV-38 tratam exatamente do corte canÃ´nico de `Evento` e `Usuario`; DEV-32 trata do problema de polling/auth que o cÃ³digo ainda materializa; DEV-27 cobre runtime/gateway/deploy, que continua como dependÃªncia para um release com menor risco; e DEV-41 fecha docs, validaÃ§Ã£o e smoke final. Isso indica que o backlog nÃ£o estÃ¡ â€œdesconectadoâ€ do cÃ³digo â€” ao contrÃ¡rio, ele estÃ¡ bem calibrado, mas precisa ser reordenado em torno de risco e nÃ£o apenas de sequÃªncia lÃ³gica. îˆ€fileciteîˆ‚turn98file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn99file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn100file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn101file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn102file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn103file0îˆ‚L1-L1îˆ

### PriorizaÃ§Ã£o recomendada

| Prioridade | Item | Motivo | Base sugerida |
|---|---|---|---|
| P0 | Fechar migraÃ§Ã£o canÃ´nica `Evento` + `Usuario` com validaÃ§Ã£o PostgreSQL e rollback | Ã© a espinha dorsal da mudanÃ§a de domÃ­nio e ainda concentra risco de quebra | DEV-35, DEV-36, DEV-38, DEV-41 |
| P0 | Hardening de autenticaÃ§Ã£o e segredos | hoje Ã© o maior risco operacional concreto | tarefa nova derivada do cÃ³digo atual |
| P0 | Automatizar CI mÃ­nimo | sem isso, o release gate continua manual | DEV-41 + DEV-27 |
| P1 | Hardening de polling/auth por canal | problema jÃ¡ identificado no Linear e ainda visÃ­vel no cÃ³digo | DEV-32 |
| P1 | ConsolidaÃ§Ã£o visual e funcional dos dashboards | dashboards estÃ£o parcialmente entregues e ainda inconsistentes | DEV-40 |
| P1 | Infra MVP e gateway de produÃ§Ã£o | necessÃ¡rio para rollout confiÃ¡vel | DEV-27 |
| P2 | Testes frontend e smoke visual automatizado | fecha lacuna de regressÃ£o de UI | tarefa nova ou sub-slice |
| P2 | Redesign analÃ­tico dos dashboards | agrega valor de produto, mas nÃ£o Ã© o maior risco atual | evoluÃ§Ã£o apÃ³s estabilidade |

Minha leitura Ã© que seria um erro comeÃ§ar agora por â€œembelezarâ€ dashboards ou abrir novas features de fluxo enquanto auth, migraÃ§Ã£o, CI e polling ainda estÃ£o incompletos. O custo de retrabalho nessa ordem errada seria alto. îˆ€fileciteîˆ‚turn102file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn103file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ

### Melhorias visuais e funcionais para os dashboards

| Frente | Estado atual | Melhoria proposta |
|---|---|---|
| Design system | mistura de Tailwind com convenÃ§Ãµes visuais de Bootstrap | escolher uma base Ãºnica e aplicar tokens/componentes consistentes |
| KPI cards | cards funcionais, mas genÃ©ricos | destacar variaÃ§Ã£o vs perÃ­odo anterior e contexto da turma |
| ExploraÃ§Ã£o analÃ­tica | tabelas e listas predominam | adicionar grÃ¡ficos simples de sÃ©rie temporal, distribuiÃ§Ã£o e comparaÃ§Ã£o |
| NavegaÃ§Ã£o | telas separadas, com drill-down local | padronizar filtros persistidos e breadcrumbs leves |
| Erros e vazios | jÃ¡ existem alerts bÃ¡sicos | tornar estados vazios instrutivos e com CTA operacional |
| Responsividade | â€œrolÃ¡vel no mobileâ€, mas pouco refinamento | revisar spacing, densidade e hierarquia para uso em quadra/celular |
| Acessibilidade | semÃ¢ntica incompleta | corrigir tabs, foco, sortable headers e metadados de documento |

Para consolidar a UI, eu recomendo **manter React + Tailwind + componentes prÃ³prios**, mas eliminar o uso incidental de convenÃ§Ãµes Bootstrap sem dependÃªncia explÃ­cita. Se a intenÃ§Ã£o for ganhar velocidade de consistÃªncia, hÃ¡ dois caminhos razoÃ¡veis: ou adotar uma camada de componentes mais robusta por cima do Tailwind jÃ¡ existente, ou importar formalmente Bootstrap e assumir essa decisÃ£o em todo o app. O pior cenÃ¡rio Ã© o atual hÃ­brido implÃ­cito. îˆ€fileciteîˆ‚turn12file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn59file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn53file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn131file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn132file0îˆ‚L1-L1îˆ

## Roadmap sugerido

A proposta abaixo assume **capacidade nÃ£o especificada**. Por isso, as estimativas estÃ£o em **horas/pessoa** e o cronograma em **milestones de esforÃ§o**. Para transformar isso em calendÃ¡rio, eu assumiria como referÃªncia mÃ­nima: 1 pessoa full-stack principal, com apoio parcial de QA e DevOps. Se houver menos capacidade, o correto Ã© alongar o prazo, nÃ£o cortar a validaÃ§Ã£o.

### Plano de execuÃ§Ã£o

| Milestone | Tarefa | EsforÃ§o | DependÃªncias | Papel sugerido |
|---|---|---:|---|---|
| Fechamento canÃ´nico | validar migrations `0013` e `0014` em PostgreSQL limpo, com upgrade/downgrade e preservaÃ§Ã£o de dados | 12â€“16h | nenhuma | Backend engineer |
| Fechamento canÃ´nico | revisar rotas pÃºblicas e remover resÃ­duos de `Aula` em contrato ativo | 6â€“10h | migration validada | Backend engineer |
| Fechamento canÃ´nico | revisar `/usuario` e `auth/me` com foco em perfil persistido, consistÃªncia de campos e histÃ³rico | 8â€“12h | migration validada | Full-stack engineer |
| SeguranÃ§a operacional | substituir hash/token caseiros por implementaÃ§Ã£o mais robusta e remover segredos default | 16â€“24h | perfil persistido estÃ¡vel | Backend engineer |
| SeguranÃ§a operacional | revisar armazenamento de token no frontend e expiraÃ§Ã£o de sessÃ£o | 8â€“12h | hardening auth backend | Frontend engineer |
| Estabilidade de UI | consolidar polling por canal, backoff e tratamento central de 401/erro de rede | 12â€“16h | auth estÃ¡vel | Frontend engineer |
| Estabilidade de UI | unificar design system e remover dependÃªncia implÃ­cita de Bootstrap nas telas de dashboard | 20â€“28h | nenhuma | Frontend engineer |
| Qualidade | criar pipeline CI com lint, build, pytest, Alembic e smoke mÃ­nimo | 12â€“18h | migrations e auth revisados | DevOps / Full-stack |
| Qualidade | adicionar suÃ­te frontend mÃ­nima de comportamento crÃ­tico | 16â€“24h | UI consolidada | Frontend engineer + QA |
| Release | executar smoke integrado login â†’ usuÃ¡rio â†’ evento AULA â†’ JOGO_LIVRE â†’ dashboards | 8â€“12h | CI verde | QA / Product engineer |
| Release | publicar release notes, decisÃ£o arquitetural de supersessÃ£o e checklist de rollback | 6â€“8h | smoke verde | Tech lead |

### Cronograma recomendado

```mermaid
gantt
    title Roadmap recomendado para o prÃ³ximo ciclo
    dateFormat  YYYY-MM-DD
    section Fechamento canÃ´nico
    Migrations PostgreSQL e rollback       :a1, 2026-05-12, 3d
    Contratos Evento-only                  :a2, after a1, 2d
    Usuario/Auth consistente               :a3, after a1, 2d
    section SeguranÃ§a e estabilidade
    Hardening auth e segredos              :b1, after a3, 4d
    Polling, 401 e backoff                 :b2, after b1, 3d
    section UI e dashboards
    ConsolidaÃ§Ã£o visual do dashboard       :c1, 2026-05-19, 5d
    Acessibilidade e estados vazios        :c2, after c1, 2d
    section Qualidade e release
    CI com build/lint/pytest/migration     :d1, 2026-05-19, 3d
    Testes frontend crÃ­ticos               :d2, after d1, 4d
    Smoke integrado e release notes        :d3, after d2, 2d
```

Se eu tivesse que transformar isso em milestones executÃ¡veis, seriam estes:

| Milestone | CritÃ©rio de pronto |
|---|---|
| Canonical cut fechado | migrations seguras, contratos `Evento-only`, `/usuario` e sessÃ£o estÃ¡veis |
| OperaÃ§Ã£o segura | auth endurecida, sem segredo default e sem sessÃ£o frÃ¡gil no cliente |
| UI estÃ¡vel | polling sem flood, dashboards coerentes, estados de erro/vazio claros |
| Release repetÃ­vel | pipeline CI verde, smoke integrado reproduzÃ­vel e rollback documentado |

O roadmap acima conversa diretamente com o projeto â€œEvento Canonico + Usuarioâ€ e com os itens abertos de DEV-35 a DEV-41, mas reordena o esforÃ§o em funÃ§Ã£o de reduÃ§Ã£o de risco. îˆ€fileciteîˆ‚turn96file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn98file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn99file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn100file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn101file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ

## Processo, mÃ©tricas, reproduÃ§Ã£o e riscos

O processo de engenharia precisa ficar mais explÃ­cito do que estÃ¡ hoje. Minha recomendaÃ§Ã£o Ã©: manter branches curtas por issue, exigir PR para `jubileu-v2` ou para uma branch principal protegida, usar template de PR com link para a issue do Linear, checklist de migraÃ§Ã£o e checklist de validaÃ§Ã£o, e adotar um â€œrelease gateâ€ automatizado. Em um cenÃ¡rio de time pequeno ou solo-maintainer, isso nÃ£o Ã© burocracia; Ã© o mecanismo que evita regressÃ£o silenciosa em auth, migraÃ§Ã£o e UI. O prÃ³prio repositÃ³rio jÃ¡ mostra que as mudanÃ§as de maior valor vieram de slices bem delimitados e referÃªncias claras entre Core, Dev e docs. îˆ€fileciteîˆ‚turn130file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn96file0îˆ‚L1-L1îˆ

As mÃ©tricas que eu acompanharia sÃ£o poucas, mas objetivas: tempo de ciclo por issue; tamanho mÃ©dio de PR; taxa de falha do smoke integrado; tempo para corrigir quebra de migraÃ§Ã£o; volume de requests por minuto nas telas com polling; taxa de 401 por sessÃ£o; tempo de carregamento de `WorkspaceEvento`; e percentual de builds verdes consecutivas. Essas mÃ©tricas atacam diretamente os riscos reais evidenciados pelo cÃ³digo e pelo backlog, em vez de gerar um dashboard de engenharia â€œbonito porÃ©m inÃºtilâ€. îˆ€fileciteîˆ‚turn40file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn66file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn102file0îˆ‚L1-L1îˆ

### Comandos e queries Ãºteis para reproduzir a anÃ¡lise

```bash
# Clonar e entrar na branch principal observada
git clone https://github.com/FelipeDalMolin/projeto-jubileu.git
cd projeto-jubileu
git checkout jubileu-v2

# Linha do tempo e evoluÃ§Ã£o
git log --graph --decorate --oneline --all
git log --since="2025-11-01" --date=short --pretty=format:"%ad | %h | %s"
git shortlog -sn --all

# HistÃ³rico focado no corte canÃ´nico
git log --grep="Evento" --grep="Workspace" --grep="DEV-" --all --oneline
git show 6fb2c65e37caf8710dd6f9ce8394e169e311ee93 --stat
git show 931244b5be7ca091d2fcc06a9bdaedf02b404924 --stat

# Drift de nomenclatura e compatibilidade
git grep -nE "WorkspaceAula|/aulas/|aula_id|aulaId" -- . ':(exclude)backend/jubileu-api-fastapi/alembic/versions/*'
git grep -nE "WorkspaceEvento|/eventos/|evento_id|eventoId" -- .

# Polling e performance
git grep -nE "refetchInterval|staleTime|force: true" frontend/jubileu-web/src

# SeguranÃ§a e sessÃ£o
git grep -nE "JWT_SECRET|CHANGE_ME|sha256|localStorage|access_token" backend frontend

# Dashboards e UI
git grep -nE "container|row|col-|card|btn|alert|table-responsive" frontend/jubileu-web/src/pages/dashboard frontend/jubileu-web/src/components/dashboard

# Backend
cd backend/jubileu-api-fastapi
python -m pytest
alembic upgrade head

# Frontend
cd ../../frontend/jubileu-web
npm install
npm run lint
npm run build
```

Os comandos acima refletem exatamente os focos que apareceram na inspeÃ§Ã£o: histÃ³rico, corte canÃ´nico, drift de nomenclatura, polling, seguranÃ§a, dashboards e validaÃ§Ã£o bÃ¡sica. Eles tambÃ©m sÃ£o coerentes com os prÃ³prios artefatos de release e roadmap do projeto. îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn128file0îˆ‚L1-L1îˆ

### Riscos e mitigaÃ§Ã£o

| Risco | Impacto | Probabilidade | MitigaÃ§Ã£o |
|---|---|---:|---|
| MigraÃ§Ã£o `Aula` â†’ `Evento` falhar em PostgreSQL real | Muito alto | MÃ©dia | ambiente clone, backup, upgrade/downgrade automatizado, checklist de rollback |
| Auth atual vazar ou manter sessÃ£o insegura | Muito alto | MÃ©dia/alta | remover segredos default, endurecer token/hashing, revisar storage de sessÃ£o |
| Polling gerar flood/401 em cascata | Alto | Alta | consolidaÃ§Ã£o por canal, backoff, cache melhor configurado, telemetria |
| Dashboards quebrarem visualmente por stack hÃ­brida CSS | MÃ©dio | Alta | escolher framework visual Ãºnico e refatorar telas crÃ­ticas |
| Release continuar dependente de smoke manual | Alto | Alta | CI com lint/build/pytest/migration + smoke automatizado |
| DivergÃªncia documental causar retrabalho | MÃ©dio | MÃ©dia | publicar ADR de supersessÃ£o e limpar docs antigas conflituosas |
| ConcentraÃ§Ã£o de manutenÃ§Ã£o em uma pessoa | MÃ©dio | Alta | PR checklist, docs de rollback, automaÃ§Ã£o, fatiamento menor de mudanÃ§as |

A mitigaÃ§Ã£o mais importante, no curto prazo, nÃ£o Ã© uma feature de produto: Ã© transformar o corte canÃ´nico em uma mudanÃ§a segura, repetÃ­vel e auditÃ¡vel. îˆ€fileciteîˆ‚turn126file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn127file0îˆ‚L1-L1îˆ îˆ€fileciteîˆ‚turn130file0îˆ‚L1-L1îˆ

### QuestÃµes em aberto e limitaÃ§Ãµes

Alguns pontos continuam abertos porque nÃ£o estÃ£o especificados ou nÃ£o ficaram observÃ¡veis nos conectores disponÃ­veis: orÃ§amento; nÃºmero de desenvolvedores disponÃ­veis; ambiente alvo de produÃ§Ã£o/staging; polÃ­tica de secrets; existÃªncia formal de tags/releases do GitHub; e contagem consolidada de contributors. TambÃ©m nÃ£o foi possÃ­vel validar a experiÃªncia visual em runtime ou medir performance real de browser. Esses itens nÃ£o invalidam a anÃ¡lise, mas devem ser assumidos explicitamente antes de transformar este roadmap em compromisso de entrega.
