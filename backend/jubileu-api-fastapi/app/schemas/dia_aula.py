from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.dia_aula import (
    StatusAulaEnum,
    TipoEventoAulaEnum,
    StatusPresencaEnum,
)


# ---------------------------------------------------------
# ATRIBUTOS / JOGADORES / TIMES (para SNAPSHOT da aula)
# ---------------------------------------------------------


class AtributosJogadorDia(BaseModel):
    gols: int = 0
    assistencias: int = 0
    defesas: int = 0
    chiliques: int = 0
    faltas: int = 0


class PresencaJogadorDiaOut(BaseModel):
    """
    Snapshot do jogador dentro da AULA (não é o Jogador global).

    Este formato é o que vamos guardar no JSON de estado de equipes
    e mandar/receber do front.
    """

    jogadorId: int
    nome: str
    status: StatusPresencaEnum
    atributos: AtributosJogadorDia
    # id lógico do time dentro da aula (ex.: "time-1")
    timeId: Optional[str] = None


class TimeAulaOut(BaseModel):
    """Snapshot de um time dentro da AULA, no formato que o front usa."""

    id: str  # "time-1", "time-2"...
    nome: str  # "Time 1", "Time Azul"...
    jogadoresIds: List[int]
    caracteristica: Optional[str] = None
    corCamisa: Optional[str] = None


class TimeAulaCreate(BaseModel):
    """
    DTO de entrada para criar um time no banco (model TimeAula).

    Esse é usado no endpoint POST /dias/{data_iso}/aulas/{aula_id}/times.
    """

    nome: str
    caracteristica: Optional[str] = None
    cor_camisa: Optional[str] = None


# ---------------------------------------------------------
# ESTADO DE EQUIPES / SNAPSHOT
# ---------------------------------------------------------


class EstadoEquipesAulaIn(BaseModel):
    """
    Payload que o front envia para salvar o estado de equipes da aula.

    Vamos armazenar esse conteúdo no JSON da tabela aula_equipes_estado.
    """

    jogadores: List[PresencaJogadorDiaOut] = Field(default_factory=list)
    times: List[TimeAulaOut] = Field(default_factory=list)


class EstadoEquipesAulaOut(EstadoEquipesAulaIn):
    """Resposta do backend com o estado de equipes + id da aula."""

    aula_id: int


# ---------------------------------------------------------
# PARTIDA (por enquanto só para futuro uso)
# ---------------------------------------------------------


class PartidaOut(BaseModel):
    id: int
    ordem: int
    time_a_id: int
    time_b_id: int
    gols_time_a: int
    gols_time_b: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# AULA (IN / OUT)
# ---------------------------------------------------------


class AulaBase(BaseModel):
    turma_id: str
    turma_nome: str
    numero_aula_na_turma: int = 1
    tipo: TipoEventoAulaEnum = TipoEventoAulaEnum.AULA
    horario_inicio: str  # "19:00"
    horario_fim: str  # "20:00"
    status: StatusAulaEnum = StatusAulaEnum.PLANEJADA


class AulaCreate(AulaBase):
    """DTO de entrada para criar uma nova aula em um dia."""

    pass


class AulaOut(AulaBase):
    """
    Representação da Aula retornada pelos endpoints:
    - GET /dias/{data_iso}
    - GET /dias/{data_iso}/aulas/{aula_id}

    OBS: Aqui não estamos retornando times/jogadores/partidas diretamente;
    o estado de equipes fica no endpoint específico /estado-equipes.
    """

    id: int
    dia_id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# DIA (OUT)
# ---------------------------------------------------------


class DiaOut(BaseModel):
    """Representação de um dia com suas aulas."""

    id: int
    data_iso: str
    feriado_nome: Optional[str] = None
    feriado_tipo: Optional[str] = None
    aulas: List[AulaOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
