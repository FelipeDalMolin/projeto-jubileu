from datetime import date
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.dia_evento import Evento, Dia, Partida
from app.models.dia_evento import EstatisticaJogadorPartida
from app.services.dashboards.utils import cutoff_date, normalize_period
from app.schemas.dashboards.partidas import (
    PartidasResumoOut,
    SeriePorDiaOut,
    SeriePorDiaItem,
)


def _date_filter(period: int):
    limite: date = cutoff_date(period)
    return func.to_date(Dia.data_iso, "YYYY-MM-DD") >= limite


def get_resumo(db: Session) -> PartidasResumoOut:
    total = db.query(func.count(Partida.id)).scalar() or 0
    total_gols = (
        db.query(
            func.coalesce(
                func.sum(Partida.gols_time_a + Partida.gols_time_b),
                0,
            )
        ).scalar()
        or 0
    )
    media_gols = float(total_gols) / total if total else 0.0

    return PartidasResumoOut(
        totalPartidas=int(total),
        mediaGolsPorPartida=round(media_gols, 2),
        totalGols=int(total_gols),
    )


def serie_por_dia(db: Session, periodo: int, turma_id: int | None) -> SeriePorDiaOut:
    periodo_norm = normalize_period(periodo)
    filtro_periodo = _date_filter(periodo_norm)

    query = (
        db.query(
            Dia.data_iso.label("data"),
            func.count(Partida.id).label("partidas"),
            func.coalesce(func.sum(Partida.gols_time_a + Partida.gols_time_b), 0).label("gols"),
        )
        .join(Evento, Partida.evento_id == Evento.id)
        .join(Dia, Evento.dia_id == Dia.id)
        .filter(filtro_periodo)
    )

    if turma_id is not None:
        query = query.filter(Evento.turma_id == turma_id)

    rows = query.group_by(Dia.data_iso).order_by(Dia.data_iso.asc()).all()

    items: List[SeriePorDiaItem] = [
        SeriePorDiaItem(data=row.data, partidas=int(row.partidas or 0), gols=int(row.gols or 0))
        for row in rows
    ]

    return SeriePorDiaOut(items=items)
