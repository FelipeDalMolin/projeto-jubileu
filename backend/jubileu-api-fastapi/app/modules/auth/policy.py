"""Canonical authorization policy for the public HTTP surface.

Every application route must appear exactly once in this registry. Development
documentation routes are intentionally excluded because they are disabled in
production and are not product contracts.
"""

from __future__ import annotations

from enum import StrEnum
from typing import Final

RouteKey = tuple[str, str]


class AccessPolicy(StrEnum):
    PUBLIC = "public"
    AUTHENTICATED_READ = "authenticated_read"
    SELF_SERVICE = "self_service"
    OPERATOR = "operator"


PUBLIC_ROUTES: Final[frozenset[RouteKey]] = frozenset(
    {
        ("GET", "/health"),
        ("GET", "/api/health"),
        ("GET", "/api/ready"),
        ("POST", "/api/auth/login"),
        ("POST", "/api/auth/refresh"),
    }
)

AUTHENTICATED_READ_ROUTES: Final[frozenset[RouteKey]] = frozenset(
    {
        ("GET", "/api/version"),
        ("GET", "/api/auth/me"),
        ("GET", "/api/usuarios/me"),
        ("GET", "/api/jogadores"),
        ("GET", "/api/jogadores/{jogador_id}"),
        ("GET", "/api/turmas"),
        ("GET", "/api/turmas/{turma_id}"),
        ("GET", "/api/turmas/{turma_id}/jogadores"),
        ("GET", "/api/dias"),
        ("GET", "/api/dias/{data_iso}"),
        ("GET", "/api/dias/{data_iso}/eventos/{evento_id}"),
        ("GET", "/api/dias/{data_iso}/eventos/{evento_id}/estado-equipes"),
        ("GET", "/api/dias/{data_iso}/eventos/{evento_id}/estado"),
        ("GET", "/api/dias/{data_iso}/eventos/{evento_id}/workspace"),
        ("GET", "/api/dias/{data_iso}/eventos/{evento_id}/partidas"),
        ("GET", "/api/eventos/{evento_id}/participants"),
        ("GET", "/api/eventos/{evento_id}/presentes"),
        ("GET", "/api/eventos/{evento_id}/lances"),
        ("GET", "/api/eventos/{evento_id}/rotacao/estado"),
        ("GET", "/api/dashboards/jogadores/resumo"),
        ("GET", "/api/dashboards/jogadores/ranking"),
        ("GET", "/api/dashboards/partidas/resumo"),
        ("GET", "/api/dashboards/partidas/serie-por-dia"),
        ("GET", "/api/dashboards/partidas/lista"),
        ("GET", "/api/dashboards/estatisticas/visao-geral"),
    }
)

SELF_SERVICE_ROUTES: Final[frozenset[RouteKey]] = frozenset(
    {
        ("POST", "/api/auth/logout"),
        ("POST", "/api/eventos/{evento_id}/rsvp"),
        ("POST", "/api/eventos/{evento_id}/checkin"),
        ("DELETE", "/api/eventos/{evento_id}/rsvp"),
        ("DELETE", "/api/eventos/{evento_id}/checkin"),
    }
)

OPERATOR_ROUTES: Final[frozenset[RouteKey]] = frozenset(
    {
        ("POST", "/api/jogadores"),
        ("PUT", "/api/jogadores/{jogador_id}"),
        ("DELETE", "/api/jogadores/{jogador_id}"),
        ("POST", "/api/turmas"),
        ("PUT", "/api/turmas/{turma_id}"),
        ("DELETE", "/api/turmas/{turma_id}"),
        ("POST", "/api/turmas/{turma_id}/jogadores"),
        ("DELETE", "/api/turmas/{turma_id}/jogadores/{jogador_id}"),
        ("POST", "/api/dias/{data_iso}/eventos"),
        ("PUT", "/api/dias/{data_iso}/eventos/{evento_id}/start"),
        ("POST", "/api/dias/{data_iso}/eventos/{evento_id}/start"),
        ("PUT", "/api/dias/{data_iso}/eventos/{evento_id}/finish"),
        ("POST", "/api/dias/{data_iso}/eventos/{evento_id}/finish"),
        ("PUT", "/api/dias/{data_iso}/eventos/{evento_id}/confirmar-presencas"),
        ("DELETE", "/api/dias/{data_iso}/eventos/{evento_id}"),
        ("POST", "/api/dias/{data_iso}/eventos/{evento_id}/times"),
        ("PUT", "/api/dias/{data_iso}/eventos/{evento_id}/jogadores/{jogador_evento_id}/time"),
        ("PUT", "/api/dias/{data_iso}/eventos/{evento_id}/jogadores/{jogador_evento_id}/status"),
        ("DELETE", "/api/dias/{data_iso}/eventos/{evento_id}/times/{time_id}"),
        ("PUT", "/api/dias/{data_iso}/eventos/{evento_id}/estado-equipes"),
        ("POST", "/api/dias/{data_iso}/eventos/{evento_id}/partidas"),
        ("PUT", "/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}"),
        (
            "PUT",
            "/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/jogadores/{jogador_evento_id}/stats",
        ),
        ("DELETE", "/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}"),
        ("PUT", "/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start"),
        ("POST", "/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start"),
        ("PUT", "/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end"),
        ("POST", "/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end"),
        ("POST", "/api/eventos/{evento_id}/participants/{jogador_id}/checkin"),
        ("POST", "/api/eventos/{evento_id}/start"),
        ("POST", "/api/eventos/{evento_id}/end"),
        ("POST", "/api/eventos/{evento_id}/cancel"),
        ("POST", "/api/eventos/{evento_id}/partidas/seed"),
        ("POST", "/api/eventos/{evento_id}/partidas/proxima"),
        ("POST", "/api/dias/{data_iso}/eventos/{evento_id}/partidas/proxima"),
        ("POST", "/api/partidas/{partida_id}/lances"),
        ("PATCH", "/api/eventos/{evento_id}/rotacao/estado"),
        ("POST", "/api/eventos/{evento_id}/rotacao/preview-sorteio"),
        ("POST", "/api/eventos/{evento_id}/rotacao/confirmar-sorteio"),
        ("PUT", "/api/usuarios/me/jogador"),
    }
)

ROUTE_POLICY: Final[dict[RouteKey, AccessPolicy]] = {
    **{route: AccessPolicy.PUBLIC for route in PUBLIC_ROUTES},
    **{route: AccessPolicy.AUTHENTICATED_READ for route in AUTHENTICATED_READ_ROUTES},
    **{route: AccessPolicy.SELF_SERVICE for route in SELF_SERVICE_ROUTES},
    **{route: AccessPolicy.OPERATOR for route in OPERATOR_ROUTES},
}


def access_policy(method: str, path: str) -> AccessPolicy:
    return ROUTE_POLICY[(method.upper(), path)]
