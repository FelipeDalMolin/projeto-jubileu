"""Facade transitoria para as capacidades do dominio Evento.

Routers e consumidores externos importam somente este modulo. Cada slice de
DEV-21 reduz `_legacy` ate que a facade possa ser removida sem alterar contrato.
"""

from app.modules.eventos._legacy import (
    confirm_rotacao_sorteio_flow,
    create_lance_flow,
    criar_proxima_partida_flow,
    get_rotacao_estado_flow,
    list_lances_flow,
    preview_rotacao_sorteio_flow,
    seed_primeira_partida_flow,
    update_rotacao_estado_flow,
)
from app.modules.eventos.lifecycle import (
    cancel_evento_flow,
    end_evento_flow,
    start_evento_flow,
)
from app.modules.eventos.participants import (
    checkin_manual_flow,
    checkin_self_cancel_flow,
    checkin_self_flow,
    list_participants_flow,
    list_presentes_flow,
    rsvp_self_cancel_flow,
    rsvp_self_flow,
)

__all__ = [
    "cancel_evento_flow",
    "checkin_manual_flow",
    "checkin_self_cancel_flow",
    "checkin_self_flow",
    "confirm_rotacao_sorteio_flow",
    "create_lance_flow",
    "criar_proxima_partida_flow",
    "end_evento_flow",
    "get_rotacao_estado_flow",
    "list_lances_flow",
    "list_participants_flow",
    "list_presentes_flow",
    "preview_rotacao_sorteio_flow",
    "rsvp_self_cancel_flow",
    "rsvp_self_flow",
    "seed_primeira_partida_flow",
    "start_evento_flow",
    "update_rotacao_estado_flow",
]
