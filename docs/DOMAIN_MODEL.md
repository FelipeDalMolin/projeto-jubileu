# MODELO DE DOMÍNIO (Slice 00 - Baseline)

## Objetivo

Este documento descreve o estado atual do modelo de domínio utilizado pelo backend do Jubileu e a direção canônica aprovada para a refatoração incremental.

---

## Visão geral do estado atual

No estado atual do backend, a persistência e parte relevante dos fluxos de negócio ainda estão centradas no conceito legado de **`Aula`**.

Ao mesmo tempo, a direção funcional e semântica do projeto já aponta para o conceito mais amplo de **`Evento`**, que deverá se tornar o eixo canônico do domínio ao longo das próximas slices de refatoração.

Portanto, o sistema hoje opera em uma condição de **transição controlada**, na qual:

- a persistência principal ainda utiliza `Aula`
- parte da API e da linguagem de negócio já converge para `Evento`
- a compatibilidade deve ser preservada até que a reorganização de domínio seja concluída

---

## Conceitos de negócio atualmente relevantes

Os principais conceitos de negócio identificados no projeto são:

- **Usuário**: identidade de acesso ao sistema
- **Jogador**: entidade esportiva associada ou não a um usuário
- **Dia**: agrupador lógico e temporal dos acontecimentos
- **Aula**: agregado persistido atual que concentra comportamento de evento no backend legado
- **Evento**: conceito canônico de negócio em direção de adoção gradual
- **Time**: agrupamento de jogadores dentro do contexto de uma aula/evento
- **Partida**: unidade jogável vinculada ao contexto de aula/evento
- **Participação**: presença, RSVP, check-in e estado de disponibilidade do jogador
- **Lance**: registro operacional de acontecimentos da partida
- **Estatísticas**: consolidação de métricas por jogador/partida
- **Configuração de times**: snapshot/versionamento do estado de composição das equipes
- **Workspace**: visão agregada derivada do estado operacional do evento/aula

---

## Entidades persistidas atuais

As principais entidades persistidas atualmente, conforme a modelagem vigente, são:

- `Dia`
- `Aula`
- `TimeAula`
- `JogadorAula`
- `Partida`
- `EstatisticaJogadorPartida`
- `EventoParticipante`
- `Lance`
- `TeamConfig`

### Observação importante

Nem todas as entidades acima possuem o mesmo peso arquitetural no domínio.

Na prática:

- `Dia`, `Aula` e `Partida` representam o eixo principal do fluxo persistido atual
- `TimeAula`, `JogadorAula` e `EventoParticipante` participam da composição e do controle operacional
- `Lance` e `EstatisticaJogadorPartida` representam registro e consolidação de execução esportiva
- `TeamConfig` sustenta comportamento crítico de snapshot, versionamento e reconstrução de equipes

---

## Situação de transição semântica

A principal tensão atual do domínio está na coexistência entre:

- o **modelo persistido legado**, centrado em `Aula`
- a **direção canônica futura**, centrada em `Evento`

Regras de transição nesta baseline:

- `Aula` permanece como agregado persistido principal nesta fase
- o nome canônico `Evento` pode ser introduzido gradualmente nas camadas de serviço, API e documentação
- renomeação precoce de persistência **não é permitida** nas slices de estabilização
- qualquer convergência semântica deve preservar contratos existentes e comportamento observado pelo frontend

---

## Sobreposição semântica conhecida

Existe uma sobreposição de responsabilidade e significado entre:

- `JogadorAula`
- `EventoParticipante`

Essa sobreposição indica que o domínio ainda não está totalmente convergido em torno de um único modelo de participação.

Por isso:

- essa área deve ser tratada como **zona de transição controlada**
- não deve haver unificação apressada
- futuras slices devem esclarecer papéis, ownership e invariantes antes de qualquer consolidação

---

## Direção canônica aprovada

A direção canônica aprovada para o domínio é:

`Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas`

Essa direção representa o **alvo semântico e organizacional** do backend, mas **não descreve integralmente a persistência atual**.

Em outras palavras:

- é a direção correta para modularização futura
- não deve ser confundida com o estado real já implementado no banco e nos fluxos atuais

---

## Regras críticas que devem permanecer estáveis

As seguintes regras e comportamentos são sensíveis e não podem ser quebrados durante a estabilização e as slices iniciais de refatoração:

- validações de ownership pai-filho em rotas aninhadas de dia/aula/evento
- regras de transição por status (`PLANEJADA`, `EM_ANDAMENTO`, `CONCLUIDA`)
- consistência de snapshot e versionamento de equipes
- lógica de versão ativa em `TeamConfig`
- comportamento de versão combinada do workspace
- fluxo de RSVP para check-in
- ordenação por chegada com base em `checked_at`
- transições do ciclo de vida das partidas
- autorização de backend como fonte de verdade

---

## Superfícies de domínio protegidas nesta fase

Os seguintes comportamentos devem ser considerados congelados, salvo refatoração explícita em slice dedicada:

- agregação do workspace
- versionamento de `TeamConfig`
- lógica de versão combinada
- derivação de KPIs e avisos
- fluxo RSVP -> check-in
- comportamento de ordenação por `checked_at`
- transições de ciclo de vida da partida

---

## Hotspots legados conhecidos

Os principais pontos críticos do domínio atual são:

- `app/models/dia_aula.py` concentra múltiplas entidades, enums e responsabilidades
- `routers/dias.py` ainda combina orquestração HTTP com regras de negócio
- `routers/partidas.py` ainda concentra comportamento que deveria migrar para serviços
- coexistem fluxos aninhados baseados em `dias/.../aulas/...` e rotas paralelas orientadas a `eventos`
- `JogadorAula` e `EventoParticipante` ainda se sobrepõem semanticamente
- `TeamConfig`, workspace e versionamento combinado são superfícies de alta sensibilidade para regressão

---

## Leitura correta desta baseline

Este documento deve ser interpretado da seguinte forma:

- o **estado atual real** ainda é majoritariamente centrado em `Aula`
- o **alvo canônico** do domínio é centrado em `Evento`
- a refatoração deve ocorrer por convergência incremental
- compatibilidade funcional e contratual tem prioridade sobre renomeação estrutural precoce
