"""
Compatibility surface for legacy imports.

Slice 02 splits the former mega-model into cohesive files while preserving
all legacy import paths (`app.models.dia_aula`).
"""

from app.models.dia_aula_core import (
    Aula,
    AulaEquipesEstado,
    Dia,
    JogadorAula,
    TeamConfig,
    TimeAula,
)
from app.models.dia_aula_enums import (
    EventoParticipanteStatusEnum,
    PartidaStatusEnum,
    RotacaoSorteioStatusEnum,
    StatusAulaEnum,
    StatusPresencaEnum,
    TipoEventoAulaEnum,
)
from app.models.dia_aula_event import EventoParticipante, Lance
from app.models.dia_aula_match import EstatisticaJogadorPartida, Partida
from app.models.dia_aula_rotation import EventoRotacaoEstado, EventoRotacaoSorteio

__all__ = [
    "Dia",
    "Aula",
    "AulaEquipesEstado",
    "TeamConfig",
    "TimeAula",
    "JogadorAula",
    "Partida",
    "EstatisticaJogadorPartida",
    "EventoParticipante",
    "Lance",
    "EventoRotacaoEstado",
    "EventoRotacaoSorteio",
    "StatusAulaEnum",
    "TipoEventoAulaEnum",
    "StatusPresencaEnum",
    "EventoParticipanteStatusEnum",
    "PartidaStatusEnum",
    "RotacaoSorteioStatusEnum",
]
