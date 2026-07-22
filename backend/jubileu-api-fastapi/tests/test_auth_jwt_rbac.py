import pytest
from fastapi.testclient import TestClient

from app.models.dia_evento import (
    Evento as EventoModel,
    Dia as DiaModel,
    JogadorEvento as JogadorEventoModel,
    StatusEventoEnum,
    StatusPresencaEnum,
    TipoEventoEnum,
)
from app.models.jogador_turma import Jogador as JogadorModel, Turma as TurmaModel
from app.modules.auth.service import seed_default_users


def _criar_evento_jogo_livre(db_session):
    dia = DiaModel(data_iso="2026-03-11")
    turma = TurmaModel(nome="Turma Auth")
    jogador_1 = JogadorModel(nome="Jogador Auth 1", status="ativo", ativo=True)
    db_session.add_all([dia, turma, jogador_1])
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

    db_session.add(
        JogadorEventoModel(
            evento_id=evento.id,
            jogador_id=jogador_1.id,
            nome=jogador_1.nome,
            status=StatusPresencaEnum.presente,
        )
    )
    db_session.commit()
    return evento.id


@pytest.mark.uc01
def test_auth_login_and_me_with_cookie(client: TestClient, db_session):
    seed_default_users(db_session)
    login = client.post("/api/auth/login", json={"username": "coach", "password": "coach123"})
    assert login.status_code == 200, login.text
    assert "access_token" not in login.json()
    assert client.cookies.get("jubileu_access")
    me = client.get("/api/auth/me")
    assert me.status_code == 200, me.text
    assert me.json()["role"] == "treinador"
    assert me.json()["user_id"] == "u-coach"


@pytest.mark.uc01
def test_auth_me_legacy_headers_compat(client: TestClient):
    me = client.get("/api/auth/me", headers={"X-User-Id": "legacy-u1", "X-Role": "user"})
    assert me.status_code == 200, me.text
    assert me.json()["user_id"] == "legacy-u1"
    assert me.json()["role"] == "user"


@pytest.mark.uc01
def test_auth_legacy_uses_persisted_player_link(client: TestClient, db_session):
    jogador = JogadorModel(nome="Jogador Legacy", status="ativo", ativo=True)
    db_session.add(jogador)
    db_session.flush()
    from app.models.usuario import Usuario
    from app.modules.auth.service import password_hash

    db_session.add(Usuario(
        user_id="legacy-linked",
        username="legacy-linked",
        password_hash=password_hash("unused"),
        display_name="Legacy Linked",
        role="user",
        jogador_id=jogador.id,
    ))
    db_session.commit()
    me = client.get("/api/auth/me", headers={"X-User-Id": "legacy-linked", "X-Role": "user"})
    assert me.status_code == 200
    assert me.json()["jogador_id"] == jogador.id


@pytest.mark.uc01
@pytest.mark.uc05
def test_rbac_event_start_requires_operator_role(client: TestClient, db_session):
    evento_id = _criar_evento_jogo_livre(db_session)

    denied = client.post(
        f"/api/eventos/{evento_id}/start",
        headers={"X-User-Id": "u-normal", "X-Role": "user"},
    )
    assert denied.status_code == 403, denied.text

    allowed = client.post(
        f"/api/eventos/{evento_id}/start",
        headers={"X-User-Id": "u-aux", "X-Role": "auxiliar"},
    )
    assert allowed.status_code == 200, allowed.text
