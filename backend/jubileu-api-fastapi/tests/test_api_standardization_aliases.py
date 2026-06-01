import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.mark.contract
def test_api_alias_routes_exist():
    route_methods = {
        (route.path, method)
        for route in app.routes
        if getattr(route, "methods", None)
        for method in route.methods
    }

    expected_alias_contracts = {
        ("/api/jogadores/", "GET"),
        ("/api/turmas/", "GET"),
        ("/api/dias/", "GET"),
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
def test_legacy_and_api_alias_both_respond(client: TestClient):
    legacy = client.get("/jogadores/")
    alias = client.get("/api/jogadores/")

    assert legacy.status_code == 200, legacy.text
    assert alias.status_code == 200, alias.text
    assert legacy.json() == alias.json()


@pytest.mark.contract
@pytest.mark.uc04
def test_api_alias_day_get_or_create_behavior(client: TestClient):
    data_iso = "2026-03-10"
    legacy = client.get(f"/dias/{data_iso}")
    alias = client.get(f"/api/dias/{data_iso}")

    assert legacy.status_code == 200, legacy.text
    assert alias.status_code == 200, alias.text
    assert legacy.json()["data_iso"] == alias.json()["data_iso"] == data_iso
