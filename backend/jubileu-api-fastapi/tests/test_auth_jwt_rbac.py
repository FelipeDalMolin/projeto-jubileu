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
    dia = DiaModel(data_iso="2026-03-11")
    turma = TurmaModel(nome="Turma Auth")
    jogador_1 = JogadorModel(nome="Jogador Auth 1", status="ativo", ativo=True)
    db_session.add_all([dia, turma, jogador_1])
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

    db_session.add(
        JogadorAulaModel(
            aula_id=aula.id,
            jogador_id=jogador_1.id,
            nome=jogador_1.nome,
            status=StatusPresencaEnum.presente,
        )
    )
    db_session.commit()
    return aula.id


def test_auth_login_and_me_with_bearer(client: TestClient):
    login = client.post("/api/auth/login", json={"username": "coach", "password": "coach123"})
    assert login.status_code == 200, login.text

    token = login.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200, me.text
    assert me.json()["role"] == "treinador"
    assert me.json()["user_id"] == "u-coach"


def test_auth_me_legacy_headers_compat(client: TestClient):
    me = client.get("/api/auth/me", headers={"X-User-Id": "legacy-u1", "X-Role": "user"})
    assert me.status_code == 200, me.text
    assert me.json()["user_id"] == "legacy-u1"
    assert me.json()["role"] == "user"


def test_rbac_preserved_event_start_requires_admin_or_treinador(client: TestClient, db_session):
    evento_id = _criar_evento_jogo_livre(db_session)

    denied = client.post(
        f"/api/eventos/{evento_id}/start",
        headers={"X-User-Id": "u-normal", "X-Role": "user"},
    )
    assert denied.status_code == 403, denied.text

    allowed = client.post(
        f"/api/eventos/{evento_id}/start",
        headers={"X-User-Id": "u-coach", "X-Role": "treinador"},
    )
    assert allowed.status_code == 200, allowed.text
