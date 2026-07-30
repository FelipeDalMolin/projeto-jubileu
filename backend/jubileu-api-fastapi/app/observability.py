from __future__ import annotations

import json
import logging
import re
from contextlib import contextmanager
from contextvars import ContextVar, Token
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, Iterator

if TYPE_CHECKING:
    from fastapi import FastAPI
    from sqlalchemy import Engine


REQUEST_LOGGER_NAME = "jubileu.request"
PROBE_ROUTES = frozenset({"/health", "/api/health", "/api/ready"})
_REQUEST_ID_PATTERN = re.compile(
    r"^(?:[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$"
)
_LOG_FIELDS = (
    "event",
    "request_id",
    "trace_id",
    "span_id",
    "method",
    "route",
    "status_code",
    "duration_ms",
    "error_class",
    "service_version",
    "deployment_environment",
)
_PROBE_REQUEST: ContextVar[bool] = ContextVar("jubileu_probe_request", default=False)


class JsonFormatter(logging.Formatter):
    """Emit only the explicitly allowlisted technical fields."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            "level": record.levelname,
            "logger": record.name,
        }
        for field in _LOG_FIELDS:
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value
        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def configure_json_logging() -> logging.Logger:
    logger = logging.getLogger(REQUEST_LOGGER_NAME)
    if not any(getattr(handler, "_jubileu_json", False) for handler in logger.handlers):
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        handler._jubileu_json = True  # type: ignore[attr-defined]
        logger.handlers.clear()
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False

    # The structured middleware below is the HTTP access log. Keeping Uvicorn's
    # duplicate text access line would restore most of the probe noise.
    logging.getLogger("uvicorn.access").disabled = True
    return logger


def accepted_request_id(value: str | None) -> str | None:
    if value and _REQUEST_ID_PATTERN.fullmatch(value):
        return value
    return None


def current_trace_ids() -> tuple[str | None, str | None]:
    try:
        from opentelemetry import trace
    except ModuleNotFoundError:
        return None, None

    context = trace.get_current_span().get_span_context()
    if not context.is_valid:
        return None, None
    return f"{context.trace_id:032x}", f"{context.span_id:016x}"


def normalized_route(scope: dict[str, Any]) -> str:
    route = scope.get("route")
    path = getattr(route, "path", None)
    return path if isinstance(path, str) else "<unmatched>"


def error_class(status_code: int, exception_name: str | None) -> str | None:
    if exception_name:
        return exception_name
    if status_code >= 500:
        return "http_server_error"
    if status_code >= 400:
        return "http_client_error"
    return None


def should_log_request(route: str, status_code: int) -> bool:
    return route not in PROBE_ROUTES or status_code >= 500


def set_probe_context(path: str) -> Token[bool]:
    return _PROBE_REQUEST.set(path in PROBE_ROUTES)


def reset_probe_context(token: Token[bool]) -> None:
    _PROBE_REQUEST.reset(token)


@contextmanager
def suppress_automatic_instrumentation() -> Iterator[None]:
    """Suppress DB spans for probes while preserving the dependency-free path."""

    try:
        from opentelemetry.instrumentation.utils import suppress_instrumentation
    except ModuleNotFoundError:
        yield
        return
    with suppress_instrumentation():
        yield


def configure_opentelemetry(
    app: FastAPI,
    *,
    engine: Engine,
    settings: Any,
) -> bool:
    """Enable the on-demand OTLP/HTTP pilot; disabled is a dependency-free path."""

    if settings.OTEL_SDK_DISABLED:
        return False

    try:
        from opentelemetry import propagate
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.instrumentation.psycopg import PsycopgInstrumentor
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.sdk.trace.sampling import (
            Decision,
            ParentBased,
            Sampler,
            SamplingResult,
            TraceIdRatioBased,
        )
        from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "OTel foi habilitado, mas as dependencias travadas de observabilidade nao estao instaladas"
        ) from exc

    # Explicitly keep W3C Trace Context as the only propagator for this pilot.
    propagate.set_global_textmap(TraceContextTextMapPropagator())

    resource = Resource.create(
        {
            "service.namespace": settings.OTEL_SERVICE_NAMESPACE,
            "service.name": settings.OTEL_SERVICE_NAME,
            "service.version": settings.RELEASE_REF or settings.APP_VERSION,
            "deployment.environment.name": settings.APP_ENV,
            "host.name": settings.OTEL_HOST_NAME,
        }
    )
    delegate_sampler = ParentBased(TraceIdRatioBased(settings.OTEL_TRACES_SAMPLER_ARG))

    class ProbeAwareSampler(Sampler):
        def should_sample(self, *args: Any, **kwargs: Any) -> SamplingResult:
            if _PROBE_REQUEST.get():
                return SamplingResult(Decision.DROP)
            return delegate_sampler.should_sample(*args, **kwargs)

        def get_description(self) -> str:
            return f"ProbeAware{{{delegate_sampler.get_description()}}}"

    provider = TracerProvider(
        resource=resource,
        sampler=ProbeAwareSampler(),
    )
    endpoint = settings.OTEL_EXPORTER_OTLP_ENDPOINT.rstrip("/") + "/v1/traces"
    provider.add_span_processor(
        BatchSpanProcessor(
            OTLPSpanExporter(
                endpoint=endpoint,
                timeout=settings.OTEL_EXPORTER_OTLP_TIMEOUT_SECONDS,
            ),
            max_queue_size=settings.OTEL_BSP_MAX_QUEUE_SIZE,
            max_export_batch_size=settings.OTEL_BSP_MAX_EXPORT_BATCH_SIZE,
        )
    )

    excluded_urls = r"^https?://[^/]+/(?:health|api/health|api/ready)$|^/(?:health|api/health|api/ready)$"
    FastAPIInstrumentor.instrument_app(
        app,
        tracer_provider=provider,
        excluded_urls=excluded_urls,
        # Internal ASGI send/receive spans add little diagnostic value here,
        # increase cardinality/CPU, and obscure the HTTP -> DB path.
        exclude_spans=["send", "receive"],
    )
    SQLAlchemyInstrumentor().instrument(engine=engine, tracer_provider=provider)
    PsycopgInstrumentor().instrument(tracer_provider=provider)
    app.add_event_handler("shutdown", provider.shutdown)
    return True
