from datetime import date
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.dia_evento import (
    EstatisticaJogadorPartida,
    JogadorEvento,
    Evento,
    Dia,
    Partida,
)
from app.models.jogador_turma import Turma
from app.services.dashboards.utils import cutoff_date, normalize_period
from app.schemas.dashboards.estatisticas import (
    EstatisticasVisaoGeralOut,
    ItemScore,
    GolsPorTurma,
)
from app.services.dashboards.jogadores_service import PRESENT_STATUSES


def _date_filter(period: int):
    limite: date = cutoff_date(period)
    return func.to_date(Dia.data_iso, "YYYY-MM-DD") >= limite


def visao_geral(db: Session, periodo: int) -> EstatisticasVisaoGeralOut:
    periodo_norm = normalize_period(periodo)
    filtro_periodo = _date_filter(periodo_norm)

    # Artilheiros
    artilheiros_rows = (
        db.query(
            JogadorEvento.jogador_id.label("jogador_id"),
            JogadorEvento.nome.label("nome"),
            func.coalesce(func.sum(EstatisticaJogadorPartida.gols), 0).label("gols"),
        )
        .join(EstatisticaJogadorPartida, EstatisticaJogadorPartida.jogador_evento_id == JogadorEvento.id)
        .join(Partida, EstatisticaJogadorPartida.partida_id == Partida.id)
        .join(Evento, Partida.evento_id == Evento.id)
        .join(Dia, Evento.dia_id == Dia.id)
        .filter(filtro_periodo)
        .group_by(JogadorEvento.jogador_id, JogadorEvento.nome)
        .order_by(func.coalesce(func.sum(EstatisticaJogadorPartida.gols), 0).desc())
        .limit(5)
        .all()
    )

    top_artilheiros: List[ItemScore] = [
        ItemScore(jogadorId=row.jogador_id, nome=row.nome, valor=int(row.gols or 0)) for row in artilheiros_rows
    ]

    # Presencas
    presencas_rows = (
        db.query(
            JogadorEvento.jogador_id.label("jogador_id"),
            JogadorEvento.nome.label("nome"),
            func.count(JogadorEvento.id).label("presencas"),
        )
        .join(Evento, JogadorEvento.evento_id == Evento.id)
        .join(Dia, Evento.dia_id == Dia.id)
        .filter(filtro_periodo)
        .filter(JogadorEvento.status.in_(PRESENT_STATUSES))
        .group_by(JogadorEvento.jogador_id, JogadorEvento.nome)
        .order_by(func.count(JogadorEvento.id).desc())
        .limit(5)
        .all()
    )

    top_presencas: List[ItemScore] = [
        ItemScore(jogadorId=row.jogador_id, nome=row.nome, valor=int(row.presencas or 0))
        for row in presencas_rows
    ]

    # Gols por turma
    gols_turma_rows = (
        db.query(
            Evento.turma_id.label("turma_id"),
            func.coalesce(Evento.turma_nome, Turma.nome).label("turma_nome"),
            func.coalesce(func.sum(Partida.gols_time_a + Partida.gols_time_b), 0).label("gols"),
        )
        .join(Partida, Partida.evento_id == Evento.id)
        .join(Dia, Evento.dia_id == Dia.id)
        .outerjoin(Turma, Evento.turma_id == Turma.id)
        .filter(filtro_periodo)
        .group_by(Evento.turma_id, func.coalesce(Evento.turma_nome, Turma.nome))
        .order_by(func.coalesce(func.sum(Partida.gols_time_a + Partida.gols_time_b), 0).desc())
        .all()
    )

    gols_por_turma: List[GolsPorTurma] = [
        GolsPorTurma(turmaId=row.turma_id, turmaNome=row.turma_nome, gols=int(row.gols or 0))
        for row in gols_turma_rows
    ]

    return EstatisticasVisaoGeralOut(
        topArtilheiros=top_artilheiros,
        topPresencas=top_presencas,
        golsPorTurma=gols_por_turma,
    )
