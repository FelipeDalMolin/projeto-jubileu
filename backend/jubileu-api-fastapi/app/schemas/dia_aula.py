from pydantic import BaseModel
from pydantic import ConfigDict
from enum import Enum


class StatusAulaEnum(str, Enum):
    PLANEJADA = "PLANEJADA"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"


class TipoEventoAulaEnum(str, Enum):
    AULA = "AULA"
    JOGO = "JOGO"
    OUTRO = "OUTRO"


class StatusPresencaEnum(str, Enum):
    presente = "presente"
    faltou = "faltou"
    atestado = "atestado"
    coringa = "coringa"
    so_treino = "so_treino"


class AtributosJogadorDia(BaseModel):
    gols: int = 0
    assistencias: int = 0
    defesas: int = 0
    chiliques: int = 0
    faltas: int = 0


# ----------------- JOGADOR / TIME / PARTIDA (OUT) -----------------


class PresencaJogadorDiaOut(BaseModel):
    id: int
    jogador_id: int | None = None
    nome: str
    status: StatusPresencaEnum
    time_id: int | None = None
    atributos: AtributosJogadorDia

    model_config = ConfigDict(from_attributes=True)


class TimeAulaOut(BaseModel):
    id: int
    nome: str
    caracteristica: str | None = None
    cor_camisa: str | None = None

    model_config = ConfigDict(from_attributes=True)

class TimeAulaCreate(BaseModel):
    nome: str
    caracteristica: str | None = None
    cor_camisa: str | None = None

class PartidaOut(BaseModel):
    id: int
    ordem: int
    time_a_id: int
    time_b_id: int
    gols_time_a: int
    gols_time_b: int

    model_config = ConfigDict(from_attributes=True)


# ----------------- AULA (IN / OUT) -----------------


class AulaBase(BaseModel):
    turma_id: str
    turma_nome: str
    numero_aula_na_turma: int = 1
    tipo: TipoEventoAulaEnum = TipoEventoAulaEnum.AULA
    horario_inicio: str  # "19:00"
    horario_fim: str      # "20:00"
    status: StatusAulaEnum = StatusAulaEnum.PLANEJADA


class AulaCreate(AulaBase):
    """
    DTO de entrada para criar uma nova aula em um dia.
    """
    pass


class AulaOut(AulaBase):
    id: int
    times: list[TimeAulaOut] = []
    jogadores: list[PresencaJogadorDiaOut] = []
    partidas: list[PartidaOut] = []

    @property
    def partidas_count(self) -> int:
        return len(self.partidas)

    model_config = ConfigDict(from_attributes=True)



# ----------------- DIA (OUT) -----------------


class DiaOut(BaseModel):
    data_iso: str
    aulas: list[AulaOut] = []

    model_config = ConfigDict(from_attributes=True)
