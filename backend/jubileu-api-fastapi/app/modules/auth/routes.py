from __future__ import annotations

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.deps import get_db
from app.modules.auth import service
from app.modules.auth.deps import AuthUser, get_current_user
from app.modules.auth.schemas import AuthLoginIn, AuthMeOut

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _same_site() -> str:
    return "strict"


def _set_session_cookies(response: Response, refresh: str, access: str, user: service.AuthUser, ttl: int) -> None:
    secure = settings.COOKIE_SECURE
    response.set_cookie(settings.ACCESS_TOKEN_COOKIE, access, max_age=ttl, httponly=True, secure=secure, samesite=_same_site(), path="/")
    response.set_cookie(
        settings.REFRESH_TOKEN_COOKIE,
        refresh,
        max_age=settings.REFRESH_ABSOLUTE_DAYS * 86400,
        httponly=True,
        secure=secure,
        samesite=_same_site(),
        path="/api/auth",
    )
    response.set_cookie(
        settings.CSRF_COOKIE,
        service.csrf_token(user.sid or ""),
        max_age=settings.REFRESH_ABSOLUTE_DAYS * 86400,
        httponly=False,
        secure=secure,
        samesite=_same_site(),
        path="/",
    )


def _clear_session_cookies(response: Response) -> None:
    response.delete_cookie(settings.ACCESS_TOKEN_COOKIE, path="/")
    response.delete_cookie(settings.REFRESH_TOKEN_COOKIE, path="/api/auth")
    response.delete_cookie(settings.CSRF_COOKIE, path="/")


def _out(user: service.AuthUser, expires_in: int | None = None) -> AuthMeOut:
    return AuthMeOut(
        user_id=user.user_id,
        username=user.username,
        display_name=user.display_name,
        email=user.email,
        role=user.role,
        jogador_id=user.jogador_id,
        expires_in=expires_in,
    )


@router.post("/login", response_model=AuthMeOut)
def login(payload: AuthLoginIn, response: Response, db: Session = Depends(get_db)) -> AuthMeOut:
    model = service.authenticate_user(db, payload.username, payload.password)
    if not model:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_credentials")
    session, refresh, access, ttl = service.create_session(db, model)
    user = service.auth_user_from_model(model, sid=session.sid, source="cookie")
    _set_session_cookies(response, refresh, access, user, ttl)
    return _out(user, ttl)


@router.post("/refresh", response_model=AuthMeOut)
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    refresh_cookie: str | None = Cookie(default=None, alias=settings.REFRESH_TOKEN_COOKIE),
) -> AuthMeOut:
    if not refresh_cookie:
        raise HTTPException(status_code=401, detail="missing_refresh")
    old_sid = refresh_cookie.split(".", 1)[0]
    service.validate_csrf(old_sid, request.cookies.get(settings.CSRF_COOKIE), request.headers.get("X-CSRF-Token"))
    session, model, new_refresh, access, ttl = service.rotate_refresh(db, refresh_cookie)
    user = service.auth_user_from_model(model, sid=session.sid, source="cookie")
    _set_session_cookies(response, new_refresh, access, user, ttl)
    return _out(user, ttl)


@router.post("/logout", status_code=204)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
    refresh_cookie: str | None = Cookie(default=None, alias=settings.REFRESH_TOKEN_COOKIE),
) -> Response:
    sid = user.sid or (refresh_cookie.split(".", 1)[0] if refresh_cookie else None)
    if sid:
        service.validate_csrf(sid, request.cookies.get(settings.CSRF_COOKIE), request.headers.get("X-CSRF-Token"))
        service.revoke_session(db, sid)
    _clear_session_cookies(response)
    response.status_code = 204
    return response


@router.get("/me", response_model=AuthMeOut)
def me(user: AuthUser = Depends(get_current_user)) -> AuthMeOut:
    return _out(user)
