from __future__ import annotations

from collections import Counter

import pytest
from fastapi.routing import APIRoute

from app.main import app
from app.modules.auth.deps import get_current_user, get_operator_user
from app.modules.auth.policy import (
    AUTHENTICATED_READ_ROUTES,
    OPERATOR_ROUTES,
    PUBLIC_ROUTES,
    ROUTE_POLICY,
    SELF_SERVICE_ROUTES,
)

IGNORED_DEVELOPMENT_PATHS = {
    "/openapi.json",
    "/docs",
    "/docs/oauth2-redirect",
    "/redoc",
}


def _application_route_keys() -> list[tuple[str, str]]:
    return [
        (method, route.path)
        for route in app.routes
        if isinstance(route, APIRoute) and route.path not in IGNORED_DEVELOPMENT_PATHS
        for method in route.methods
        if method not in {"HEAD", "OPTIONS"}
    ]


def _dependency_calls(route: APIRoute) -> set[object]:
    calls: set[object] = set()

    def visit(dependant) -> None:
        if dependant.call is not None:
            calls.add(dependant.call)
        for child in dependant.dependencies:
            visit(child)

    visit(route.dependant)
    return calls


def _concrete_path(path: str) -> str:
    if path == "/api/dashboards/estatisticas/visao-geral":
        return f"{path}?periodo=999"
    values = {
        "{data_iso}": "2026-01-01",
        "{evento_id}": "1",
        "{jogador_id}": "1",
        "{jogador_evento_id}": "1",
        "{partida_id}": "1",
        "{time_id}": "1",
        "{turma_id}": "1",
    }
    for placeholder, value in values.items():
        path = path.replace(placeholder, value)
    return path


@pytest.mark.contract
def test_authorization_registry_is_complete_unique_and_disjoint():
    route_keys = _application_route_keys()
    duplicates = {key for key, count in Counter(route_keys).items() if count > 1}

    assert not duplicates
    assert set(route_keys) == set(ROUTE_POLICY)
    assert PUBLIC_ROUTES.isdisjoint(AUTHENTICATED_READ_ROUTES)
    assert PUBLIC_ROUTES.isdisjoint(SELF_SERVICE_ROUTES)
    assert PUBLIC_ROUTES.isdisjoint(OPERATOR_ROUTES)
    assert AUTHENTICATED_READ_ROUTES.isdisjoint(SELF_SERVICE_ROUTES)
    assert AUTHENTICATED_READ_ROUTES.isdisjoint(OPERATOR_ROUTES)
    assert SELF_SERVICE_ROUTES.isdisjoint(OPERATOR_ROUTES)


@pytest.mark.contract
def test_route_dependencies_match_authorization_registry():
    routes = {
        (method, route.path): route
        for route in app.routes
        if isinstance(route, APIRoute) and route.path not in IGNORED_DEVELOPMENT_PATHS
        for method in route.methods
        if method not in {"HEAD", "OPTIONS"}
    }

    for key in AUTHENTICATED_READ_ROUTES | SELF_SERVICE_ROUTES | OPERATOR_ROUTES:
        assert get_current_user in _dependency_calls(routes[key]), key
    for key in OPERATOR_ROUTES:
        assert get_operator_user in _dependency_calls(routes[key]), key
    for key in PUBLIC_ROUTES:
        assert get_current_user not in _dependency_calls(routes[key]), key
        assert get_operator_user not in _dependency_calls(routes[key]), key


@pytest.mark.contract
@pytest.mark.parametrize("method,path", sorted(AUTHENTICATED_READ_ROUTES | SELF_SERVICE_ROUTES | OPERATOR_ROUTES))
def test_every_protected_route_rejects_anonymous_requests(anonymous_client, method: str, path: str):
    response = anonymous_client.request(method, _concrete_path(path), json={})
    assert response.status_code == 401, (method, path, response.status_code, response.text)


@pytest.mark.contract
@pytest.mark.parametrize("method,path", sorted(OPERATOR_ROUTES))
def test_every_operator_route_rejects_user_role(client, method: str, path: str):
    response = client.request(
        method,
        _concrete_path(path),
        headers={"X-User-Id": "policy-user", "X-Role": "user"},
        json={},
    )
    assert response.status_code == 403, (method, path, response.status_code, response.text)


@pytest.mark.contract
@pytest.mark.parametrize("method,path", sorted(OPERATOR_ROUTES))
def test_every_operator_route_accepts_auxiliar_at_authorization_layer(client, method: str, path: str):
    response = client.request(
        method,
        _concrete_path(path),
        headers={"X-User-Id": "policy-aux", "X-Role": "auxiliar"},
        json={},
    )
    assert response.status_code not in {401, 403}, (method, path, response.status_code, response.text)


@pytest.mark.contract
@pytest.mark.parametrize("method,path", sorted(AUTHENTICATED_READ_ROUTES | SELF_SERVICE_ROUTES))
def test_user_role_passes_authenticated_and_self_authorization_layer(client, method: str, path: str):
    response = client.request(
        method,
        _concrete_path(path),
        headers={"X-User-Id": "policy-user", "X-Role": "user"},
        json={},
    )
    assert response.status_code not in {401, 403}, (method, path, response.status_code, response.text)


@pytest.mark.contract
def test_public_allowlist_is_anonymous(anonymous_client):
    assert anonymous_client.get("/health").status_code == 200
    assert anonymous_client.get("/api/health").status_code == 200
    assert anonymous_client.post("/api/auth/login", json={}).status_code == 422
    assert anonymous_client.post("/api/auth/refresh").status_code == 401


@pytest.mark.contract
def test_noncanonical_paths_do_not_redirect_before_authentication(anonymous_client):
    for path in ("/", "/dias", "/jogadores", "/turmas", "/api/dias/", "/api/jogadores/", "/api/turmas/"):
        response = anonymous_client.get(path, follow_redirects=False)
        assert response.status_code == 404, (path, response.status_code, response.headers.get("location"))
