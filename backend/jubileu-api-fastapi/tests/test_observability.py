import json
import logging
from unittest.mock import patch

import pytest

from app.core.config import Settings
from app.main import logger
from app.observability import JsonFormatter, accepted_request_id, should_log_request


@pytest.mark.contract
def test_json_formatter_emits_only_allowlisted_technical_fields():
    record = logging.LogRecord(
        "jubileu.request",
        logging.INFO,
        __file__,
        1,
        "never serialized directly",
        (),
        None,
    )
    record.event = "request_completed"
    record.request_id = "0d170e75-9e39-48ad-a76a-ab5251a9d4d3"
    record.route = "/api/eventos/{evento_id}"
    record.status_code = 200
    record.query_string = "jogador=nao-pode-aparecer"
    record.authorization = "Bearer nao-pode-aparecer"
    record.body = {"nome": "nao-pode-aparecer"}

    payload = json.loads(JsonFormatter().format(record))

    assert payload["event"] == "request_completed"
    assert payload["route"] == "/api/eventos/{evento_id}"
    assert "query_string" not in payload
    assert "authorization" not in payload
    assert "body" not in payload
    assert "nao-pode-aparecer" not in json.dumps(payload)


@pytest.mark.contract
def test_request_log_uses_normalized_route_and_omits_query_and_headers(client):
    request_id = "0D170E75-9E39-48AD-A76A-AB5251A9D4D3"
    with patch.object(logger, "info") as logged:
        response = client.get(
            "/api/version?nome=nao-pode-aparecer",
            headers={
                "X-Request-ID": request_id,
                "X-Debug-Name": "nao-pode-aparecer",
            },
        )

    assert response.status_code == 200
    extra = logged.call_args.kwargs["extra"]
    assert extra["route"] == "/api/version"
    assert response.headers["X-Request-ID"] == request_id
    assert extra["request_id"] == request_id
    assert extra["status_code"] == 200
    assert extra["error_class"] is None
    assert "nao-pode-aparecer" not in json.dumps(extra)


@pytest.mark.contract
def test_accepted_request_id_preserves_valid_client_representation():
    request_id = "ABCDEF0123456789abcdef0123456789"

    assert accepted_request_id(request_id) == request_id
    assert accepted_request_id("nome-de-jogador") is None


@pytest.mark.contract
@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("OTEL_EXPORTER_OTLP_ENDPOINT", "ftp://collector:4318"),
        ("OTEL_EXPORTER_OTLP_ENDPOINT", "http://user:secret@collector:4318"),
        ("OTEL_EXPORTER_OTLP_ENDPOINT", "http://collector:4318/v1/traces"),
        ("OTEL_EXPORTER_OTLP_ENDPOINT", "http://collector:4318?nome=nao-pode-aparecer"),
        ("OTEL_TRACES_SAMPLER_ARG", 1.1),
        ("OTEL_BSP_MAX_EXPORT_BATCH_SIZE", 513),
    ],
)
def test_invalid_otel_configuration_fails_closed(field, value):
    with pytest.raises(ValueError):
        Settings(
            _env_file=None,
            APP_ENV="test",
            OTEL_BSP_MAX_QUEUE_SIZE=512,
            **{field: value},
        )


@pytest.mark.contract
def test_successful_probes_are_not_stored_in_request_log(client):
    with patch.object(logger, "info") as logged:
        response = client.get("/health")

    assert response.status_code == 200
    logged.assert_not_called()
    assert should_log_request("/health", 200) is False
    assert should_log_request("/api/ready", 503) is True


@pytest.mark.contract
def test_unmatched_path_is_not_logged_verbatim(client):
    with patch.object(logger, "info") as logged:
        response = client.get("/pessoa/nao-pode-aparecer")

    assert response.status_code == 404
    extra = logged.call_args.kwargs["extra"]
    assert extra["route"] == "<unmatched>"
    assert extra["error_class"] == "http_client_error"
    assert "nao-pode-aparecer" not in json.dumps(extra)


@pytest.mark.contract
def test_unhandled_request_exception_is_sanitized_without_message_or_traceback(client):
    sentinel = "SELECT * FROM usuarios WHERE nome='NAO_PODE_APARECER'"
    route = "/__synthetic_observability_failure"

    def fail_safely():
        raise RuntimeError(sentinel)

    client.app.add_api_route(route, fail_safely, methods=["GET"])

    with patch.object(logger, "info") as logged:
        response = client.get(route, headers={"X-Request-ID": "abcdef0123456789abcdef0123456789"})

    assert response.status_code == 500
    assert response.json() == {"detail": "Internal Server Error"}
    assert response.headers["X-Request-ID"] == "abcdef0123456789abcdef0123456789"

    extra = logged.call_args.kwargs["extra"]
    assert extra["route"] == route
    assert extra["status_code"] == 500
    assert extra["error_class"] == "RuntimeError"
    serialized = json.dumps(extra)
    assert sentinel not in serialized
    assert "SELECT * FROM" not in serialized
    assert "traceback" not in serialized.lower()
