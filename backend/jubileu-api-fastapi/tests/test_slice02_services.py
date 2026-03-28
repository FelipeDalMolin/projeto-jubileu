from fastapi import HTTPException

from app.models.dia_aula import (
    Aula as AulaModel,
    Dia as DiaModel,
    EstatisticaJogadorPartida as EstatisticaJogadorPartidaModel,
    JogadorAula as JogadorAulaModel,
    StatusAulaEnum,
    StatusPresencaEnum,
    TipoEventoAulaEnum,
    TimeAula as TimeAulaModel,
)
from app.models.jogador_turma import Turma as TurmaModel
from app.modules.dias import service as dias_service
from app.modules.partidas import service as partidas_service


def _build_base_aula(db_session, data_iso: str = "2026-02-01"):
    dia = DiaModel(data_iso=data_iso)
    turma = TurmaModel(nome="Turma Service")
    db_session.add_all([dia, turma])
    db_session.flush()

    aula = AulaModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_aula_na_turma=1,
        tipo=TipoEventoAulaEnum.AULA,
        horario_inicio="19:00",
        horario_fim="20:00",
        status=StatusAulaEnum.PLANEJADA,
    )
    db_session.add(aula)
    db_session.flush()
    return aula


def test_dias_service_get_aula_no_dia_or_404(db_session):
    aula = _build_base_aula(db_session, data_iso="2026-02-10")
    db_session.commit()

    found = dias_service.get_aula_no_dia_or_404(db_session, "2026-02-10", aula.id)
    assert found.id == aula.id

    try:
        dias_service.get_aula_no_dia_or_404(db_session, "2026-02-10", aula.id + 999)
        assert False, "Expected HTTPException for missing aula"
    except HTTPException as exc:
        assert exc.status_code == 404


def test_partidas_service_calcular_placar(db_session):
    aula = _build_base_aula(db_session, data_iso="2026-02-11")

    time_a = TimeAulaModel(aula_id=aula.id, nome="Time A")
    time_b = TimeAulaModel(aula_id=aula.id, nome="Time B")
    db_session.add_all([time_a, time_b])
    db_session.flush()

    jogador_a = JogadorAulaModel(
        aula_id=aula.id,
        jogador_id=None,
        nome="Jogador A",
        status=StatusPresencaEnum.presente,
        time_id=time_a.id,
    )
    jogador_b = JogadorAulaModel(
        aula_id=aula.id,
        jogador_id=None,
        nome="Jogador B",
        status=StatusPresencaEnum.presente,
        time_id=time_b.id,
    )
    db_session.add_all([jogador_a, jogador_b])
    db_session.flush()

    estatisticas = [
        EstatisticaJogadorPartidaModel(jogador_aula_id=jogador_a.id, gols=2, assistencias=0, chiliques=0, faltas=0),
        EstatisticaJogadorPartidaModel(jogador_aula_id=jogador_b.id, gols=1, assistencias=0, chiliques=0, faltas=0),
    ]
    jogadores_por_id = partidas_service.mapear_jogadores_da_aula(
        db_session,
        aula.id,
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
