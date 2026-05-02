from fastapi.testclient import TestClient

from app.models.dia_aula import (
    Aula as AulaModel,
    Dia as DiaModel,
    JogadorAula as JogadorAulaModel,
    StatusAulaEnum,
    StatusPresencaEnum,
    TipoEventoAulaEnum,
)
from app.models.jogador_turma import Jogador as JogadorModel, Turma as TurmaModel


def _criar_evento_jogo_livre(db_session):
    dia = DiaModel(data_iso="2026-03-01")
    turma = TurmaModel(nome="Turma JL")
    jogador_1 = JogadorModel(nome="Jogador 1", status="ativo", ativo=True)
    jogador_2 = JogadorModel(nome="Jogador 2", status="ativo", ativo=True)
    db_session.add_all([dia, turma, jogador_1, jogador_2])
    db_session.flush()

    aula = AulaModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_aula_na_turma=1,
        tipo=TipoEventoAulaEnum.JOGO,
        horario_inicio="19:00",
        horario_fim="20:00",
        status=StatusAulaEnum.PLANEJADA,
    )
    db_session.add(aula)
    db_session.flush()

    db_session.add_all(
        [
            JogadorAulaModel(
                aula_id=aula.id,
                jogador_id=jogador_1.id,
                nome=jogador_1.nome,
                status=StatusPresencaEnum.presente,
            ),
            JogadorAulaModel(
                aula_id=aula.id,
                jogador_id=jogador_2.id,
                nome=jogador_2.nome,
                status=StatusPresencaEnum.presente,
            ),
        ]
    )
    db_session.commit()
    return aula.id, jogador_1.id, jogador_2.id


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


def test_eventos_presentes_order_invalido_retorna_422(client: TestClient, db_session):
    evento_id, jogador_1_id, _ = _criar_evento_jogo_livre(db_session)
    headers = {
        "X-User-Id": "u1",
        "X-Role": "user",
        "X-Jogador-Id": str(jogador_1_id),
    }

    resp = client.get(f"/api/eventos/{evento_id}/presentes?order=foo", headers=headers)
    assert resp.status_code == 422, resp.text


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


def test_eventos_lances_partida_fora_do_evento_retorna_404(client: TestClient, db_session):
    evento_id, jogador_1_id, _ = _criar_evento_jogo_livre(db_session)
    headers = {
        "X-User-Id": "u1",
        "X-Role": "user",
        "X-Jogador-Id": str(jogador_1_id),
    }

    resp = client.get(f"/api/eventos/{evento_id}/lances?partida_id=999999", headers=headers)
    assert resp.status_code == 404, resp.text


def test_eventos_lances_limit_fora_da_faixa_retorna_422(client: TestClient, db_session):
    evento_id, jogador_1_id, _ = _criar_evento_jogo_livre(db_session)
    headers = {
        "X-User-Id": "u1",
        "X-Role": "user",
        "X-Jogador-Id": str(jogador_1_id),
    }

    resp = client.get(f"/api/eventos/{evento_id}/lances?limit=0", headers=headers)
    assert resp.status_code == 422, resp.text
