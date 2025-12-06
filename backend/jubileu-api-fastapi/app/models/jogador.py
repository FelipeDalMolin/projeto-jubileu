from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
import enum


class StatusJogadorEnum(str, enum.Enum):
    ativo = "ativo"
    temporariamente_inativo = "temporariamente_inativo"
    afastado = "afastado"


class Jogador(Base):
    __tablename__ = "jogadores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    apelido = Column(String, nullable=True)
    posicao = Column(String, nullable=True)
    status = Column(Enum(StatusJogadorEnum), default=StatusJogadorEnum.ativo)
