# MODELO DE DOMÃNIO (Slice 00 - Baseline)

## Objetivo

Este documento descreve o estado atual do modelo de domÃ­nio utilizado pelo backend do Jubileu e a direÃ§Ã£o canÃ´nica aprovada para a refatoraÃ§Ã£o incremental.

---

## VisÃ£o geral do estado atual

No estado atual do backend, a persistÃªncia e parte relevante dos fluxos de negÃ³cio ainda estÃ£o centradas no conceito legado de **`Aula`**.

Ao mesmo tempo, a direÃ§Ã£o funcional e semÃ¢ntica do projeto jÃ¡ aponta para o conceito mais amplo de **`Evento`**, que deverÃ¡ se tornar o eixo canÃ´nico do domÃ­nio ao longo das prÃ³ximas slices de refatoraÃ§Ã£o.

Portanto, o sistema hoje opera em uma condiÃ§Ã£o de **transiÃ§Ã£o controlada**, na qual:

- a persistÃªncia principal ainda utiliza `Aula`
- parte da API e da linguagem de negÃ³cio jÃ¡ converge para `Evento`
- a compatibilidade deve ser preservada atÃ© que a reorganizaÃ§Ã£o de domÃ­nio seja concluÃ­da

---

## Conceitos de negÃ³cio atualmente relevantes

Os principais conceitos de negÃ³cio identificados no projeto sÃ£o:

- **UsuÃ¡rio**: identidade de acesso ao sistema
- **Jogador**: entidade esportiva associada ou nÃ£o a um usuÃ¡rio
- **Dia**: agrupador lÃ³gico e temporal dos acontecimentos
- **Aula**: agregado persistido atual que concentra comportamento de evento no backend legado
- **Evento**: conceito canÃ´nico de negÃ³cio em direÃ§Ã£o de adoÃ§Ã£o gradual
- **Time**: agrupamento de jogadores dentro do contexto de uma aula/evento
- **Partida**: unidade jogÃ¡vel vinculada ao contexto de aula/evento
- **ParticipaÃ§Ã£o**: presenÃ§a, RSVP, check-in e estado de disponibilidade do jogador
- **Lance**: registro operacional de acontecimentos da partida
- **EstatÃ­sticas**: consolidaÃ§Ã£o de mÃ©tricas por jogador/partida
- **ConfiguraÃ§Ã£o de times**: snapshot/versionamento do estado de composiÃ§Ã£o das equipes
- **Workspace**: visÃ£o agregada derivada do estado operacional do evento/aula

---

## Entidades persistidas atuais

As principais entidades persistidas atualmente, conforme a modelagem vigente, sÃ£o:

- `Dia`
- `Aula`
- `TimeAula`
- `JogadorAula`
- `Partida`
- `EstatisticaJogadorPartida`
- `EventoParticipante`
- `Lance`
- `TeamConfig`

### ObservaÃ§Ã£o importante

Nem todas as entidades acima possuem o mesmo peso arquitetural no domÃ­nio.

Na prÃ¡tica:

- `Dia`, `Aula` e `Partida` representam o eixo principal do fluxo persistido atual
- `TimeAula`, `JogadorAula` e `EventoParticipante` participam da composiÃ§Ã£o e do controle operacional
- `Lance` e `EstatisticaJogadorPartida` representam registro e consolidaÃ§Ã£o de execuÃ§Ã£o esportiva
- `TeamConfig` sustenta comportamento crÃ­tico de snapshot, versionamento e reconstruÃ§Ã£o de equipes

---

## SituaÃ§Ã£o de transiÃ§Ã£o semÃ¢ntica

A principal tensÃ£o atual do domÃ­nio estÃ¡ na coexistÃªncia entre:

- o **modelo persistido legado**, centrado em `Aula`
- a **direÃ§Ã£o canÃ´nica futura**, centrada em `Evento`

Regras de transiÃ§Ã£o nesta baseline:

- `Aula` permanece como agregado persistido principal nesta fase
- o nome canÃ´nico `Evento` pode ser introduzido gradualmente nas camadas de serviÃ§o, API e documentaÃ§Ã£o
- renomeaÃ§Ã£o precoce de persistÃªncia **nÃ£o Ã© permitida** nas slices de estabilizaÃ§Ã£o
- qualquer convergÃªncia semÃ¢ntica deve preservar contratos existentes e comportamento observado pelo frontend

---

## SobreposiÃ§Ã£o semÃ¢ntica conhecida

Existe uma sobreposiÃ§Ã£o de responsabilidade e significado entre:

- `JogadorAula`
- `EventoParticipante`

Essa sobreposiÃ§Ã£o indica que o domÃ­nio ainda nÃ£o estÃ¡ totalmente convergido em torno de um Ãºnico modelo de participaÃ§Ã£o.

Por isso:

- essa Ã¡rea deve ser tratada como **zona de transiÃ§Ã£o controlada**
- nÃ£o deve haver unificaÃ§Ã£o apressada
- futuras slices devem esclarecer papÃ©is, ownership e invariantes antes de qualquer consolidaÃ§Ã£o

---

## DireÃ§Ã£o canÃ´nica aprovada

A direÃ§Ã£o canÃ´nica aprovada para o domÃ­nio Ã©:

`Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`

Essa direÃ§Ã£o representa o **alvo semÃ¢ntico e organizacional** do backend, mas **nÃ£o descreve integralmente a persistÃªncia atual**.

Em outras palavras:

- Ã© a direÃ§Ã£o correta para modularizaÃ§Ã£o futura
- nÃ£o deve ser confundida com o estado real jÃ¡ implementado no banco e nos fluxos atuais

---

## Regras crÃ­ticas que devem permanecer estÃ¡veis

As seguintes regras e comportamentos sÃ£o sensÃ­veis e nÃ£o podem ser quebrados durante a estabilizaÃ§Ã£o e as slices iniciais de refatoraÃ§Ã£o:

- validaÃ§Ãµes de ownership pai-filho em rotas aninhadas de dia/aula/evento
- regras de transiÃ§Ã£o por status (`PLANEJADA`, `EM_ANDAMENTO`, `CONCLUIDA`)
- consistÃªncia de snapshot e versionamento de equipes
- lÃ³gica de versÃ£o ativa em `TeamConfig`
- comportamento de versÃ£o combinada do workspace
- fluxo de RSVP para check-in
- ordenaÃ§Ã£o por chegada com base em `checked_at`
- transiÃ§Ãµes do ciclo de vida das partidas
- autorizaÃ§Ã£o de backend como fonte de verdade

---

## SuperfÃ­cies de domÃ­nio protegidas nesta fase

Os seguintes comportamentos devem ser considerados congelados, salvo refatoraÃ§Ã£o explÃ­cita em slice dedicada:

- agregaÃ§Ã£o do workspace
- versionamento de `TeamConfig`
- lÃ³gica de versÃ£o combinada
- derivaÃ§Ã£o de KPIs e avisos
- fluxo RSVP -> check-in
- comportamento de ordenaÃ§Ã£o por `checked_at`
- transiÃ§Ãµes de ciclo de vida da partida

---

## Hotspots conhecidos

Os principais pontos criticos do dominio atual sao:

- routers ainda combinam orquestracao HTTP com regras que devem continuar migrando para servicos
- `partidas`, `lances`, participantes e rotacao sao superficies sensiveis porque dependem de `evento_id`
- `EventoParticipante` e snapshot de jogador no evento precisam permanecer semanticamente separados
- `TeamConfig`, workspace e versionamento combinado sao superficies de alta sensibilidade para regressao
- docs arquivados ainda citam a fase antiga de Aula e nao devem guiar implementacao nova

---

## Leitura correta desta baseline

Este documento deve ser interpretado da seguinte forma:

- o **estado atual real** e centrado em `Evento`
- `AULA` e somente um modo de evento
- a refatoracao deve ocorrer por slices pequenos e validados
- compatibilidade operacional tem prioridade, mas nao deve reintroduzir nomes publicos de Aula
