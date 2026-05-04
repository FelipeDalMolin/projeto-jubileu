from fastapi.testclient import TestClient

from datetime import datetime, timezone

from app.models.dia_aula import (
    Aula as AulaModel,
    Dia as DiaModel,
    JogadorAula as JogadorAulaModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusAulaEnum,
    StatusPresencaEnum,
    TipoEventoAulaEnum,
    TimeAula as TimeAulaModel,
)
from app.models.jogador_turma import Turma as TurmaModel


def _criar_aula_com_partida(
    db_session,
    *,
    status_aula: StatusAulaEnum,
    status_partida: PartidaStatusEnum = PartidaStatusEnum.PLANEJADA,
):
    dia = DiaModel(data_iso="2026-05-03")
    turma = TurmaModel(nome="Turma Lifecycle")
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
        status=status_aula,
    )
    db_session.add(aula)
    db_session.flush()

    time_a = TimeAulaModel(aula_id=aula.id, nome="Time A")
    time_b = TimeAulaModel(aula_id=aula.id, nome="Time B")
    db_session.add_all([time_a, time_b])
    db_session.flush()

    db_session.add_all(
        [
            JogadorAulaModel(
                aula_id=aula.id,
                jogador_id=None,
                nome="Jogador A",
                status=StatusPresencaEnum.presente,
                time_id=time_a.id,
            ),
            JogadorAulaModel(
                aula_id=aula.id,
                jogador_id=None,
                nome="Jogador B",
                status=StatusPresencaEnum.presente,
                time_id=time_b.id,
            ),
        ]
    )
    db_session.flush()

    partida = PartidaModel(
        aula_id=aula.id,
        ordem=1,
        time_a_id=time_a.id,
        time_b_id=time_b.id,
        status=status_partida,
        inicio_at=datetime.now(timezone.utc) if status_partida == PartidaStatusEnum.EM_ANDAMENTO else None,
    )
    db_session.add(partida)
    db_session.commit()
    return dia.data_iso, aula.id, partida.id


def test_partida_lifecycle_start_end_and_lance_gate(client: TestClient, db_session):
    data_iso, aula_id, partida_id = _criar_aula_com_partida(db_session, status_aula=StatusAulaEnum.EM_ANDAMENTO)

    resp = client.put(f"/dias/{data_iso}/aulas/{aula_id}/partidas/{partida_id}/start")
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "ok"
    assert isinstance(resp.json().get("version"), int)

    resp = client.post(
        f"/api/partidas/{partida_id}/lances",
        json={"tipo": "GOL", "payload": {"minute": 2}},
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["lance"]["tipo"] == "GOL"

    resp = client.put(f"/dias/{data_iso}/aulas/{aula_id}/partidas/{partida_id}/end")
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "ok"

    resp = client.post(
        f"/api/partidas/{partida_id}/lances",
        json={"tipo": "GOL", "payload": {"minute": 4}},
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 409, resp.text
    assert "Partida nao esta EM_ANDAMENTO" in resp.text


def test_partida_nao_inicia_com_evento_fora_de_andamento(client: TestClient, db_session):
    data_iso, aula_id, partida_id = _criar_aula_com_partida(db_session, status_aula=StatusAulaEnum.PLANEJADA)

    resp = client.put(f"/dias/{data_iso}/aulas/{aula_id}/partidas/{partida_id}/start")
    assert resp.status_code == 409, resp.text
    assert "Evento precisa estar EM_ANDAMENTO" in resp.text


def test_partida_nao_encerra_sem_estar_em_andamento(client: TestClient, db_session):
    data_iso, aula_id, partida_id = _criar_aula_com_partida(db_session, status_aula=StatusAulaEnum.EM_ANDAMENTO)

    resp = client.put(f"/dias/{data_iso}/aulas/{aula_id}/partidas/{partida_id}/end")
    assert resp.status_code == 409, resp.text
    assert "Partida nao pode encerrar neste status" in resp.text


def test_finalizar_aula_bloqueia_com_partida_ativa(client: TestClient, db_session):
    data_iso, aula_id, partida_id = _criar_aula_com_partida(db_session, status_aula=StatusAulaEnum.EM_ANDAMENTO)

    resp = client.put(f"/dias/{data_iso}/aulas/{aula_id}/partidas/{partida_id}/start")
    assert resp.status_code == 200, resp.text

    resp = client.put(f"/dias/{data_iso}/aulas/{aula_id}/finish")
    assert resp.status_code == 409, resp.text
    assert "partida em andamento" in resp.text.lower()


def test_encerrar_partida_permite_reconciliar_aula_concluida(client: TestClient, db_session):
    data_iso, aula_id, partida_id = _criar_aula_com_partida(
        db_session,
        status_aula=StatusAulaEnum.CONCLUIDA,
        status_partida=PartidaStatusEnum.EM_ANDAMENTO,
    )

    resp = client.put(f"/dias/{data_iso}/aulas/{aula_id}/partidas/{partida_id}/end")
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "ok"
