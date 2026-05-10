"""
Compatibility surface for legacy imports.

Slice 02 splits the former mega-model into cohesive files while preserving
all legacy import paths (`app.models.dia_evento`).
"""

from app.models.dia_evento_core import (
    Evento,
    EventoEquipesEstado,
    Dia,
    JogadorEvento,
    TeamConfig,
    TimeEvento,
)
from app.models.dia_evento_enums import (
    EventoParticipanteStatusEnum,
    PartidaStatusEnum,
    RotacaoSorteioStatusEnum,
    StatusEventoEnum,
    StatusPresencaEnum,
    TipoEventoEnum,
)
from app.models.dia_evento_event import EventoParticipante, Lance
from app.models.dia_evento_match import EstatisticaJogadorPartida, Partida
from app.models.dia_evento_rotation import EventoRotacaoEstado, EventoRotacaoSorteio

__all__ = [
    "Dia",
    "Evento",
    "EventoEquipesEstado",
    "TeamConfig",
    "TimeEvento",
    "JogadorEvento",
    "Partida",
    "EstatisticaJogadorPartida",
    "EventoParticipante",
    "Lance",
    "EventoRotacaoEstado",
    "EventoRotacaoSorteio",
    "StatusEventoEnum",
    "TipoEventoEnum",
    "StatusPresencaEnum",
    "EventoParticipanteStatusEnum",
    "PartidaStatusEnum",
    "RotacaoSorteioStatusEnum",
]
