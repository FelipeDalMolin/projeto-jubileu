from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_db
from app.modules.auth import service as auth_service
from app.modules.auth.deps import AuthUser, get_current_user
from app.modules.auth.schemas import AuthLoginIn, AuthMeOut, AuthTokenOut

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=AuthTokenOut)
def login(payload: AuthLoginIn, db: Session = Depends(get_db)) -> AuthTokenOut:
    user = auth_service.authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token, expires_in = auth_service.create_access_token(user)
    return AuthTokenOut(access_token=token, token_type="bearer", expires_in=expires_in)


@router.get("/me", response_model=AuthMeOut)
def me(user: AuthUser = Depends(get_current_user)) -> AuthMeOut:
    return AuthMeOut(
        user_id=user.user_id,
        username=user.username,
        display_name=user.display_name,
        email=user.email,
        role=user.role,
        jogador_id=user.jogador_id,
    )
