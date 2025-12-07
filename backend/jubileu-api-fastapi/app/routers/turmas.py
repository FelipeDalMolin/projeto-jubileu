# app/routers/turmas.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.jogador_turma import Turma, TurmaJogador, Jogador
from app.schemas.jogador_turma import JogadorOut

router = APIRouter(
    prefix="/turmas",
    tags=["Turmas"],
)


def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()


@router.get("/{turma_id}/jogadores", response_model=list[JogadorOut])
def listar_jogadores_da_turma(
    turma_id: str,
    db: Session = Depends(get_db),
):
  turma = db.query(Turma).filter(Turma.id == turma_id).first()
  if not turma:
    raise HTTPException(status_code=404, detail="Turma não encontrada")

  vinculacoes = (
      db.query(TurmaJogador)
      .join(Jogador, TurmaJogador.jogador_id == Jogador.id)
      .filter(
          TurmaJogador.turma_id == turma_id,
          TurmaJogador.ativo.is_(True),
      )
      .order_by(Jogador.nome)
      .all()
  )

  return [v.jogador for v in vinculacoes]
