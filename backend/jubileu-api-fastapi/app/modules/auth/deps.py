from __future__ import annotations

from fastapi import Cookie, Depends, Header, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.deps import get_db
from app.modules.auth.service import AuthUser, require_roles, resolve_current_user, validate_csrf

MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None, alias="Authorization"),
    access_cookie: str | None = Cookie(default=None, alias=settings.ACCESS_TOKEN_COOKIE),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_role: str | None = Header(default="user", alias="X-Role"),
    x_jogador_id: str | None = Header(default=None, alias="X-Jogador-Id"),
) -> AuthUser:
    user = resolve_current_user(db, authorization, access_cookie, x_user_id, x_role, x_jogador_id)
    if request.method in MUTATING_METHODS and user.auth_source == "cookie":
        validate_csrf(user.sid, request.cookies.get(settings.CSRF_COOKIE), request.headers.get("X-CSRF-Token"))
    return user


__all__ = ["AuthUser", "get_current_user", "require_roles"]
