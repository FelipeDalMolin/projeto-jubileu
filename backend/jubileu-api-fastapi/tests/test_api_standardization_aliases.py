import pytest
from fastapi.testclient import TestClient

from app.models.dia_evento import Dia, Evento, StatusEventoEnum, TipoEventoEnum

from app.main import app


@pytest.mark.contract
def test_canonical_api_routes_exist():
    route_methods = {
        (route.path, method)
        for route in app.routes
        if getattr(route, "methods", None)
        for method in route.methods
    }

    expected_alias_contracts = {
        ("/api/jogadores", "GET"),
        ("/api/turmas", "GET"),
        ("/api/dias", "GET"),
        ("/api/dias/{data_iso}", "GET"),
        ("/api/dashboards/jogadores/resumo", "GET"),
        ("/api/dashboards/partidas/resumo", "GET"),
        ("/api/dashboards/estatisticas/visao-geral", "GET"),
        ("/api/eventos/{evento_id}/rsvp", "POST"),
        ("/api/eventos/{evento_id}/rotacao/estado", "GET"),
        ("/api/eventos/{evento_id}/rotacao/estado", "PATCH"),
        ("/api/eventos/{evento_id}/rotacao/preview-sorteio", "POST"),
        ("/api/eventos/{evento_id}/rotacao/confirmar-sorteio", "POST"),
        ("/api/partidas/{partida_id}/lances", "POST"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start", "PUT"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end", "PUT"),
    }

    missing = expected_alias_contracts - route_methods
    assert not missing, f"Missing /api standardized contracts: {sorted(missing)}"


@pytest.mark.contract
@pytest.mark.uc02
def test_legacy_and_trailing_slash_aliases_are_not_served(client: TestClient):
    legacy = client.get("/jogadores/")
    trailing_slash = client.get("/api/jogadores/")
    canonical = client.get("/api/jogadores")

    assert legacy.status_code == 404, legacy.text
    assert trailing_slash.status_code == 404, trailing_slash.text
    assert canonical.status_code == 200, canonical.text


@pytest.mark.contract
@pytest.mark.uc04
def test_canonical_day_get_or_create_behavior(client: TestClient):
    data_iso = "2026-03-10"
    legacy = client.get(f"/dias/{data_iso}")
    canonical = client.get(f"/api/dias/{data_iso}")

    assert legacy.status_code == 404, legacy.text
    assert canonical.status_code == 200, canonical.text
    assert canonical.json()["data_iso"] == data_iso


@pytest.mark.contract
@pytest.mark.uc04
def test_api_days_list_includes_events_for_calendar(client: TestClient, db_session):
    dia = Dia(data_iso="2026-07-04")
    db_session.add(dia)
    db_session.flush()
    evento = Evento(
        dia_id=dia.id,
        tipo=TipoEventoEnum.JOGO_LIVRE,
        horario_inicio="19:00",
        horario_fim="20:00",
        status=StatusEventoEnum.PLANEJADO,
    )
    db_session.add(evento)
    db_session.commit()

    resp = client.get("/api/dias")

    assert resp.status_code == 200, resp.text
    body = resp.json()
    dia_payload = next(item for item in body if item["data_iso"] == "2026-07-04")
    assert dia_payload["eventos"][0]["id"] == evento.id
    assert dia_payload["eventos"][0]["tipo"] == "JOGO_LIVRE"
