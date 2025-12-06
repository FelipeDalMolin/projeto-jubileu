from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import models
from app.schemas.jogador import JogadorCreate, JogadorUpdate, JogadorOut

router = APIRouter(
    prefix="/jogadores",
    tags=["Jogadores"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[JogadorOut])
def listar_jogadores(db: Session = Depends(get_db)):
    return db.query(models.Jogador).all()


@router.post("/", response_model=JogadorOut, status_code=status.HTTP_201_CREATED)
def criar_jogador(payload: JogadorCreate, db: Session = Depends(get_db)):
    jogador = models.Jogador(**payload.model_dump())
    db.add(jogador)
    db.commit()
    db.refresh(jogador)
    return jogador


@router.get("/{jogador_id}", response_model=JogadorOut)
def obter_jogador(jogador_id: int, db: Session = Depends(get_db)):
    jogador = db.query(models.Jogador).get(jogador_id)
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")
    return jogador


@router.put("/{jogador_id}", response_model=JogadorOut)
def atualizar_jogador(
    jogador_id: int,
    payload: JogadorUpdate,
    db: Session = Depends(get_db),
):
    jogador = db.query(models.Jogador).get(jogador_id)
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")

    for campo, valor in payload.model_dump().items():
        setattr(jogador, campo, valor)

    db.commit()
    db.refresh(jogador)
    return jogador


@router.delete("/{jogador_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_jogador(jogador_id: int, db: Session = Depends(get_db)):
    jogador = db.query(models.Jogador).get(jogador_id)
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")
    db.delete(jogador)
    db.commit()
    return None
