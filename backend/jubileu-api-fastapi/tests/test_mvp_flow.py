import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base
from app.deps import get_db


TEST_DB_URL = os.getenv("DATABASE_URL_TEST")


@pytest.fixture(scope="module")
def client():
    if not TEST_DB_URL:
        pytest.skip("DATABASE_URL_TEST não definido; pulando testes de integração.")

    engine = create_engine(TEST_DB_URL, future=True)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # recria schema do zero para o teste
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_fluxo_mvp(client: TestClient):
    # cria turma
    resp = client.post("/turmas", json={"nome": "Turma Teste"})
    assert resp.status_code == 201, resp.text
    turma = resp.json()
    turma_id = turma["id"]

    # cria jogador
    resp = client.post(
        "/jogadores",
        json={"nome": "João", "apelido": "J", "status": "ativo"},
    )
    assert resp.status_code == 201, resp.text
    jogador = resp.json()
    jogador_id = jogador["id"]

    # cria (ou obtém) dia
    data_iso = "2025-12-31"
    resp = client.get(f"/dias/{data_iso}")
    assert resp.status_code == 200, resp.text
    dia = resp.json()
    assert dia["data_iso"] == data_iso

    # cria aula no dia usando turma_id int
    resp = client.post(
        f"/dias/{data_iso}/aulas",
        json={
            "turma_id": turma_id,
            "turma_nome": "ignorado",
            "numero_aula_na_turma": 1,
            "tipo": "AULA",
            "horario_inicio": "19:00",
            "horario_fim": "20:00",
            "status": "PLANEJADA",
        },
    )
    assert resp.status_code == 201, resp.text
    aula = resp.json()
    aula_id = aula["id"]
    assert aula["turma_id"] == turma_id
    assert aula["turma_nome"] == "Turma Teste"

    # salva estado de equipes
    payload_estado = {
        "jogadores": [
            {
                "jogadorId": jogador_id,
                "nome": "João",
                "status": "presente",
                "atributos": {
                    "gols": 0,
                    "assistencias": 0,
                    "chiliques": 0,
                    "faltas": 0,
                },
                "timeId": "1",
            }
        ],
        "times": [
            {
                "id": "1",
                "nome": "Time 1",
                "jogadoresIds": [jogador_id],
                "caracteristica": None,
                "corCamisa": None,
            }
        ],
    }
    resp = client.put(
        f"/dias/{data_iso}/aulas/{aula_id}/estado-equipes",
        json=payload_estado,
    )
    assert resp.status_code == 200, resp.text

    # lê estado-equipes e valida estrutura
    resp = client.get(f"/dias/{data_iso}/aulas/{aula_id}/estado-equipes")
    assert resp.status_code == 200, resp.text
    estado = resp.json()
    assert estado["aula_id"] == aula_id
    assert len(estado["jogadores"]) == 1
    assert len(estado["times"]) == 1
    assert estado["times"][0]["jogadoresIds"] == [jogador_id]
