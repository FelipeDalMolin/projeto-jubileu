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


@pytest.mark.uc01
def test_usuario_comum_nao_altera_jogador_vinculado(client: TestClient, db_session):
    jogador = JogadorModel(nome="Maria", apelido="M", status="ativo", ativo=True)
    usuario = UsuarioModel(
        user_id="u-maria",
        username="maria",
        password_hash=password_hash("maria123"),
        display_name="Maria Souza",
        email="maria@example.test",
        role="user",
        jogador_id=None,
    )
    db_session.add_all([jogador, usuario])
    db_session.commit()

    headers = {"X-User-Id": "u-maria", "X-Role": "user"}
    resp = client.put(
        "/api/usuarios/me/jogador",
        json={"jogador_id": jogador.id},
        headers=headers,
    )

    assert resp.status_code == 403, resp.text
    db_session.refresh(usuario)
    assert usuario.jogador_id is None


@pytest.mark.uc01
def test_treinador_atualiza_e_remove_proprio_jogador_vinculado(client: TestClient, db_session):
    jogador = JogadorModel(nome="Treinador", apelido="T", status="ativo", ativo=True)
    usuario = UsuarioModel(
        user_id="u-tecnico",
        username="tecnico",
        password_hash=password_hash("senha123"),
        display_name="Tecnico",
        email=None,
        role="treinador",
        jogador_id=None,
    )
    db_session.add_all([jogador, usuario])
    db_session.commit()

    headers = {"X-User-Id": usuario.user_id, "X-Role": "treinador"}
    resp = client.put("/api/usuarios/me/jogador", json={"jogador_id": jogador.id}, headers=headers)
    assert resp.status_code == 200, resp.text
    assert resp.json()["usuario"]["jogador_id"] == jogador.id

    resp_clear = client.put("/api/usuarios/me/jogador", json={"jogador_id": None}, headers=headers)
    assert resp_clear.status_code == 200, resp_clear.text
    assert resp_clear.json()["usuario"]["jogador_id"] is None


@pytest.mark.uc01
def test_vinculo_de_jogador_e_exclusivo(client: TestClient, db_session):
    jogador = JogadorModel(nome="Exclusivo", apelido="E", status="ativo", ativo=True)
    db_session.add(jogador)
    db_session.flush()
    primeiro = UsuarioModel(
        user_id="u-primeiro",
        username="primeiro",
        password_hash=password_hash("senha123"),
        display_name="Primeiro",
        email=None,
        role="treinador",
        jogador_id=jogador.id,
    )
    segundo = UsuarioModel(
        user_id="u-segundo",
        username="segundo",
        password_hash=password_hash("senha123"),
        display_name="Segundo",
        email=None,
        role="admin",
        jogador_id=None,
    )
    db_session.add_all([primeiro, segundo])
    db_session.commit()

    resp = client.put(
        "/api/usuarios/me/jogador",
        json={"jogador_id": jogador.id},
        headers={"X-User-Id": segundo.user_id, "X-Role": "admin"},
    )

    assert resp.status_code == 409, resp.text
    assert resp.json()["detail"]["code"] == "jogador_already_linked"


@pytest.mark.uc01
def test_usuario_me_rejeita_jogador_inexistente(client: TestClient, db_session):
    usuario = UsuarioModel(
        user_id="u-sem-jogador",
        username="semjogador",
        password_hash=password_hash("senha123"),
        display_name="Sem Jogador",
        email=None,
        role="admin",
        jogador_id=None,
    )
    db_session.add(usuario)
    db_session.commit()

    resp = client.put(
        "/api/usuarios/me/jogador",
        json={"jogador_id": 99999},
        headers={"X-User-Id": "u-sem-jogador", "X-Role": "admin"},
    )

    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Jogador nao encontrado"
