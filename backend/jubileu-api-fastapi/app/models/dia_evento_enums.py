from __future__ import annotations

import enum


class StatusEventoEnum(str, enum.Enum):
    PLANEJADO = "PLANEJADO"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    ENCERRADO = "ENCERRADO"
    CANCELADO = "CANCELADO"


class TipoEventoEnum(str, enum.Enum):
    AULA = "AULA"
    JOGO_LIVRE = "JOGO_LIVRE"
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
