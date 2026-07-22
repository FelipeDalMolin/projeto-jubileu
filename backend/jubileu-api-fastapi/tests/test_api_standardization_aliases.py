import ast
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.models.dia_evento import Dia, Evento, StatusEventoEnum, TipoEventoEnum

from app.main import app


@pytest.mark.contract
def test_eventos_service_is_import_only_facade():
    service_path = Path(__file__).parents[1] / "app" / "modules" / "eventos" / "service.py"
    tree = ast.parse(service_path.read_text(encoding="utf-8"))

    executable_definitions = [
        node
        for node in tree.body
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))
    ]
    assert not executable_definitions


@pytest.mark.contract
def test_equipes_e_rotacao_estao_em_capacidades_isoladas_e_sem_rollback_global():
    modules_dir = Path(__file__).parents[1] / "app" / "modules" / "eventos"
    teams_source = (modules_dir / "teams.py").read_text(encoding="utf-8")
    rotation_source = (modules_dir / "rotation.py").read_text(encoding="utf-8")
    legacy_tree = ast.parse((modules_dir / "_legacy.py").read_text(encoding="utf-8"))

    legacy_functions = {
        node.name
        for node in legacy_tree.body
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
    }
    assert legacy_functions == {"lance_out", "create_lance_flow", "list_lances_flow"}

    assert "def criar_time_flow(" in teams_source
    assert "def rebuild_estado_equipes(" in teams_source
    assert "def criar_proxima_partida_flow(" in rotation_source
    assert "def preview_rotacao_sorteio_flow(" in rotation_source
    assert "db.rollback(" not in teams_source
    assert "db.rollback(" not in rotation_source
    assert "with db.begin_nested():" in teams_source
    assert rotation_source.count("with db.begin_nested():") >= 2

    rotation_tree = ast.parse(rotation_source)
    locked_flows = {
        "seed_primeira_partida_flow",
        "get_rotacao_estado_flow",
        "criar_proxima_partida_flow",
        "update_rotacao_estado_flow",
        "preview_rotacao_sorteio_flow",
        "confirm_rotacao_sorteio_flow",
    }
    for node in rotation_tree.body:
        if not isinstance(node, ast.FunctionDef) or node.name not in locked_flows:
            continue
        flow_source = ast.get_source_segment(rotation_source, node) or ""
        assert flow_source.index("_lock_evento_for_command(") < flow_source.index(
            "_get_or_init_rotacao_estado("
        ), node.name


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
        ("/api/eventos/{evento_id}/start", "POST"),
        ("/api/eventos/{evento_id}/end", "POST"),
        ("/api/eventos/{evento_id}/cancel", "POST"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start", "POST"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end", "POST"),
        ("/api/eventos/{evento_id}/partidas/proxima", "POST"),
    }

    missing = expected_alias_contracts - route_methods
    assert not missing, f"Missing /api standardized contracts: {sorted(missing)}"

    removed_contracts = {
        ("/api/dias/{data_iso}/eventos/{evento_id}/start", "PUT"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/start", "POST"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/finish", "PUT"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/finish", "POST"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start", "PUT"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end", "PUT"),
        ("/api/dias/{data_iso}/eventos/{evento_id}/partidas/proxima", "POST"),
    }
    assert route_methods.isdisjoint(removed_contracts)


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
