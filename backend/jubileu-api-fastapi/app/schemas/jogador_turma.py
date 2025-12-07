# app/schemas/jogador_turma.py
from pydantic import BaseModel, ConfigDict


class JogadorOut(BaseModel):
  id: int
  nome: str
  apelido: str | None = None
  status: str

  model_config = ConfigDict(from_attributes=True)


class TurmaOut(BaseModel):
  id: str
  nome: str

  model_config = ConfigDict(from_attributes=True)
