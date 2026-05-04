from __future__ import annotations

import enum


class StatusAulaEnum(str, enum.Enum):
    PLANEJADA = "PLANEJADA"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"


class TipoEventoAulaEnum(str, enum.Enum):
    AULA = "AULA"
    JOGO = "JOGO"
    OUTRO = "OUTRO"


class StatusPresencaEnum(str, enum.Enum):
    presente = "presente"
    faltou = "faltou"
    atestado = "atestado"
    coringa = "coringa"
    so_treino = "so_treino"


class EventoParticipanteStatusEnum(str, enum.Enum):
    RSVP = "RSVP"
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    CANCELED = "CANCELED"
    NO_SHOW = "NO_SHOW"


class PartidaStatusEnum(str, enum.Enum):
    PLANEJADA = "PLANEJADA"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    ENCERRADA = "ENCERRADA"


class RotacaoSorteioStatusEnum(str, enum.Enum):
    PREVIEWED = "PREVIEWED"
    CONFIRMED = "CONFIRMED"
    CANCELED = "CANCELED"
    EXPIRED = "EXPIRED"
