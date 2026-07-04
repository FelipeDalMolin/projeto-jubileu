# Modelo De Dominio Atual

Este documento descreve o estado vivo do dominio no codigo atual. Para a lista gerada de
classes, tabelas, rotas e chamadas do frontend, consulte
[`../generated/code-map.md`](../generated/code-map.md).

## Cadeia Canonica

```text
Usuarios -> Jogadores -> Dias -> Eventos -> Times -> Partidas -> Estatisticas
```

`Evento` e a entidade operacional e persistida central. `AULA` nao e uma entidade
publica; e somente um valor de `Evento.tipo`.

Valores ativos:

- `Evento.tipo`: `AULA`, `JOGO_LIVRE`, `OUTRO`
- `Evento.status`: `PLANEJADO`, `EM_ANDAMENTO`, `ENCERRADO`, `CANCELADO`
- `Partida.status`: `PLANEJADA`, `EM_ANDAMENTO`, `ENCERRADA`

## Entidades Persistidas

| Conceito | Tabela | Responsabilidade |
|---|---|---|
| Usuario | `usuarios` | Identidade de acesso, papel/RBAC e vinculo opcional com jogador. |
| Jogador | `jogadores` | Cadastro esportivo base. |
| Turma | `turmas` | Grupo de jogadores usado para aulas. |
| Vinculo jogador-turma | `turmas_jogadores` | Relacao ativa entre jogadores e turmas. |
| Dia | `dias` | Agrupador calendario por `data_iso`. |
| Evento | `eventos` | Unidade operacional de aula, jogo livre ou outro tipo. |
| Jogador no evento | `jogadores_evento` | Snapshot operacional do jogador dentro do evento. |
| Time no evento | `times_evento` | Time montado no contexto do evento. |
| Estado de equipes | `evento_equipes_estado` | Estado JSON imediato da composicao de equipes. |
| Configuracao de times | `team_configs` | Snapshot versionado/ativo da composicao de equipes. |
| Participante | `evento_participantes` | RSVP, check-in, check-out, chegada e no-show. |
| Partida | `partidas` | Jogo entre dois times do evento. |
| Estatistica por jogador | `estatisticas_jogador_partida` | Gols, assistencias, faltas, chiliques e nota por partida. |
| Lance | `lances` | Registro append-style de acontecimentos da partida. |
| Rotacao | `evento_rotacao_estado` e `evento_rotacao_sorteio` | Fila, sorteio e auditoria de rotacao. |

## Relacionamentos Principais

- `Dia` possui muitos `Evento`.
- `Evento` pertence a um `Dia` e pode pertencer a uma `Turma`.
- `Evento` possui `JogadorEvento`, `TimeEvento`, `Partida`, `EventoParticipante`, `Lance`, `TeamConfig` e estados de rotacao/equipes.
- `TimeEvento` agrupa `JogadorEvento`.
- `Partida` pertence a um `Evento` e referencia dois `TimeEvento`.
- `EstatisticaJogadorPartida` pertence a uma `Partida` e referencia um `JogadorEvento`.
- `EventoParticipante` referencia o `Jogador` base; `JogadorEvento` preserva snapshot operacional do mesmo jogador no evento.

## Fluxos De Processo

### Agenda e evento

1. A tela abre `/dias` ou `/dias/:dataIso`.
2. O backend lista ou cria `Dia` sob demanda por `data_iso`.
3. `POST /dias/{data_iso}/eventos` cria o `Evento`.
4. Se `tipo = AULA`, `turma_id` e obrigatorio e o backend cria snapshots em `jogadores_evento`.
5. Se `tipo = JOGO_LIVRE`, `turma_id` nao deve ser enviado; presenca e check-in entram por `evento_participantes`.

### Equipes e estado sincronizado

O padrao de sincronizacao aprovado e:

```text
estado local imediato -> persistencia por comando/evento -> polling agora -> WebSocket futuro
```

Na pratica atual:

- a UI pode montar times de forma imediata;
- `PUT /dias/{data_iso}/eventos/{evento_id}/estado-equipes` persiste o estado;
- `TeamConfig` guarda snapshot versionado e somente uma config ativa deve prevalecer;
- `GET /dias/{data_iso}/eventos/{evento_id}/workspace` entrega read-model agregado para a UI;
- polling deve ser limitado por versao e autenticacao, evitando fan-out e loops de `401`.

### Presenca

- `EventoParticipante` controla RSVP, check-in, check-out, cancelamento e no-show.
- `arrival_seq` preserva ordem de chegada.
- Acoes de usuario usam o jogador vinculado ao usuario autenticado.
- Check-in manual, seed e ciclo de vida operacional exigem papel administrativo no backend.

### Partidas, lances e estatisticas

- Partidas pertencem ao evento e aos times do evento.
- Transicoes validas: `PLANEJADA -> EM_ANDAMENTO -> ENCERRADA`.
- Lances so devem ser aceitos quando evento e partida estao em andamento.
- Estatisticas por jogador atualizam placar, dashboards, workspace e warnings derivados.
- Encerramento de evento deve bloquear quando existir partida em andamento.

## Invariantes Protegidas

- Recursos filhos precisam pertencer ao `Dia` e ao `Evento` declarados na rota.
- Autorizacao critica pertence ao backend.
- Contratos publicos novos devem usar `Evento`, `evento_id` e `eventoId`.
- Nao reintroduzir `/aulas`, `aula_id`, `aulaId`, `WorkspaceAula`, `TimeAula` ou `JogadorAula` em codigo ativo.
- Migrations historicas podem citar nomes antigos; elas nao definem a linguagem publica atual.
- PostgreSQL e o banco oficial; SQLite em teste local nao substitui validacao de comportamento especifico de PostgreSQL.

## Zonas De Atencao

- `EventoParticipante` e `JogadorEvento` ainda representam perspectivas diferentes do jogador no evento: participacao/check-in versus snapshot operacional.
- Existem rotas sem `/api` registradas no FastAPI por compatibilidade; o contrato frontend deve continuar chamando `/api/...`.
- Chamadas frontend para `/api/dias/{diaId}/equipes` foram removidas como legado; equipes
  devem permanecer no contrato por evento via `estado-equipes`.
- `TeamConfig`, workspace e rotacao sao superficies sensiveis porque combinam estado derivado, versao e regras de partida.
