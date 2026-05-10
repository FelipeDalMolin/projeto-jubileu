from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.models.dia_evento import EventoParticipanteStatusEnum, StatusEventoEnum, TipoEventoEnum


class UsuarioPerfilOut(BaseModel):
    user_id: str
    username: str
    display_name: str
    email: str | None = None
    role: str
    jogador_id: int | None = None


class UsuarioJogadorOut(BaseModel):
    id: int
    nome: str
    apelido: str | None = None
    status: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UsuarioEventoParticipadoOut(BaseModel):
    evento_id: int
    data_iso: str
    tipo: TipoEventoEnum
    status: StatusEventoEnum
    horario_inicio: str
    horario_fim: str
    turma_id: int | None = None
    turma_nome: str | None = None
    participante_status: EventoParticipanteStatusEnum | None = None


class UsuarioMeOut(BaseModel):
    usuario: UsuarioPerfilOut
    jogador: UsuarioJogadorOut | None = None
    eventos: list[UsuarioEventoParticipadoOut] = Field(default_factory=list)
