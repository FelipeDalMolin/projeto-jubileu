import pytest
from fastapi.testclient import TestClient

from app.models.dia_evento import (
    Dia as DiaModel,
    Evento as EventoModel,
    EventoParticipante as EventoParticipanteModel,
    EstatisticaJogadorPartida as EstatisticaModel,
    JogadorEvento as JogadorEventoModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusEventoEnum,
    StatusPresencaEnum,
    TimeEvento as TimeEventoModel,
    TipoEventoEnum,
)
from app.models.jogador_turma import Jogador as JogadorModel, Turma as TurmaModel


def _criar_evento_base(
    db_session,
    *,
    data_iso: str = "2026-07-04",
    tipo: TipoEventoEnum = TipoEventoEnum.AULA,
    status: StatusEventoEnum = StatusEventoEnum.PLANEJADO,
    with_times: bool = True,
    with_partida: bool = False,
) -> tuple[str, int, dict[str, int]]:
    dia = DiaModel(data_iso=data_iso)
    turma = TurmaModel(nome=f"Turma {data_iso}")
    jogador_1 = JogadorModel(nome="Jogador CS 1", status="ativo", ativo=True)
    jogador_2 = JogadorModel(nome="Jogador CS 2", status="ativo", ativo=True)
    db_session.add_all([dia, turma, jogador_1, jogador_2])
    db_session.flush()

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_evento_na_turma=1,
        tipo=tipo,
        horario_inicio="19:00",
        horario_fim="20:00",
        status=status,
    )
    db_session.add(evento)
    db_session.flush()

    time_a = time_b = None
    if with_times:
        time_a = TimeEventoModel(evento_id=evento.id, nome="Time A")
        time_b = TimeEventoModel(evento_id=evento.id, nome="Time B")
        db_session.add_all([time_a, time_b])
        db_session.flush()

    jogador_evento_1 = JogadorEventoModel(
        evento_id=evento.id,
        jogador_id=jogador_1.id,
        nome=jogador_1.nome,
        status=StatusPresencaEnum.presente,
        time_id=time_a.id if time_a else None,
    )
    jogador_evento_2 = JogadorEventoModel(
        evento_id=evento.id,
        jogador_id=jogador_2.id,
        nome=jogador_2.nome,
        status=StatusPresencaEnum.presente,
        time_id=time_b.id if time_b else None,
    )
    db_session.add_all([jogador_evento_1, jogador_evento_2])
    db_session.flush()

    partida_id = None
    if with_partida and time_a and time_b:
        partida = PartidaModel(
            evento_id=evento.id,
            ordem=1,
            status=PartidaStatusEnum.EM_ANDAMENTO,
            time_a_id=time_a.id,
            time_b_id=time_b.id,
        )
        db_session.add(partida)
        db_session.flush()
        partida_id = partida.id

    db_session.commit()
    ids = {
        "jogador_1": jogador_1.id,
        "jogador_2": jogador_2.id,
        "jogador_evento_1": jogador_evento_1.id,
        "jogador_evento_2": jogador_evento_2.id,
        "time_a": time_a.id if time_a else 0,
        "time_b": time_b.id if time_b else 0,
        "partida": partida_id or 0,
    }
    return data_iso, evento.id, ids


@pytest.mark.uc07
def test_criar_time_com_nome_repetido_gera_nome_unico(client: TestClient, db_session):
    data_iso, evento_id, _ = _criar_evento_base(db_session, with_times=False)

    first = client.post(f"/dias/{data_iso}/eventos/{evento_id}/times", json={"nome": "Time 1"})
    assert first.status_code == 201, first.text
    assert first.json()["nome"] == "Time 1"

    second = client.post(f"/dias/{data_iso}/eventos/{evento_id}/times", json={"nome": "Time 1"})
    assert second.status_code == 201, second.text
    assert second.json()["nome"] == "Time 2"

    nomes = [
        row.nome
        for row in db_session.query(TimeEventoModel)
        .filter(TimeEventoModel.evento_id == evento_id)
        .order_by(TimeEventoModel.id.asc())
        .all()
    ]
    assert nomes == ["Time 1", "Time 2"]


@pytest.mark.uc07
def test_estado_equipes_rejeita_expected_version_stale(client: TestClient, db_session):
    data_iso, evento_id, _ = _criar_evento_base(db_session, with_times=False)
    current = client.get(f"/dias/{data_iso}/eventos/{evento_id}/estado-equipes")
    assert current.status_code == 200, current.text
    version = current.json()["version"]

    resp = client.put(
        f"/dias/{data_iso}/eventos/{evento_id}/estado-equipes",
        json={
            "expected_version": version + 1,
            "jogadores": current.json()["jogadores"],
            "times": current.json()["times"],
        },
    )
    assert resp.status_code == 409, resp.text
    assert resp.json()["detail"]["code"] == "version_conflict"


@pytest.mark.uc09
def test_lance_com_mesmo_client_event_id_retorna_mesmo_registro(client: TestClient, db_session):
    _, _, ids = _criar_evento_base(
        db_session,
        data_iso="2026-07-05",
        status=StatusEventoEnum.EM_ANDAMENTO,
        with_partida=True,
    )
    payload = {
        "tipo": "GOL",
        "payload": {"minute": 3, "time_id": ids["time_a"]},
        "jogador_id": ids["jogador_evento_1"],
        "client_event_id": "cmd-lance-1",
    }
    headers = {"X-User-Id": "coach", "X-Role": "treinador"}

    first = client.post(f"/api/partidas/{ids['partida']}/lances", json=payload, headers=headers)
    second = client.post(f"/api/partidas/{ids['partida']}/lances", json=payload, headers=headers)

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert second.json()["lance"]["id"] == first.json()["lance"]["id"]


@pytest.mark.uc09
def test_stats_por_jogador_sao_atualizadas_sem_duplicar_linha(client: TestClient, db_session):
    data_iso, evento_id, ids = _criar_evento_base(
        db_session,
        data_iso="2026-07-06",
        status=StatusEventoEnum.EM_ANDAMENTO,
        with_partida=True,
    )

    url = (
        f"/dias/{data_iso}/eventos/{evento_id}/partidas/{ids['partida']}"
        f"/jogadores/{ids['jogador_evento_1']}/stats"
    )
    first = client.put(url, json={"gols": 1, "assistencias": 0, "chiliques": 0, "faltas": 0})
    second = client.put(url, json={"gols": 2, "assistencias": 1, "chiliques": 0, "faltas": 0})

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    rows = (
        db_session.query(EstatisticaModel)
        .filter(
            EstatisticaModel.partida_id == ids["partida"],
            EstatisticaModel.jogador_evento_id == ids["jogador_evento_1"],
        )
        .all()
    )
    assert len(rows) == 1
    assert rows[0].gols == 2
    assert rows[0].assistencias == 1


@pytest.mark.uc09
def test_atualizar_partida_substitui_estatisticas_sem_violar_unicidade(client: TestClient, db_session):
    data_iso, evento_id, ids = _criar_evento_base(
        db_session,
        data_iso="2026-07-06-stats",
        status=StatusEventoEnum.EM_ANDAMENTO,
        with_partida=True,
    )
    db_session.add_all(
        [
            EstatisticaModel(
                partida_id=ids["partida"],
                jogador_evento_id=ids["jogador_evento_1"],
                gols=1,
            ),
            EstatisticaModel(
                partida_id=ids["partida"],
                jogador_evento_id=ids["jogador_evento_2"],
                assistencias=1,
            ),
        ]
    )
    db_session.commit()

    resp = client.put(
        f"/dias/{data_iso}/eventos/{evento_id}/partidas/{ids['partida']}",
        json={
            "estatisticas": [
                {
                    "jogador_evento_id": ids["jogador_evento_1"],
                    "gols": 3,
                    "assistencias": 2,
                    "chiliques": 0,
                    "faltas": 1,
                    "nota": 9,
                }
            ]
        },
    )

    assert resp.status_code == 200, resp.text
    assert len(resp.json()["estatisticas"]) == 1
    assert resp.json()["estatisticas"][0]["jogador_evento_id"] == ids["jogador_evento_1"]
    assert resp.json()["estatisticas"][0]["gols"] == 3


@pytest.mark.uc08
def test_criar_partida_rejeita_ordem_duplicada(client: TestClient, db_session):
    data_iso, evento_id, ids = _criar_evento_base(
        db_session,
        data_iso="2026-07-07",
        status=StatusEventoEnum.EM_ANDAMENTO,
        with_partida=True,
    )
    resp = client.post(
        f"/dias/{data_iso}/eventos/{evento_id}/partidas",
        json={"ordem": 1, "timeAId": ids["time_a"], "timeBId": ids["time_b"]},
    )
    assert resp.status_code == 409, resp.text


@pytest.mark.uc07
def test_rotacao_rejeita_expected_version_stale(client: TestClient, db_session):
    _, evento_id, _ = _criar_evento_base(
        db_session,
        data_iso="2026-07-08",
        status=StatusEventoEnum.EM_ANDAMENTO,
    )
    headers = {"X-User-Id": "coach", "X-Role": "treinador"}
    current = client.get(f"/api/eventos/{evento_id}/rotacao/estado", headers=headers)
    assert current.status_code == 200, current.text

    resp = client.patch(
        f"/api/eventos/{evento_id}/rotacao/estado",
        headers=headers,
        json={"team_size_ref": 7, "expected_version": current.json()["version"] + 1},
    )
    assert resp.status_code == 409, resp.text
    assert resp.json()["detail"]["code"] == "version_conflict"


@pytest.mark.uc06
def test_checkin_repetido_preserva_participante_e_arrival_seq(client: TestClient, db_session):
    _, evento_id, ids = _criar_evento_base(
        db_session,
        data_iso="2026-07-09",
        tipo=TipoEventoEnum.JOGO_LIVRE,
        status=StatusEventoEnum.EM_ANDAMENTO,
    )
    headers = {
        "X-User-Id": "u1",
        "X-Role": "user",
        "X-Jogador-Id": str(ids["jogador_1"]),
    }

    first = client.post(f"/api/eventos/{evento_id}/checkin", headers=headers)
    second = client.post(f"/api/eventos/{evento_id}/checkin", headers=headers)

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert second.json()["participante"]["id"] == first.json()["participante"]["id"]
    assert second.json()["participante"]["arrival_seq"] == first.json()["participante"]["arrival_seq"]

    count = (
        db_session.query(EventoParticipanteModel)
        .filter(
            EventoParticipanteModel.evento_id == evento_id,
            EventoParticipanteModel.jogador_id == ids["jogador_1"],
        )
        .count()
    )
    assert count == 1
