# app/routers/jogadores.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_db
from app.modules.auth.deps import get_operator_user
from app.models.jogador_turma import Jogador
from app.schemas.jogador import JogadorOut, JogadorCreate, JogadorUpdate

router = APIRouter(prefix="/jogadores", tags=["Jogadores"])

STATUS_VALIDOS = {"ativo", "inativo", "lesionado", "afastado"}

def normalizar_status(v: str | None) -> str:
    if v is None:
        return "ativo"
    s = v.strip().lower()
    if s == "":
        return "ativo"
    if s not in STATUS_VALIDOS:
        raise HTTPException(
            status_code=422,
            detail=f"status inválido. Use um de: {sorted(STATUS_VALIDOS)}",
        )
    return s


@router.get("", response_model=List[JogadorOut])
def listar_jogadores(db: Session = Depends(get_db)) -> List[Jogador]:
    return db.query(Jogador).order_by(Jogador.nome).all()


@router.post(
    "",
    response_model=JogadorOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_operator_user)],
)
def criar_jogador(payload: JogadorCreate, db: Session = Depends(get_db)) -> Jogador:
    nome = (payload.nome or "").strip()
    if not nome:
        raise HTTPException(status_code=422, detail="nome é obrigatório")

    apelido = payload.apelido.strip() if payload.apelido else None
    jogador = Jogador(
        nome=payload.nome,
        apelido=payload.apelido,
        status=payload.status or "ativo",
        ativo=True,
    )

    db.add(jogador)
    db.commit()
    db.refresh(jogador)
    return jogador


@router.get("/{jogador_id}", response_model=JogadorOut)
def obter_jogador(jogador_id: int, db: Session = Depends(get_db)) -> Jogador:
    jogador = db.get(Jogador, jogador_id)
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")
    return jogador


@router.put(
    "/{jogador_id}",
    response_model=JogadorOut,
    dependencies=[Depends(get_operator_user)],
)
def atualizar_jogador(
    jogador_id: int,
    payload: JogadorUpdate,
    db: Session = Depends(get_db),
) -> Jogador:
    jogador = db.get(Jogador, jogador_id)
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")

    if payload.nome is not None:
        nome = payload.nome.strip()
        if not nome:
            raise HTTPException(status_code=422, detail="nome não pode ser vazio")
        jogador.nome = nome

    if payload.apelido is not None:
        jogador.apelido = payload.apelido.strip() if payload.apelido else None

    if payload.status is not None:
        jogador.status = normalizar_status(payload.status)

    db.commit()
    db.refresh(jogador)
    return jogador


@router.delete(
    "/{jogador_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_operator_user)],
)
def deletar_jogador(jogador_id: int, db: Session = Depends(get_db)) -> None:
    jogador = db.get(Jogador, jogador_id)
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")

    db.delete(jogador)
    db.commit()
    return None
