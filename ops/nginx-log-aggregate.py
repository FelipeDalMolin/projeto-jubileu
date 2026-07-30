#!/usr/bin/env python3
"""Extract privacy-safe status or route values from NGINX JSON/combined logs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from urllib.parse import urlsplit


_COMBINED_REQUEST = re.compile(
    r'"(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+([^"\s]+)\s+HTTP/[0-9.]+"\s+'
    r"([0-9]{3})(?:\s|$)"
)
_SAFE_SEGMENTS = frozenset(
    {
        "api",
        "assets",
        "auth",
        "cancel",
        "checkin",
        "confirmar-presencas",
        "confirmar-sorteio",
        "dashboard",
        "dashboards",
        "dias",
        "end",
        "estado",
        "estado-equipes",
        "estatisticas",
        "eventos",
        "favicon.ico",
        "health",
        "jogadores",
        "lances",
        "lista",
        "login",
        "logout",
        "manifest.json",
        "me",
        "nginx-health",
        "participants",
        "partidas",
        "presentes",
        "preview-sorteio",
        "proxima",
        "ranking",
        "ready",
        "refresh",
        "resumo",
        "robots.txt",
        "rotacao",
        "rsvp",
        "seed",
        "serie-por-dia",
        "start",
        "times",
        "turmas",
        "usuarios",
        "version",
        "visao-geral",
        "workspace",
    }
)
_ROUTE_PARAMETER = re.compile(r"^\{[a-z][a-z0-9_]*\}$")
_DATE_SEGMENT = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
_ID_SEGMENT = re.compile(
    r"^(?:[0-9]+|[0-9A-Fa-f]{16,}|"
    r"[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-"
    r"[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})$"
)


def _json_fields(line: str) -> tuple[object | None, object | None]:
    try:
        payload = json.loads(line)
    except (json.JSONDecodeError, TypeError):
        return None, None
    if not isinstance(payload, dict):
        return None, None
    return payload.get("status"), payload.get("route", payload.get("uri"))


def _combined_fields(line: str) -> tuple[str | None, str | None]:
    match = _COMBINED_REQUEST.search(line)
    if not match:
        return None, None
    return match.group(2), match.group(1)


def _status_value(value: object) -> str | None:
    candidate = str(value)
    return candidate if re.fullmatch(r"[0-9]{3}", candidate) else None


def _safe_route(value: object) -> str | None:
    raw = str(value)
    path = urlsplit(raw).path
    if not path.startswith("/"):
        return None
    if path == "/":
        return path

    safe_parts: list[str] = []
    for segment in path.split("/")[1:]:
        if not segment:
            continue
        if segment in _SAFE_SEGMENTS or _ROUTE_PARAMETER.fullmatch(segment):
            safe_parts.append(segment)
        elif _DATE_SEGMENT.fullmatch(segment):
            safe_parts.append("{date}")
        elif _ID_SEGMENT.fullmatch(segment):
            safe_parts.append("{id}")
        else:
            # Unknown literal path segments can contain names or other identifiers.
            safe_parts.append("{segment}")
    return "/" + "/".join(safe_parts)


def extract(line: str, field: str) -> str | None:
    status, route = _json_fields(line)
    if status is None and route is None:
        status, route = _combined_fields(line)
    if field == "status":
        return _status_value(status) if status is not None else None
    return _safe_route(route) if route is not None else None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("field", choices=("status", "route"))
    args = parser.parse_args()

    for line in sys.stdin:
        value = extract(line, args.field)
        if value is not None:
            print(value)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
