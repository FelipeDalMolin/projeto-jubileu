from fastapi import HTTPException

from app.models.dia_evento import (
    Evento as EventoModel,
    Dia as DiaModel,
    EstatisticaJogadorPartida as EstatisticaJogadorPartidaModel,
    JogadorEvento as JogadorEventoModel,
    StatusEventoEnum,
    StatusPresencaEnum,
    TipoEventoEnum,
    TimeEvento as TimeEventoModel,
)
from app.models.jogador_turma import Turma as TurmaModel
from app.modules.dias import service as dias_service
from app.modules.partidas import service as partidas_service


def _build_base_evento(db_session, data_iso: str = "2026-02-01"):
    dia = DiaModel(data_iso=data_iso)
    turma = TurmaModel(nome="Turma Service")
    db_session.add_all([dia, turma])
    db_session.flush()

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_evento_na_turma=1,
        tipo=TipoEventoEnum.AULA,
        horario_inicio="19:00",
        horario_fim="20:00",
        status=StatusEventoEnum.PLANEJADO,
    )
    db_session.add(evento)
    db_session.flush()
    return evento


def test_dias_service_get_evento_no_dia_or_404(db_session):
    evento = _build_base_evento(db_session, data_iso="2026-02-10")
    db_session.commit()

    found = dias_service.get_evento_no_dia_or_404(db_session, "2026-02-10", evento.id)
    assert found.id == evento.id

    try:
        dias_service.get_evento_no_dia_or_404(db_session, "2026-02-10", evento.id + 999)
        assert False, "Expected HTTPException for missing evento"
    except HTTPException as exc:
        assert exc.status_code == 404


def test_partidas_service_calcular_placar(db_session):
    evento = _build_base_evento(db_session, data_iso="2026-02-11")

    time_a = TimeEventoModel(evento_id=evento.id, nome="Time A")
    time_b = TimeEventoModel(evento_id=evento.id, nome="Time B")
    db_session.add_all([time_a, time_b])
    db_session.flush()

    jogador_a = JogadorEventoModel(
        evento_id=evento.id,
        jogador_id=None,
        nome="Jogador A",
        status=StatusPresencaEnum.presente,
        time_id=time_a.id,
    )
    jogador_b = JogadorEventoModel(
        evento_id=evento.id,
        jogador_id=None,
        nome="Jogador B",
        status=StatusPresencaEnum.presente,
        time_id=time_b.id,
    )
    db_session.add_all([jogador_a, jogador_b])
    db_session.flush()

    estatisticas = [
        EstatisticaJogadorPartidaModel(jogador_evento_id=jogador_a.id, gols=2, assistencias=0, chiliques=0, faltas=0),
        EstatisticaJogadorPartidaModel(jogador_evento_id=jogador_b.id, gols=1, assistencias=0, chiliques=0, faltas=0),
    ]
    jogadores_por_id = partidas_service.mapear_jogadores_da_evento(
        db_session,
        evento.id,
        [jogador_a.id, jogador_b.id],
    )
    gols_a, gols_b = partidas_service.calcular_placar(
        estatisticas,
        jogadores_por_id,
        time_a.id,
        time_b.id,
    )

    assert gols_a == 2
    assert gols_b == 1
