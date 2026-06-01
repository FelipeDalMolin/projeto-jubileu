import pytest
from fastapi.testclient import TestClient

from app.models.dia_evento import (
    Evento as EventoModel,
    Dia as DiaModel,
    EventoParticipante as EventoParticipanteModel,
    EventoParticipanteStatusEnum,
    JogadorEvento as JogadorEventoModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusEventoEnum,
    StatusPresencaEnum,
    TimeEvento as TimeEventoModel,
    TipoEventoEnum,
)
from app.models.jogador_turma import Jogador as JogadorModel, Turma as TurmaModel


def _headers_treinador():
    return {"X-User-Id": "coach", "X-Role": "treinador"}


def _criar_evento_evento_27(db_session):
    dia = DiaModel(data_iso="2026-05-10")
    turma = TurmaModel(nome="Turma Rotacao Evento")
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
        status=StatusEventoEnum.EM_ANDAMENTO,
    )
    db_session.add(evento)
    db_session.flush()

    time_a = TimeEventoModel(evento_id=evento.id, nome="Time A")
    time_b = TimeEventoModel(evento_id=evento.id, nome="Time B")
    db_session.add_all([time_a, time_b])
    db_session.flush()

    jogadores = []
    for idx in range(1, 28):
        jogador = JogadorEventoModel(
            evento_id=evento.id,
            jogador_id=None,
            nome=f"Jogador {idx}",
            status=StatusPresencaEnum.presente,
            time_id=time_a.id if idx <= 8 else time_b.id if idx <= 16 else None,
        )
        jogadores.append(jogador)
    db_session.add_all(jogadores)
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
    return evento.id, partida.id


def _criar_evento_jogo_livre_rotacao(db_session):
    dia = DiaModel(data_iso="2026-05-11")
    turma = TurmaModel(nome="Turma Rotacao JL")
    db_session.add_all([dia, turma])
    db_session.flush()

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_evento_na_turma=1,
        tipo=TipoEventoEnum.JOGO_LIVRE,
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

    jogadores_db = []
    jogadores_evento = []
    for idx in range(1, 13):
        jogador = JogadorModel(nome=f"Jogador JL {idx}", status="ativo", ativo=True)
        jogadores_db.append(jogador)
    db_session.add_all(jogadores_db)
    db_session.flush()

    for idx, jogador in enumerate(jogadores_db, start=1):
        jogadores_evento.append(
            JogadorEventoModel(
                evento_id=evento.id,
                jogador_id=jogador.id,
                nome=jogador.nome,
                status=StatusPresencaEnum.presente,
                time_id=time_a.id if idx <= 5 else time_b.id if idx <= 10 else None,
            )
        )
    db_session.add_all(jogadores_evento)
    db_session.flush()

    participantes = []
    for idx, jogador in enumerate(jogadores_db, start=1):
        participantes.append(
            EventoParticipanteModel(
                evento_id=evento.id,
                jogador_id=jogador.id,
                status=EventoParticipanteStatusEnum.CHECKED_IN,
                arrival_seq=idx,
                created_by_user_id="seed",
                updated_by_user_id="seed",
            )
        )
    db_session.add_all(participantes)

    partida = PartidaModel(
        evento_id=evento.id,
        ordem=1,
        status=PartidaStatusEnum.EM_ANDAMENTO,
        time_a_id=time_a.id,
        time_b_id=time_b.id,
    )
    db_session.add(partida)
    db_session.commit()
    return evento.id


def _criar_evento_evento_desbalanceado(db_session):
    dia = DiaModel(data_iso="2026-05-12")
    turma = TurmaModel(nome="Turma Desbalanceada")
    db_session.add_all([dia, turma])
    db_session.flush()

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_evento_na_turma=1,
        tipo=TipoEventoEnum.AULA,
        horario_inicio="21:00",
        horario_fim="22:00",
        status=StatusEventoEnum.EM_ANDAMENTO,
    )
    db_session.add(evento)
    db_session.flush()

    time_a = TimeEventoModel(evento_id=evento.id, nome="Time A")
    time_b = TimeEventoModel(evento_id=evento.id, nome="Time B")
    db_session.add_all([time_a, time_b])
    db_session.flush()

    jogadores = []
    for idx in range(1, 19):
        jogadores.append(
            JogadorEventoModel(
                evento_id=evento.id,
                jogador_id=None,
                nome=f"Jogador D {idx}",
                status=StatusPresencaEnum.presente,
                time_id=time_a.id if idx <= 8 else time_b.id if idx <= 15 else None,
            )
        )
    db_session.add_all(jogadores)
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
    return evento.id


@pytest.mark.uc07
def test_rotacao_estado_27_jogadores_team_size_8(client: TestClient, db_session):
    evento_id, _ = _criar_evento_evento_27(db_session)

    resp = client.get(f"/api/eventos/{evento_id}/rotacao/estado", headers=_headers_treinador())
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["team_size_ref"] == 8
    assert data["indicadores"]["jogadores_em_campo"] == 16
    assert data["indicadores"]["jogadores_na_fila"] == 11
    assert data["indicadores"]["proximos_times_completos"] == 1
    assert data["indicadores"]["jogadores_aguardando_complemento"] == 5


@pytest.mark.uc07
def test_rotacao_preview_cancel_confirm_sem_bloquear_desbalanceado(client: TestClient, db_session):
    evento_id, _ = _criar_evento_evento_27(db_session)

    before_resp = client.get(f"/api/eventos/{evento_id}/rotacao/estado", headers=_headers_treinador())
    assert before_resp.status_code == 200, before_resp.text
    before = before_resp.json()
    grupo_incompleto = next((g for g in before["proximos_times"] if not g["completo"]), None)
    assert grupo_incompleto is not None
    assert grupo_incompleto["faltam"] == 5

    preview_resp = client.post(
        f"/api/eventos/{evento_id}/rotacao/preview-sorteio",
        json={"grupo_alvo_id": grupo_incompleto["grupo_id"]},
        headers=_headers_treinador(),
    )
    assert preview_resp.status_code == 200, preview_resp.text
    preview = preview_resp.json()
    assert preview["needed_count"] == 5
    assert len(preview["sorteados_ids"]) == 5

    unchanged_resp = client.get(f"/api/eventos/{evento_id}/rotacao/estado", headers=_headers_treinador())
    unchanged = unchanged_resp.json()
    assert unchanged["version"] == before["version"]
    assert unchanged["fila_jogadores_ids"] == before["fila_jogadores_ids"]

    confirm_resp = client.post(
        f"/api/eventos/{evento_id}/rotacao/confirmar-sorteio",
        json={"token": preview["token"]},
        headers=_headers_treinador(),
    )
    assert confirm_resp.status_code == 200, confirm_resp.text
    confirm_data = confirm_resp.json()
    assert confirm_data["audit"]["status"] == "CONFIRMED"
    assert len(confirm_data["audit"]["nao_sorteados_ids"]) >= 1
    assert confirm_data["estado"]["version"] == before["version"] + 1
    assert len(confirm_data["estado"]["fila_jogadores_ids"]) == len(before["fila_jogadores_ids"]) - 5


@pytest.mark.uc07
def test_rotacao_estado_jogo_livre_suporta_time_desbalanceado(client: TestClient, db_session):
    evento_id = _criar_evento_jogo_livre_rotacao(db_session)
    resp = client.get(f"/api/eventos/{evento_id}/rotacao/estado", headers=_headers_treinador())
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["indicadores"]["jogadores_em_campo"] == 10
    assert data["indicadores"]["jogadores_na_fila"] == 2


@pytest.mark.uc07
def test_rotacao_aceita_time_desbalanceado_8_vs_7(client: TestClient, db_session):
    evento_id = _criar_evento_evento_desbalanceado(db_session)
    resp = client.get(f"/api/eventos/{evento_id}/rotacao/estado", headers=_headers_treinador())
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["indicadores"]["jogadores_em_campo"] == 15
    assert data["indicadores"]["jogadores_na_fila"] == 3


@pytest.mark.uc07
def test_rotacao_permite_atualizar_team_size_ref(client: TestClient, db_session):
    evento_id, _ = _criar_evento_evento_27(db_session)
    before = client.get(f"/api/eventos/{evento_id}/rotacao/estado", headers=_headers_treinador()).json()
    assert before["team_size_ref"] == 8

    patch_resp = client.patch(
        f"/api/eventos/{evento_id}/rotacao/estado",
        json={"team_size_ref": 7},
        headers=_headers_treinador(),
    )
    assert patch_resp.status_code == 200, patch_resp.text
    after = patch_resp.json()
    assert after["team_size_ref"] == 7
    assert after["version"] == before["version"] + 1


@pytest.mark.uc07
def test_rotacao_reconcilia_fila_quando_jogador_sai_do_campo(client: TestClient, db_session):
    evento_id, partida_id = _criar_evento_evento_27(db_session)

    before_resp = client.get(f"/api/eventos/{evento_id}/rotacao/estado", headers=_headers_treinador())
    assert before_resp.status_code == 200, before_resp.text
    before = before_resp.json()

    partida = db_session.query(PartidaModel).filter(PartidaModel.id == partida_id).first()
    assert partida is not None
    time_fora = TimeEventoModel(evento_id=evento_id, nome="Time Fora")
    db_session.add(time_fora)
    db_session.flush()

    jogador_em_campo = (
        db_session.query(JogadorEventoModel)
        .filter(
            JogadorEventoModel.evento_id == evento_id,
            JogadorEventoModel.time_id == partida.time_a_id,
        )
        .order_by(JogadorEventoModel.id.asc())
        .first()
    )
    assert jogador_em_campo is not None
    jogador_em_campo.time_id = time_fora.id
    db_session.commit()

    after_resp = client.get(f"/api/eventos/{evento_id}/rotacao/estado", headers=_headers_treinador())
    assert after_resp.status_code == 200, after_resp.text
    after = after_resp.json()

    assert jogador_em_campo.id in after["fila_jogadores_ids"]
    assert after["indicadores"]["jogadores_na_fila"] == before["indicadores"]["jogadores_na_fila"] + 1
