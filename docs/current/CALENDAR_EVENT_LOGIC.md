# Logica Calendario, Dia E Evento

Este documento reconcilia a intencao de produto capturada nas conversas antigas sobre
calendario com a arquitetura atual `Evento`-canonica.

## Leitura Atual

O calendario continua sendo a entrada operacional principal do app, mas nao deve ser
tratado como calendario de aulas. A leitura vigente e:

```text
Calendario /dias -> Dia /dias/:dataIso -> Evento /dias/:dataIso/eventos/:eventoId
```

- `Dia` responde quando: data, contexto temporal, lista de eventos e eventual bloqueio global.
- `Evento` responde o que acontece: tipo, status, horario, turma opcional, participantes,
  equipes, partidas, lances e estatisticas.
- `AULA` e somente um valor de `Evento.tipo`.

## Regras De Produto

- Abrir qualquer dia pela URL ou pelo calendario deve ser permitido, mesmo sem eventos.
- O dia vazio e uma tela valida para criar/agendar eventos.
- Cards e listas de dia devem falar em eventos; quando o tipo for `AULA`, ele pode aparecer
  como modo do evento, nao como entidade raiz.
- O workspace operacional pertence ao evento, nao ao dia.
- Times, partidas, lances, rotacao, participantes, RSVP/check-in e estatisticas pertencem
  ao evento.
- Cancelamento comum pertence ao evento. Bloqueio/cancelamento no nivel de dia deve ser
  reservado para indisponibilidade global, como fechamento do clube ou campo interditado.

## Como Reler Conversas Antigas

Use conversas antigas de calendario como fonte de intencao, nao como fonte literal de
implementacao. Classifique cada proposta antes de transformar em tarefa:

| Proposta antiga | Leitura atual |
|---|---|
| Calendario como hub | Manter. `/dias` e entrada operacional. |
| Entrar em dia vazio | Manter. Dia e contexto temporal consultavel/criavel. |
| Dia mostra aulas | Reinterpretar. Dia mostra eventos, alguns com `tipo = AULA`. |
| Aula como tela de gestao | Reinterpretar. Usar `EventoPage`/`WorkspaceEvento`. |
| `/dias/:dataIso/aulas/:aulaId` | Legado. Nao usar em feature nova. |
| Equipes por dia | Remover. Equipes sao por evento. |
| RSVP/check-in | Manter e especializar por tipo, principalmente `JOGO_LIVRE`. |
| Quadras/horarios/autorizacao | Ideia futura. Modelar como recurso/local e regra por tipo de evento. |

## Guardrails

Nao introduzir em codigo ativo:

- `/aulas`;
- `aula_id`;
- `aulaId`;
- `WorkspaceAula`;
- `TimeAula`;
- `JogadorAula`;
- `/api/dias/{diaId}/equipes`.

Quando uma proposta parecer ambigua, pergunte a qual agregado ela pertence: Dia, Evento,
Tipo de Evento, Recurso/Local, Turma, Partida ou Lance.
