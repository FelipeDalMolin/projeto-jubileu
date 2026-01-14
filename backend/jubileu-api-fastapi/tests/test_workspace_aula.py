from fastapi.testclient import TestClient

from app.models.dia_aula import (
    Aula as AulaModel,
    Dia as DiaModel,
    JogadorAula as JogadorAulaModel,
    StatusAulaEnum,
    StatusPresencaEnum,
    TipoEventoAulaEnum,
    TimeAula as TimeAulaModel,
)
from app.models.jogador_turma import Turma as TurmaModel


def _criar_aula_basica(db_session, data_iso: str = "2026-01-20") -> AulaModel:
    dia = DiaModel(data_iso=data_iso)
    turma = TurmaModel(nome="Turma Teste")
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
        status=StatusAulaEnum.PLANEJADA,
    )
    db_session.add(aula)
    db_session.flush()

    time = TimeAulaModel(aula_id=aula.id, nome="Time 1")
    db_session.add(time)
    db_session.flush()

    jogador = JogadorAulaModel(
        aula_id=aula.id,
        jogador_id=None,
        nome="Jogador 1",
        status=StatusPresencaEnum.presente,
        time_id=time.id,
    )
    db_session.add(jogador)
    db_session.commit()

    return aula


def test_workspace_returns_structure(client: TestClient, db_session):
    data_iso = "2026-01-20"
    aula = _criar_aula_basica(db_session, data_iso=data_iso)

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text

    payload = resp.json()
    for key in ["meta", "header", "kpis", "equipes", "partidas", "eventos", "warnings"]:
        assert key in payload
    assert isinstance(payload["meta"]["version"], int)


def test_workspace_since_version_returns_204(client: TestClient, db_session):
    data_iso = "2026-01-21"
    aula = _criar_aula_basica(db_session, data_iso=data_iso)

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text
    version = resp.json()["meta"]["version"]

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace?since_version={version}")
    assert resp.status_code == 204, resp.text
