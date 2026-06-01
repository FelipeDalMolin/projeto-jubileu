import pytest
from fastapi.testclient import TestClient

from app.main import app, create_app


@pytest.mark.smoke
def test_smoke_root_and_health(client: TestClient):
    root_resp = client.get("/")
    assert root_resp.status_code == 200, root_resp.text
    assert root_resp.json()["status"] == "ok"
    assert root_resp.headers["X-Request-ID"]

    health_resp = client.get("/health")
    assert health_resp.status_code == 200, health_resp.text
    assert health_resp.json() == {"status": "ok"}
    assert health_resp.headers["X-Request-ID"]

    api_health_resp = client.get("/api/health")
    assert api_health_resp.status_code == 200, api_health_resp.text
    assert api_health_resp.json() == {"status": "ok"}
    assert api_health_resp.headers["X-Request-ID"]


@pytest.mark.smoke
@pytest.mark.contract
def test_request_id_is_generated_and_preserved(client: TestClient):
    generated_resp = client.get("/health")
    assert generated_resp.status_code == 200, generated_resp.text
    assert generated_resp.headers["X-Request-ID"]

    request_id = "jubileu-test-request-id"
    preserved_resp = client.get("/api/health", headers={"X-Request-ID": request_id})
    assert preserved_resp.status_code == 200, preserved_resp.text
    assert preserved_resp.headers["X-Request-ID"] == request_id


@pytest.mark.smoke
@pytest.mark.contract
def test_smoke_critical_route_contracts_exist():
    route_methods = {
        (route.path, method)
        for route in app.routes
        if getattr(route, "methods", None)
        for method in route.methods
    }

    expected_contracts = {
        ("/", "GET"),
        ("/health", "GET"),
        ("/api/health", "GET"),
        ("/api/jogadores/", "GET"),
        ("/api/turmas/", "GET"),
        ("/api/dias/", "GET"),
        ("/api/dias/{data_iso}", "GET"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/workspace", "GET"),
        ("/jogadores/", "GET"),
        ("/turmas/", "GET"),
        ("/dias/", "GET"),
        ("/dias/{data_iso}", "GET"),
        ("/dias/{data_iso}/eventos/{evento_id}/workspace", "GET"),
        ("/api/eventos/{evento_id}/rsvp", "POST"),
        ("/api/eventos/{evento_id}/checkin", "POST"),
        ("/api/eventos/{evento_id}/partidas/seed", "POST"),
        ("/api/partidas/{partida_id}/lances", "POST"),
    }

    missing = expected_contracts - route_methods
    assert not missing, f"Missing critical route contracts: {sorted(missing)}"

    # Keep the /api gateway assumption explicit in stabilization checks.
    assert any(path.startswith("/api/") for path, _ in route_methods)
    assert not any(path.startswith("/api/api") for path, _ in route_methods)


@pytest.mark.smoke
def test_create_app_preserves_startup_contract():
    new_app = create_app()
    assert new_app.title == app.title == "Jubileu API"
    assert new_app.version == app.version == "0.1.0"
