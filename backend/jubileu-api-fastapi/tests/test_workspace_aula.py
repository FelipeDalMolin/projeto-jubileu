from fastapi.testclient import TestClient

from app.models.dia_aula import (
    Aula as AulaModel,
    Dia as DiaModel,
    EstatisticaJogadorPartida as EstatisticaJogadorPartidaModel,
    JogadorAula as JogadorAulaModel,
    Partida as PartidaModel,
    StatusAulaEnum,
    StatusPresencaEnum,
    TipoEventoAulaEnum,
    TimeAula as TimeAulaModel,
)
from app.models.jogador_turma import Turma as TurmaModel


def _criar_aula_com_jogadores(
    db_session,
    *,
    data_iso: str,
    jogadores_por_time: list[int],
    jogadores_sem_time: int = 0,
) -> AulaModel:
    dia = DiaModel(data_iso=data_iso)
    turma = TurmaModel(nome="Turma Teste")
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

    jogador_idx = 1
    for idx, quantidade in enumerate(jogadores_por_time, start=1):
        time = TimeAulaModel(aula_id=aula.id, nome=f"Time {idx}")
        db_session.add(time)
        db_session.flush()

        for _ in range(quantidade):
            jogador = JogadorAulaModel(
                aula_id=aula.id,
                jogador_id=None,
                nome=f"Jogador {jogador_idx}",
                status=StatusPresencaEnum.presente,
                time_id=time.id,
            )
            db_session.add(jogador)
            jogador_idx += 1

    for _ in range(jogadores_sem_time):
        jogador = JogadorAulaModel(
            aula_id=aula.id,
            jogador_id=None,
            nome=f"Jogador {jogador_idx}",
            status=StatusPresencaEnum.presente,
            time_id=None,
        )
        db_session.add(jogador)
        jogador_idx += 1

    db_session.commit()

    return aula


def _criar_partida_com_gols(
    db_session,
    *,
    aula_id: int,
    time_a_id: int,
    time_b_id: int,
    gols_por_jogador: dict[int, int],
) -> None:
    partida = PartidaModel(
        aula_id=aula_id,
        ordem=1,
        time_a_id=time_a_id,
        time_b_id=time_b_id,
    )
    db_session.add(partida)
    db_session.flush()

    for jogador_id, gols in gols_por_jogador.items():
        estat = EstatisticaJogadorPartidaModel(
            partida_id=partida.id,
            jogador_aula_id=jogador_id,
            gols=gols,
            assistencias=0,
            chiliques=0,
            faltas=0,
            nota=None,
        )
        db_session.add(estat)

    db_session.commit()


def _criar_partida_com_placar(
    db_session,
    *,
    aula_id: int,
    time_a_id: int,
    time_b_id: int,
    gols_time_a: int,
    gols_time_b: int,
) -> None:
    partida = PartidaModel(
        aula_id=aula_id,
        ordem=1,
        time_a_id=time_a_id,
        time_b_id=time_b_id,
        gols_time_a=gols_time_a,
        gols_time_b=gols_time_b,
    )
    db_session.add(partida)
    db_session.commit()


def test_workspace_returns_structure(client: TestClient, db_session):
    data_iso = "2026-01-20"
    aula = _criar_aula_com_jogadores(
        db_session,
        data_iso=data_iso,
        jogadores_por_time=[1],
    )

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text

    payload = resp.json()
    for key in ["meta", "header", "kpis", "equipes", "partidas", "eventos", "warnings"]:
        assert key in payload
    assert isinstance(payload["meta"]["version"], int)


def test_workspace_since_version_returns_204(client: TestClient, db_session):
    data_iso = "2026-01-21"
    aula = _criar_aula_com_jogadores(
        db_session,
        data_iso=data_iso,
        jogadores_por_time=[1],
    )

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text
    version = resp.json()["meta"]["version"]

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace?since_version={version}")
    assert resp.status_code == 204, resp.text


def test_workspace_warning_player_without_team(client: TestClient, db_session):
    data_iso = "2026-01-22"
    aula = _criar_aula_com_jogadores(
        db_session,
        data_iso=data_iso,
        jogadores_por_time=[1],
        jogadores_sem_time=1,
    )

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text

    codes = {w["code"] for w in resp.json().get("warnings", [])}
    assert "PLAYER_WITHOUT_TEAM" in codes


def test_workspace_warning_unbalanced_teams(client: TestClient, db_session):
    data_iso = "2026-01-23"
    aula = _criar_aula_com_jogadores(
        db_session,
        data_iso=data_iso,
        jogadores_por_time=[3, 1],
    )

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text

    codes = {w["code"] for w in resp.json().get("warnings", [])}
    assert "UNBALANCED_TEAMS" in codes


def test_workspace_kpis_counts_players(client: TestClient, db_session):
    data_iso = "2026-01-24"
    aula = _criar_aula_com_jogadores(
        db_session,
        data_iso=data_iso,
        jogadores_por_time=[2, 1],
    )

    jogadores = (
        db_session.query(JogadorAulaModel)
        .filter(JogadorAulaModel.aula_id == aula.id)
        .order_by(JogadorAulaModel.id.asc())
        .all()
    )
    assert len(jogadores) == 3

    jogadores[1].status = StatusPresencaEnum.faltou
    db_session.commit()

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text

    kpis = resp.json().get("kpis", {})
    assert kpis["total_jogadores"] == 3
    assert kpis["presentes"] == 2


def test_workspace_kpis_goals_total(client: TestClient, db_session):
    data_iso = "2026-01-25"
    aula = _criar_aula_com_jogadores(
        db_session,
        data_iso=data_iso,
        jogadores_por_time=[1, 1],
    )

    times = (
        db_session.query(TimeAulaModel)
        .filter(TimeAulaModel.aula_id == aula.id)
        .order_by(TimeAulaModel.id.asc())
        .all()
    )
    assert len(times) == 2

    _criar_partida_com_placar(
        db_session,
        aula_id=aula.id,
        time_a_id=times[0].id,
        time_b_id=times[1].id,
        gols_time_a=2,
        gols_time_b=1,
    )

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text

    kpis = resp.json().get("kpis", {})
    assert kpis["gols_total"] == 3
