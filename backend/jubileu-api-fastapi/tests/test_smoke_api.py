from fastapi.testclient import TestClient

from app.main import app, create_app


def test_smoke_root_and_health(client: TestClient):
    root_resp = client.get("/")
    assert root_resp.status_code == 200, root_resp.text
    assert root_resp.json()["status"] == "ok"

    health_resp = client.get("/health")
    assert health_resp.status_code == 200, health_resp.text
    assert health_resp.json() == {"status": "ok"}


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


def test_create_app_preserves_startup_contract():
    new_app = create_app()
    assert new_app.title == app.title == "Jubileu API"
    assert new_app.version == app.version == "0.1.0"
