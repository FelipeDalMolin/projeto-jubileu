import pytest
from fastapi.testclient import TestClient

from app.models.dia_evento import (
    Evento as EventoModel,
    Dia as DiaModel,
    EventoRotacaoEstado as EventoRotacaoEstadoModel,
    JogadorEvento as JogadorEventoModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusEventoEnum,
    StatusPresencaEnum,
    TimeEvento as TimeEventoModel,
    TipoEventoEnum,
)
from app.models.jogador_turma import Jogador as JogadorModel, Turma as TurmaModel


def _criar_evento_jogo_livre(db_session):
    dia = DiaModel(data_iso="2026-03-01")
    turma = TurmaModel(nome="Turma JL")
    jogador_1 = JogadorModel(nome="Jogador 1", status="ativo", ativo=True)
    jogador_2 = JogadorModel(nome="Jogador 2", status="ativo", ativo=True)
    db_session.add_all([dia, turma, jogador_1, jogador_2])
    db_session.flush()

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_evento_na_turma=1,
        tipo=TipoEventoEnum.JOGO_LIVRE,
        horario_inicio="19:00",
        horario_fim="20:00",
        status=StatusEventoEnum.PLANEJADO,
    )
    db_session.add(evento)
    db_session.flush()

    db_session.add_all(
        [
            JogadorEventoModel(
                evento_id=evento.id,
                jogador_id=jogador_1.id,
                nome=jogador_1.nome,
                status=StatusPresencaEnum.presente,
            ),
            JogadorEventoModel(
                evento_id=evento.id,
                jogador_id=jogador_2.id,
                nome=jogador_2.nome,
                status=StatusPresencaEnum.presente,
            ),
        ]
    )
    db_session.commit()
    return evento.id, jogador_1.id, jogador_2.id


def _criar_evento_evento_com_partida_para_lance(db_session):
    dia = DiaModel(data_iso="2026-03-02")
    turma = TurmaModel(nome="Turma Evento Lance")
    jogador_global = JogadorModel(nome="Jogador Global", status="ativo", ativo=True)
    db_session.add_all([dia, turma, jogador_global])
    db_session.flush()

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_evento_na_turma=1,
        tipo=TipoEventoEnum.AULA,
        horario_inicio="20:00",
        horario_fim="21:00",
        status=StatusEventoEnum.EM_ANDAMENTO,
    )
    db_session.add(evento)
    db_session.flush()

    time_a = TimeEventoModel(evento_id=evento.id, nome="Time A")
    time_b = TimeEventoModel(evento_id=evento.id, nome="Time B")
    db_session.add_all([time_a, time_b])
    db_session.flush()

    jogador_evento_com_global = JogadorEventoModel(
        evento_id=evento.id,
        jogador_id=jogador_global.id,
        nome=jogador_global.nome,
        status=StatusPresencaEnum.presente,
        time_id=time_a.id,
    )
    jogador_evento_sem_global = JogadorEventoModel(
        evento_id=evento.id,
        jogador_id=None,
        nome="Sem Global",
        status=StatusPresencaEnum.presente,
        time_id=time_b.id,
    )
    db_session.add_all([jogador_evento_com_global, jogador_evento_sem_global])
    db_session.flush()

    partida = PartidaModel(
        evento_id=evento.id,
        ordem=1,
        status=PartidaStatusEnum.EM_ANDAMENTO,
        time_a_id=time_a.id,
        time_b_id=time_b.id,
    )
    db_session.add(partida)
    db_session.commit()
    return {
        "evento_id": evento.id,
        "partida_id": partida.id,
        "jogador_global_id": jogador_global.id,
        "jogador_evento_id_com_global": jogador_evento_com_global.id,
        "jogador_evento_id_sem_global": jogador_evento_sem_global.id,
    }


def _criar_evento_evento_sem_presentes(db_session) -> int:
    dia = DiaModel(data_iso="2026-03-03")
    turma = TurmaModel(nome="Turma Sem Presentes")
    db_session.add_all([dia, turma])
    db_session.flush()

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_evento_na_turma=1,
        tipo=TipoEventoEnum.AULA,
        horario_inicio="18:00",
        horario_fim="19:00",
        status=StatusEventoEnum.PLANEJADO,
    )
    db_session.add(evento)
    db_session.flush()
    db_session.add_all(
        [
            JogadorEventoModel(
                evento_id=evento.id,
                jogador_id=None,
                nome="J1",
                status=StatusPresencaEnum.so_treino,
            ),
            JogadorEventoModel(
                evento_id=evento.id,
                jogador_id=None,
                nome="J2",
                status=StatusPresencaEnum.faltou,
            ),
        ]
    )
    db_session.commit()
    return evento.id


def _criar_evento_evento_para_rotacao_update(db_session):
    dia = DiaModel(data_iso="2026-03-04")
    turma = TurmaModel(nome="Turma Rotacao")
    jogadores = [
        JogadorModel(nome="R1", status="ativo", ativo=True),
        JogadorModel(nome="R2", status="ativo", ativo=True),
        JogadorModel(nome="R3", status="ativo", ativo=True),
        JogadorModel(nome="R4", status="ativo", ativo=True),
    ]
    db_session.add_all([dia, turma, *jogadores])
    db_session.flush()

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_evento_na_turma=1,
        tipo=TipoEventoEnum.AULA,
        horario_inicio="17:00",
        horario_fim="18:00",
        status=StatusEventoEnum.PLANEJADO,
    )
    db_session.add(evento)
    db_session.flush()

    jogadores_evento = []
    for jogador in jogadores:
        jogadores_evento.append(
            JogadorEventoModel(
                evento_id=evento.id,
                jogador_id=jogador.id,
                nome=jogador.nome,
                status=StatusPresencaEnum.presente,
            )
        )
    db_session.add_all(jogadores_evento)
    db_session.commit()
    return evento.id, [ja.id for ja in jogadores_evento]


def _criar_evento_evento_para_preview_rotacao(db_session):
    dia = DiaModel(data_iso="2026-03-05")
    turma = TurmaModel(nome="Turma Rotacao Preview")
    jogadores = [
        JogadorModel(nome="P1", status="ativo", ativo=True),
        JogadorModel(nome="P2", status="ativo", ativo=True),
        JogadorModel(nome="P3", status="ativo", ativo=True),
        JogadorModel(nome="P4", status="ativo", ativo=True),
    ]
    db_session.add_all([dia, turma, *jogadores])
    db_session.flush()

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_evento_na_turma=1,
        tipo=TipoEventoEnum.AULA,
        horario_inicio="19:00",
        horario_fim="20:00",
        status=StatusEventoEnum.EM_ANDAMENTO,
    )
    db_session.add(evento)
    db_session.flush()

    time_a = TimeEventoModel(evento_id=evento.id, nome="Time A")
    time_b = TimeEventoModel(evento_id=evento.id, nome="Time B")
    db_session.add_all([time_a, time_b])
    db_session.flush()

    ja1 = JogadorEventoModel(evento_id=evento.id, jogador_id=jogadores[0].id, nome="P1", status=StatusPresencaEnum.presente, time_id=time_a.id)
    ja2 = JogadorEventoModel(evento_id=evento.id, jogador_id=jogadores[1].id, nome="P2", status=StatusPresencaEnum.presente, time_id=time_b.id)
    ja3 = JogadorEventoModel(evento_id=evento.id, jogador_id=jogadores[2].id, nome="P3", status=StatusPresencaEnum.presente, time_id=None)
    ja4 = JogadorEventoModel(evento_id=evento.id, jogador_id=jogadores[3].id, nome="P4", status=StatusPresencaEnum.presente, time_id=None)
    db_session.add_all([ja1, ja2, ja3, ja4])
    db_session.flush()

    partida = PartidaModel(
        evento_id=evento.id,
        ordem=1,
        status=PartidaStatusEnum.EM_ANDAMENTO,
        time_a_id=time_a.id,
        time_b_id=time_b.id,
    )
    db_session.add(partida)
    db_session.flush()

    db_session.add(
        EventoRotacaoEstadoModel(
            evento_id=evento.id,
            team_size_ref=2,
            fila_jogadores_ids=[ja1.id, ja2.id, ja3.id, ja4.id],
            proximos_times=[{"grupo_id": "grupo-1", "jogadores_ids": [ja3.id]}],
            version=1,
        )
    )
    db_session.commit()
    return evento.id, {ja1.id, ja2.id}


@pytest.mark.uc05
@pytest.mark.uc06
@pytest.mark.uc08
@pytest.mark.uc09
def test_eventos_flow_rsvp_checkin_seed_lance(client: TestClient, db_session):
    evento_id, jogador_1_id, jogador_2_id = _criar_evento_jogo_livre(db_session)

    resp = client.post(
        f"/api/eventos/{evento_id}/rsvp",
        headers={
            "X-User-Id": "u1",
            "X-Role": "user",
            "X-Jogador-Id": str(jogador_1_id),
        },
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["participante"]["status"] == "RSVP"

    resp = client.post(
        f"/api/eventos/{evento_id}/start",
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["evento"]["status"] == "EM_ANDAMENTO"

    resp = client.post(
        f"/api/eventos/{evento_id}/checkin",
        headers={
            "X-User-Id": "u1",
            "X-Role": "user",
            "X-Jogador-Id": str(jogador_1_id),
        },
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["participante"]["status"] == "CHECKED_IN"
    assert isinstance(resp.json()["participante"]["arrival_seq"], int)

    resp = client.delete(
        f"/api/eventos/{evento_id}/checkin",
        headers={
            "X-User-Id": "u1",
            "X-Role": "user",
            "X-Jogador-Id": str(jogador_1_id),
        },
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["participante"]["status"] == "CHECKED_OUT"

    resp = client.delete(
        f"/api/eventos/{evento_id}/rsvp",
        headers={
            "X-User-Id": "u1",
            "X-Role": "user",
            "X-Jogador-Id": str(jogador_1_id),
        },
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["participante"]["status"] == "CANCELED"

    resp = client.post(
        f"/api/eventos/{evento_id}/checkin",
        headers={
            "X-User-Id": "u1",
            "X-Role": "user",
            "X-Jogador-Id": str(jogador_1_id),
        },
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["participante"]["status"] == "CHECKED_IN"

    resp = client.post(
        f"/api/eventos/{evento_id}/participants/{jogador_2_id}/checkin",
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["participante"]["status"] == "CHECKED_IN"

    resp = client.post(
        f"/api/eventos/{evento_id}/partidas/seed",
        json={"mode": "arrival_first", "players_count": 2, "team_size": 1},
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 200, resp.text
    partida_id = resp.json()["partida"]["id"]
    assert resp.json()["partida"]["status"] == "EM_ANDAMENTO"

    resp = client.post(
        f"/api/partidas/{partida_id}/lances",
        json={"tipo": "GOL", "payload": {"minute": 3}, "jogador_id": jogador_1_id},
        headers={"X-User-Id": "u1", "X-Role": "user", "X-Jogador-Id": str(jogador_1_id)},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["lance"]["tipo"] == "GOL"

    resp = client.get(
        f"/api/eventos/{evento_id}/lances",
        headers={"X-User-Id": "u1", "X-Role": "user", "X-Jogador-Id": str(jogador_1_id)},
    )
    assert resp.status_code == 200, resp.text
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["tipo"] == "GOL"
    assert items[0]["jogador_nome"] == "Jogador 1"


@pytest.mark.uc06
def test_eventos_presentes_order_invalido_retorna_422(client: TestClient, db_session):
    evento_id, jogador_1_id, _ = _criar_evento_jogo_livre(db_session)
    headers = {
        "X-User-Id": "u1",
        "X-Role": "user",
        "X-Jogador-Id": str(jogador_1_id),
    }

    resp = client.get(f"/api/eventos/{evento_id}/presentes?order=foo", headers=headers)
    assert resp.status_code == 422, resp.text


@pytest.mark.uc09
def test_eventos_lances_since_invalido_retorna_422(client: TestClient, db_session):
    evento_id, jogador_1_id, _ = _criar_evento_jogo_livre(db_session)
    headers = {
        "X-User-Id": "u1",
        "X-Role": "user",
        "X-Jogador-Id": str(jogador_1_id),
    }

    resp = client.get(f"/api/eventos/{evento_id}/lances?since=nao-data", headers=headers)
    assert resp.status_code == 422, resp.text
    assert "since" in resp.text.lower()


@pytest.mark.uc09
def test_eventos_lances_partida_fora_do_evento_retorna_404(client: TestClient, db_session):
    evento_id, jogador_1_id, _ = _criar_evento_jogo_livre(db_session)
    headers = {
        "X-User-Id": "u1",
        "X-Role": "user",
        "X-Jogador-Id": str(jogador_1_id),
    }

    resp = client.get(f"/api/eventos/{evento_id}/lances?partida_id=999999", headers=headers)
    assert resp.status_code == 404, resp.text


@pytest.mark.uc09
def test_eventos_lances_limit_fora_da_faixa_retorna_422(client: TestClient, db_session):
    evento_id, jogador_1_id, _ = _criar_evento_jogo_livre(db_session)
    headers = {
        "X-User-Id": "u1",
        "X-Role": "user",
        "X-Jogador-Id": str(jogador_1_id),
    }

    resp = client.get(f"/api/eventos/{evento_id}/lances?limit=0", headers=headers)
    assert resp.status_code == 422, resp.text


@pytest.mark.uc09
def test_lance_aceita_jogador_evento_id_convertendo_para_jogador_global(client: TestClient, db_session):
    ctx = _criar_evento_evento_com_partida_para_lance(db_session)

    resp = client.post(
        f"/api/partidas/{ctx['partida_id']}/lances",
        json={
            "tipo": "GOL",
            "payload": {"minute": 5, "time_id": 1},
            "jogador_id": ctx["jogador_evento_id_com_global"],
        },
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 200, resp.text
    lance = resp.json()["lance"]
    assert lance["jogador_id"] == ctx["jogador_global_id"]


@pytest.mark.uc09
def test_lance_rejeita_jogador_evento_sem_vinculo_global(client: TestClient, db_session):
    ctx = _criar_evento_evento_com_partida_para_lance(db_session)

    resp = client.post(
        f"/api/partidas/{ctx['partida_id']}/lances",
        json={
            "tipo": "GOL",
            "payload": {"minute": 8},
            "jogador_id": ctx["jogador_evento_id_sem_global"],
        },
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 422, resp.text
    assert "sem vinculo global" in resp.text.lower()


@pytest.mark.uc05
@pytest.mark.uc08
def test_end_evento_bloqueia_com_partida_em_andamento(client: TestClient, db_session):
    ctx = _criar_evento_evento_com_partida_para_lance(db_session)
    resp = client.post(
        f"/api/eventos/{ctx['evento_id']}/end",
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 409, resp.text
    assert "encerre a partida" in resp.text.lower()


@pytest.mark.uc05
def test_start_evento_permite_sem_jogadores_presentes(client: TestClient, db_session):
    evento_id = _criar_evento_evento_sem_presentes(db_session)
    resp = client.post(
        f"/api/eventos/{evento_id}/start",
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["evento"]["status"] == "EM_ANDAMENTO"


@pytest.mark.uc07
def test_update_rotacao_estado_aceita_filas_de_jogadores_e_times(client: TestClient, db_session):
    evento_id, jogador_evento_ids = _criar_evento_evento_para_rotacao_update(db_session)
    headers = {"X-User-Id": "coach", "X-Role": "treinador"}

    resp = client.patch(
        f"/api/eventos/{evento_id}/rotacao/estado",
        headers=headers,
        json={
            "fila_jogadores_ids": list(reversed(jogador_evento_ids)),
            "proximos_times": [
                {"grupo_id": "time:manual-1", "jogadores_ids": [jogador_evento_ids[0], jogador_evento_ids[1]]},
                {"grupo_id": "time:manual-2", "jogadores_ids": [jogador_evento_ids[2], jogador_evento_ids[3]]},
            ],
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["fila_jogadores_ids"] == list(reversed(jogador_evento_ids))
    assert len(body["proximos_times"]) >= 2
    assert body["proximos_times"][0]["grupo_id"] == "time:manual-1"
    assert body["proximos_times"][1]["grupo_id"] == "time:manual-2"


@pytest.mark.uc07
def test_preview_rotacao_exclui_jogadores_em_campo(client: TestClient, db_session):
    evento_id, ids_em_campo = _criar_evento_evento_para_preview_rotacao(db_session)
    headers = {"X-User-Id": "coach", "X-Role": "treinador"}

    resp = client.post(
        f"/api/eventos/{evento_id}/rotacao/preview-sorteio",
        headers=headers,
        json={"grupo_alvo_id": "grupo-1"},
    )
    assert resp.status_code == 200, resp.text
    candidatos = set(resp.json()["candidatos_ids"])
    assert candidatos.isdisjoint(ids_em_campo)
