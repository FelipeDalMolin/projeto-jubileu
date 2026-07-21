from datetime import date
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.dia_evento import (
    JogadorEvento,
    EstatisticaJogadorPartida,
    Partida,
    Evento,
    Dia,
)
from app.models.jogador_turma import Jogador, Turma
from app.services.dashboards.utils import cutoff_date, normalize_period
from app.schemas.dashboards.jogadores import (
    JogadorEventoContextoOut,
    JogadoresResumoOut,
    JogadoresRankingOut,
    JogadorRankingOut,
)


PRESENT_STATUSES = {"presente", "so_treino", "coringa"}


def _date_filter(period: int):
    limite: date = cutoff_date(period)
    return Dia.data_iso >= limite.isoformat()


def get_resumo(db: Session) -> JogadoresResumoOut:
    total_jogadores = db.query(func.count(Jogador.id)).scalar() or 0

    presentes = (
        db.query(func.count(JogadorEvento.id))
        .join(Evento, JogadorEvento.evento_id == Evento.id)
        .join(Dia, Evento.dia_id == Dia.id)
        .filter(_date_filter(365))
        .filter(JogadorEvento.status.in_(PRESENT_STATUSES))
        .scalar()
        or 0
    )

    total_registros = (
        db.query(func.count(JogadorEvento.id))
        .join(Evento, JogadorEvento.evento_id == Evento.id)
        .join(Dia, Evento.dia_id == Dia.id)
        .filter(_date_filter(365))
        .scalar()
        or 0
    )

    media_presenca = float(presentes) / total_registros * 100 if total_registros else 0.0

    total_gols = (
        db.query(func.coalesce(func.sum(EstatisticaJogadorPartida.gols), 0))
        .join(Partida, EstatisticaJogadorPartida.partida_id == Partida.id)
        .join(Evento, Partida.evento_id == Evento.id)
        .join(Dia, Evento.dia_id == Dia.id)
        .filter(_date_filter(365))
        .scalar()
        or 0
    )

    return JogadoresResumoOut(
        totalJogadores=total_jogadores,
        mediaPresenca=round(media_presenca, 1),
        totalGols=int(total_gols),
    )


def ranking(db: Session, periodo: int, turma_id: int | None) -> JogadoresRankingOut:
    periodo_norm = normalize_period(periodo)
    filtro_periodo = _date_filter(periodo_norm)

    base_query = (
        db.query(
            JogadorEvento.id.label("ja_id"),
            JogadorEvento.nome.label("nome"),
            JogadorEvento.jogador_id.label("jogador_id"),
            JogadorEvento.status.label("status"),
            Evento.turma_id.label("turma_id"),
            func.coalesce(Evento.turma_nome, Turma.nome).label("turma_nome"),
            Evento.id.label("evento_id"),
            Evento.tipo.label("evento_tipo"),
            Dia.data_iso.label("data_iso"),
        )
        .join(Evento, JogadorEvento.evento_id == Evento.id)
        .join(Dia, Evento.dia_id == Dia.id)
        .outerjoin(Turma, Evento.turma_id == Turma.id)
        .filter(filtro_periodo)
    )

    if turma_id is not None:
        base_query = base_query.filter(Evento.turma_id == turma_id)

    jogadores_rows = base_query.all()

    stats_rows = (
        db.query(
            EstatisticaJogadorPartida.jogador_evento_id.label("ja_id"),
            func.coalesce(func.sum(EstatisticaJogadorPartida.gols), 0).label("gols"),
            func.coalesce(func.sum(EstatisticaJogadorPartida.assistencias), 0).label("assistencias"),
        )
        .join(Partida, EstatisticaJogadorPartida.partida_id == Partida.id)
        .join(Evento, Partida.evento_id == Evento.id)
        .join(Dia, Evento.dia_id == Dia.id)
        .filter(filtro_periodo)
    )

    if turma_id is not None:
        stats_rows = stats_rows.filter(Evento.turma_id == turma_id)

    stats_rows = stats_rows.group_by(EstatisticaJogadorPartida.jogador_evento_id).all()

    stats_map = {row.ja_id: row for row in stats_rows}

    agregado: dict[int, JogadorRankingOut] = {}

    for row in jogadores_rows:
        key = row.jogador_id or row.ja_id
        existente = agregado.get(key)
        presenca_val = 1 if row.status in PRESENT_STATUSES else 0

        gols = stats_map.get(row.ja_id).gols if row.ja_id in stats_map else 0
        assist = stats_map.get(row.ja_id).assistencias if row.ja_id in stats_map else 0

        if existente:
            existente.presencas += presenca_val
            existente.gols += int(gols or 0)
            existente.assistencias += int(assist or 0)
        else:
            agregado[key] = JogadorRankingOut(
                jogadorId=key,
                nome=row.nome,
                turmaId=row.turma_id,
                turmaNome=row.turma_nome,
                presencas=presenca_val,
                gols=int(gols or 0),
                assistencias=int(assist or 0),
            )

        item = agregado[key]
        item.eventos.append(
            JogadorEventoContextoOut(
                eventoId=row.evento_id,
                dataIso=row.data_iso,
                tipo=row.evento_tipo.value,
                turmaNome=row.turma_nome,
                presencas=presenca_val,
                gols=int(gols or 0),
                assistencias=int(assist or 0),
            )
        )

    for item in agregado.values():
        item.pontuacao = float(item.gols * 4 + item.assistencias * 3 + item.presencas)
        item.eventos.sort(key=lambda evento: (evento.dataIso, evento.eventoId), reverse=True)

    ordenado: List[JogadorRankingOut] = sorted(
        agregado.values(),
        key=lambda x: (x.pontuacao, x.gols, x.presencas),
        reverse=True,
    )

    return JogadoresRankingOut(items=ordenado)
