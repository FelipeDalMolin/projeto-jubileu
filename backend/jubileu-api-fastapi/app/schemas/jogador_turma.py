from pydantic import BaseModel, ConfigDict


# ---------------------------
# JOGADOR
# ---------------------------

class JogadorOut(BaseModel):
    id: int
    nome: str
    apelido: str | None = None
    status: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------
# TURMA
# ---------------------------

class TurmaBase(BaseModel):
    nome: str


class TurmaCreate(TurmaBase):
    pass


class TurmaUpdate(BaseModel):
    nome: str | None = None


class TurmaOut(TurmaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
