import pytest
from fastapi.testclient import TestClient

from app.models.dia_evento import (
    Dia as DiaModel,
    Evento as EventoModel,
    EventoParticipante as EventoParticipanteModel,
    EventoParticipanteStatusEnum,
    JogadorEvento as JogadorEventoModel,
    StatusEventoEnum,
    StatusPresencaEnum,
    TipoEventoEnum,
)
from app.models.jogador_turma import Jogador as JogadorModel, Turma as TurmaModel
from app.models.usuario import Usuario as UsuarioModel
from app.modules.auth.service import password_hash


@pytest.mark.uc01
def test_usuario_me_retorna_perfil_e_eventos_participados(client: TestClient, db_session):
    turma = TurmaModel(nome="Sub 11")
    jogador = JogadorModel(nome="Joao", apelido="J", status="ativo", ativo=True)
    db_session.add_all([turma, jogador])
    db_session.flush()

    dia = DiaModel(data_iso="2026-05-09")
    db_session.add(dia)
    db_session.flush()

    evento = EventoModel(
        dia_id=dia.id,
        turma_id=turma.id,
        turma_nome=turma.nome,
        numero_evento_na_turma=1,
        tipo=TipoEventoEnum.AULA,
        horario_inicio="09:00",
        horario_fim="10:00",
        status=StatusEventoEnum.ENCERRADO,
    )
    db_session.add(evento)
    db_session.flush()

    db_session.add_all(
        [
            JogadorEventoModel(
                evento_id=evento.id,
                jogador_id=jogador.id,
                nome=jogador.nome,
                status=StatusPresencaEnum.presente,
            ),
            EventoParticipanteModel(
                evento_id=evento.id,
                jogador_id=jogador.id,
                status=EventoParticipanteStatusEnum.CHECKED_IN,
            ),
            UsuarioModel(
                user_id="u-joao",
                username="joao",
                password_hash=password_hash("joao123"),
                display_name="Joao Silva",
                email="joao@example.test",
                role="user",
                jogador_id=jogador.id,
            ),
        ]
    )
    db_session.commit()

    resp = client.get(
        "/api/usuarios/me",
        headers={"X-User-Id": "u-joao", "X-Role": "user"},
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["usuario"]["username"] == "joao"
    assert body["usuario"]["jogador_id"] == jogador.id
    assert body["jogador"]["id"] == jogador.id
    assert body["eventos"][0]["evento_id"] == evento.id
    assert body["eventos"][0]["participante_status"] == "CHECKED_IN"
