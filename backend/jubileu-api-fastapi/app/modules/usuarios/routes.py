from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from .schemas import UsuarioCreate, UsuarioOut
from .service import criar_usuario, listar_usuarios

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


@router.post("/", response_model=UsuarioOut)
def criar(dados: UsuarioCreate, db: Session = Depends(get_db)):
    return criar_usuario(db, dados)


@router.get("/", response_model=list[UsuarioOut])
def listar(db: Session = Depends(get_db)):
    return listar_usuarios(db)
