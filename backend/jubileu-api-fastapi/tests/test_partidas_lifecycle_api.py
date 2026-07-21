import pytest
from fastapi.testclient import TestClient

from datetime import datetime, timezone

from app.models.dia_evento import (
    Evento as EventoModel,
    Dia as DiaModel,
    JogadorEvento as JogadorEventoModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusEventoEnum,
    StatusPresencaEnum,
    TipoEventoEnum,
    TimeEvento as TimeEventoModel,
)
from app.models.jogador_turma import Turma as TurmaModel


def _criar_evento_com_partida(
    db_session,
    *,
    status_evento: StatusEventoEnum,
    status_partida: PartidaStatusEnum = PartidaStatusEnum.PLANEJADA,
):
    dia = DiaModel(data_iso="2026-05-03")
    turma = TurmaModel(nome="Turma Lifecycle")
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
        status=status_evento,
    )
    db_session.add(evento)
    db_session.flush()

    time_a = TimeEventoModel(evento_id=evento.id, nome="Time A")
    time_b = TimeEventoModel(evento_id=evento.id, nome="Time B")
    db_session.add_all([time_a, time_b])
    db_session.flush()

    db_session.add_all(
        [
            JogadorEventoModel(
                evento_id=evento.id,
                jogador_id=None,
                nome="Jogador A",
                status=StatusPresencaEnum.presente,
                time_id=time_a.id,
            ),
            JogadorEventoModel(
                evento_id=evento.id,
                jogador_id=None,
                nome="Jogador B",
                status=StatusPresencaEnum.presente,
                time_id=time_b.id,
            ),
        ]
    )
    db_session.flush()

    partida = PartidaModel(
        evento_id=evento.id,
        ordem=1,
        time_a_id=time_a.id,
        time_b_id=time_b.id,
        status=status_partida,
        inicio_at=datetime.now(timezone.utc) if status_partida == PartidaStatusEnum.EM_ANDAMENTO else None,
    )
    db_session.add(partida)
    db_session.commit()
    return dia.data_iso, evento.id, partida.id


@pytest.mark.uc08
@pytest.mark.uc09
def test_partida_lifecycle_start_end_and_lance_gate(client: TestClient, db_session):
    data_iso, evento_id, partida_id = _criar_evento_com_partida(db_session, status_evento=StatusEventoEnum.EM_ANDAMENTO)

    resp = client.put(f"/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start")
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "ok"
    assert isinstance(resp.json().get("version"), int)

    resp = client.post(
        f"/api/partidas/{partida_id}/lances",
        json={"tipo": "GOL", "payload": {"minute": 2}, "jogador_id": 999999},
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 422, resp.text
    assert "nao pertence ao evento" in resp.text

    resp = client.put(f"/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end")
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "ok"

    resp = client.post(
        f"/api/partidas/{partida_id}/lances",
        json={"tipo": "GOL", "payload": {"minute": 4}, "jogador_id": 999999},
        headers={"X-User-Id": "coach", "X-Role": "treinador"},
    )
    assert resp.status_code == 409, resp.text
    assert "Partida nao esta EM_ANDAMENTO" in resp.text


@pytest.mark.uc08
def test_partida_nao_inicia_com_evento_fora_de_andamento(client: TestClient, db_session):
    data_iso, evento_id, partida_id = _criar_evento_com_partida(db_session, status_evento=StatusEventoEnum.PLANEJADO)

    resp = client.put(f"/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start")
    assert resp.status_code == 409, resp.text
    assert "Evento precisa estar EM_ANDAMENTO" in resp.text


@pytest.mark.uc08
def test_partida_nao_encerra_sem_estar_em_andamento(client: TestClient, db_session):
    data_iso, evento_id, partida_id = _criar_evento_com_partida(db_session, status_evento=StatusEventoEnum.EM_ANDAMENTO)

    resp = client.put(f"/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end")
    assert resp.status_code == 409, resp.text
    assert "Partida nao pode encerrar neste status" in resp.text


@pytest.mark.uc05
@pytest.mark.uc08
def test_finalizar_evento_bloqueia_com_partida_ativa(client: TestClient, db_session):
    data_iso, evento_id, partida_id = _criar_evento_com_partida(db_session, status_evento=StatusEventoEnum.EM_ANDAMENTO)

    resp = client.put(f"/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start")
    assert resp.status_code == 200, resp.text

    resp = client.put(f"/dias/{data_iso}/eventos/{evento_id}/finish")
    assert resp.status_code == 409, resp.text
    assert "partida em andamento" in resp.text.lower()


@pytest.mark.uc08
def test_encerrar_partida_permite_reconciliar_evento_concluida(client: TestClient, db_session):
    data_iso, evento_id, partida_id = _criar_evento_com_partida(
        db_session,
        status_evento=StatusEventoEnum.ENCERRADO,
        status_partida=PartidaStatusEnum.EM_ANDAMENTO,
    )

    resp = client.put(f"/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end")
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "ok"
