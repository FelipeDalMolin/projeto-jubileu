from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_db
from app.modules.auth.deps import get_operator_user
from app.models.jogador_turma import Turma, TurmaJogador, Jogador
from app.schemas.jogador_turma import JogadorOut, TurmaOut, TurmaCreate, TurmaUpdate

router = APIRouter(
    prefix="/turmas",
    tags=["Turmas"],
)

# ---------------------------
# TURMAS
# ---------------------------

@router.get("", response_model=list[TurmaOut])
def listar_turmas(db: Session = Depends(get_db)):
    return db.query(Turma).order_by(Turma.nome).all()


@router.post(
    "",
    response_model=TurmaOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_operator_user)],
)
def criar_turma(payload: TurmaCreate, db: Session = Depends(get_db)):
    turma = Turma(nome=payload.nome)
    db.add(turma)
    db.commit()
    db.refresh(turma)
    return turma


@router.get("/{turma_id}", response_model=TurmaOut)
def obter_turma(turma_id: int, db: Session = Depends(get_db)):
    turma = db.get(Turma, turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return turma


@router.put(
    "/{turma_id}",
    response_model=TurmaOut,
    dependencies=[Depends(get_operator_user)],
)
def atualizar_turma(turma_id: int, payload: TurmaUpdate, db: Session = Depends(get_db)):
    turma = db.get(Turma, turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    if payload.nome is not None:
        turma.nome = payload.nome

    db.commit()
    db.refresh(turma)
    return turma


@router.delete(
    "/{turma_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_operator_user)],
)
def deletar_turma(turma_id: int, db: Session = Depends(get_db)):
    turma = db.get(Turma, turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    db.delete(turma)
    db.commit()


# ---------------------------
# JOGADORES DA TURMA
# ---------------------------

@router.get("/{turma_id}/jogadores", response_model=list[JogadorOut])
def listar_jogadores_da_turma(turma_id: int, db: Session = Depends(get_db)):
    turma = db.get(Turma, turma_id)
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


@router.post(
    "/{turma_id}/jogadores",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_operator_user)],
)
def adicionar_jogador_na_turma(
    turma_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    jogador_id = payload.get("jogador_id")
    if not jogador_id:
        raise HTTPException(status_code=400, detail="jogador_id é obrigatório")

    turma = db.get(Turma, turma_id)
    jogador = db.get(Jogador, jogador_id)

    if not turma or not jogador:
        raise HTTPException(status_code=404, detail="Turma ou jogador não encontrado")

    vinculo = (
        db.query(TurmaJogador)
        .filter(
            TurmaJogador.turma_id == turma_id,
            TurmaJogador.jogador_id == jogador_id,
        )
        .first()
    )

    if vinculo:
        vinculo.ativo = True
    else:
        vinculo = TurmaJogador(
            turma_id=turma_id,
            jogador_id=jogador_id,
            ativo=True,
        )
        db.add(vinculo)

    db.commit()


@router.delete(
    "/{turma_id}/jogadores/{jogador_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_operator_user)],
)
def remover_jogador_da_turma(
    turma_id: int,
    jogador_id: int,
    db: Session = Depends(get_db),
):
    vinculo = (
        db.query(TurmaJogador)
        .filter(
            TurmaJogador.turma_id == turma_id,
            TurmaJogador.jogador_id == jogador_id,
            TurmaJogador.ativo.is_(True),
        )
        .first()
    )

    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")

    vinculo.ativo = False
    db.commit()
