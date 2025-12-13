from sqlalchemy.orm import Session
from passlib.context import CryptContext

from .models import Usuario
from .schemas import UsuarioCreate

# Usando pbkdf2_sha256 para evitar problemas do bcrypt
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)


def hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)


def criar_usuario(db: Session, dados: UsuarioCreate) -> Usuario:
    senha_hash = hash_senha(dados.senha)

    usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=senha_hash,
        papel=dados.papel,
        ativo=dados.ativo,
        jogador_id=dados.jogador_id,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def listar_usuarios(db: Session):
    return db.query(Usuario).all()
