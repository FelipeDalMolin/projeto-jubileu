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


def _criar_aula_com_jogadores(
    db_session,
    *,
    data_iso: str,
    jogadores_por_time: list[int],
    jogadores_sem_time: int = 0,
) -> AulaModel:
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

    jogador_idx = 1
    for idx, quantidade in enumerate(jogadores_por_time, start=1):
        time = TimeAulaModel(aula_id=aula.id, nome=f"Time {idx}")
        db_session.add(time)
        db_session.flush()

        for _ in range(quantidade):
            jogador = JogadorAulaModel(
                aula_id=aula.id,
                jogador_id=None,
                nome=f"Jogador {jogador_idx}",
                status=StatusPresencaEnum.presente,
                time_id=time.id,
            )
            db_session.add(jogador)
            jogador_idx += 1

    for _ in range(jogadores_sem_time):
        jogador = JogadorAulaModel(
            aula_id=aula.id,
            jogador_id=None,
            nome=f"Jogador {jogador_idx}",
            status=StatusPresencaEnum.presente,
            time_id=None,
        )
        db_session.add(jogador)
        jogador_idx += 1

    db_session.commit()

    return aula


def test_workspace_returns_structure(client: TestClient, db_session):
    data_iso = "2026-01-20"
    aula = _criar_aula_com_jogadores(
        db_session,
        data_iso=data_iso,
        jogadores_por_time=[1],
    )

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text

    payload = resp.json()
    for key in ["meta", "header", "kpis", "equipes", "partidas", "eventos", "warnings"]:
        assert key in payload
    assert isinstance(payload["meta"]["version"], int)


def test_workspace_since_version_returns_204(client: TestClient, db_session):
    data_iso = "2026-01-21"
    aula = _criar_aula_com_jogadores(
        db_session,
        data_iso=data_iso,
        jogadores_por_time=[1],
    )

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text
    version = resp.json()["meta"]["version"]

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace?since_version={version}")
    assert resp.status_code == 204, resp.text


def test_workspace_warning_player_without_team(client: TestClient, db_session):
    data_iso = "2026-01-22"
    aula = _criar_aula_com_jogadores(
        db_session,
        data_iso=data_iso,
        jogadores_por_time=[1],
        jogadores_sem_time=1,
    )

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text

    codes = {w["code"] for w in resp.json().get("warnings", [])}
    assert "PLAYER_WITHOUT_TEAM" in codes


def test_workspace_warning_unbalanced_teams(client: TestClient, db_session):
    data_iso = "2026-01-23"
    aula = _criar_aula_com_jogadores(
        db_session,
        data_iso=data_iso,
        jogadores_por_time=[3, 1],
    )

    resp = client.get(f"/dias/{data_iso}/aulas/{aula.id}/workspace")
    assert resp.status_code == 200, resp.text

    codes = {w["code"] for w in resp.json().get("warnings", [])}
    assert "UNBALANCED_TEAMS" in codes
