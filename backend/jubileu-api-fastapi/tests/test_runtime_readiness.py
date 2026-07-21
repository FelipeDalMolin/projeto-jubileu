from unittest.mock import patch

import pytest


@pytest.mark.contract
def test_version_exposes_release_identity(client):
    response = client.get("/api/version")

    assert response.status_code == 200
    assert set(response.json()) == {
        "release_ref",
        "git_sha",
        "backend_image_digest",
        "frontend_image_digest",
        "schema_revision",
    }


@pytest.mark.contract
def test_readiness_requires_expected_alembic_revision(client):
    from app.main import settings

    with patch.object(settings, "ALEMBIC_EXPECTED_REVISION", "revision-that-is-not-installed"):
        response = client.get("/api/ready")

    assert response.status_code == 503
    assert response.json()["reason"] == "schema_revision"


@pytest.mark.contract
def test_readiness_reports_database_failure(client):
    with patch("app.main.engine.connect", side_effect=RuntimeError("database unavailable")):
        response = client.get("/api/ready")

    assert response.status_code == 503
    assert response.json() == {"status": "not_ready", "reason": "database"}
