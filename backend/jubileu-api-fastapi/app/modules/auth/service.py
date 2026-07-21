from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException, status
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.usuario import AuthSession, Usuario as UsuarioModel
from app.modules.auth.models import AuthAccount

ALLOWED_ROLES = {"admin", "treinador", "auxiliar", "user"}
PASSWORD_HASHER = PasswordHash.recommended()
RACE_GRACE_SECONDS = 5


@dataclass
class AuthUser:
    user_id: str
    role: str
    jogador_id: Optional[int]
    username: str | None = None
    display_name: str | None = None
    email: str | None = None
    sid: str | None = None
    auth_source: str = "legacy"


DEFAULT_ACCOUNTS: dict[str, AuthAccount] = {
    "admin": AuthAccount("u-admin", "admin", "admin123", "admin", "Administrador", "admin@jubileu.local"),
    "coach": AuthAccount("u-coach", "coach", "coach123", "treinador", "Treinador", "coach@jubileu.local"),
    "aux": AuthAccount("u-aux", "aux", "aux123", "auxiliar", "Auxiliar", "aux@jubileu.local"),
    "user": AuthAccount("u-user", "user", "user123", "user", "Usuario", "user@jubileu.local"),
}
DEFAULT_ACCOUNT_IDS = {account.user_id for account in DEFAULT_ACCOUNTS.values()}


def legacy_password_hash(password: str) -> str:
    material = f"{settings.JWT_SECRET}:{password}".encode()
    return hashlib.sha256(material).hexdigest()


# Backward-compatible symbol for fixtures and the v0.3 rollback window.
password_hash = legacy_password_hash


def seed_default_users(db: Session) -> None:
    if settings.APP_ENV.strip().lower() not in {"development", "test"}:
        raise RuntimeError("Seed de contas padrao permitido somente em development/test")
    for account in DEFAULT_ACCOUNTS.values():
        user = db.query(UsuarioModel).filter(UsuarioModel.user_id == account.user_id).first()
        if user is None:
            user = UsuarioModel(
                user_id=account.user_id,
                username=account.username,
                password_hash=legacy_password_hash(account.password),
                display_name=account.display_name,
                email=account.email,
                role=account.role,
                jogador_id=account.jogador_id,
            )
        user.is_active = True
        db.add(user)
    db.commit()


def auth_user_from_model(user: UsuarioModel, *, sid: str | None = None, source: str = "database") -> AuthUser:
    return AuthUser(
        user_id=user.user_id,
        role=user.role,
        jogador_id=user.jogador_id,
        username=user.username,
        display_name=user.display_name,
        email=user.email,
        sid=sid,
        auth_source=source,
    )


def get_usuario_by_user_id(db: Session, user_id: str) -> UsuarioModel | None:
    return db.query(UsuarioModel).filter(UsuarioModel.user_id == user_id, UsuarioModel.is_active.is_(True)).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[UsuarioModel]:
    user = db.query(UsuarioModel).filter(UsuarioModel.username == username.strip().lower()).first()
    if not user or not user.is_active:
        return None
    if settings.APP_ENV.strip().lower() == "production" and user.user_id in DEFAULT_ACCOUNT_IDS:
        return None
    if user.password_hash_argon2:
        try:
            valid, updated = PASSWORD_HASHER.verify_and_update(password, user.password_hash_argon2)
        except Exception:
            return None
        if not valid:
            return None
        if updated:
            user.password_hash_argon2 = updated
            db.commit()
        return user
    if not hmac.compare_digest(user.password_hash, legacy_password_hash(password)):
        return None
    user.password_hash_argon2 = PASSWORD_HASHER.hash(password)
    db.commit()
    db.refresh(user)
    return user


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    return base64.urlsafe_b64decode((data + "=" * ((4 - len(data) % 4) % 4)).encode("ascii"))


def _jwt_sign(message: bytes) -> str:
    return _b64url_encode(hmac.new(settings.JWT_SECRET.encode(), message, hashlib.sha256).digest())


def create_access_token(user: AuthUser, sid: str) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    ttl = settings.ACCESS_TOKEN_TTL_MINUTES * 60
    payload = {
        "sub": user.user_id,
        "role": user.role,
        "jogador_id": user.jogador_id,
        "username": user.username,
        "sid": sid,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp()) + ttl,
    }
    header = {"alg": "HS256", "typ": "JWT"}
    head = _b64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode())
    body = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    return f"{head}.{body}.{_jwt_sign(f'{head}.{body}'.encode())}", ttl


def decode_access_token(token: str, *, source: str = "bearer") -> AuthUser:
    try:
        head, body, signature = token.split(".")
        expected = _jwt_sign(f"{head}.{body}".encode())
        if not hmac.compare_digest(signature, expected):
            raise ValueError("signature")
        payload = json.loads(_b64url_decode(body))
    except Exception as exc:
        raise HTTPException(status_code=401, detail="invalid_token") from exc
    if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
        raise HTTPException(status_code=401, detail="token_expired")
    role = str(payload.get("role", "user")).lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="invalid_role")
    jogador = payload.get("jogador_id")
    return AuthUser(
        user_id=str(payload.get("sub", "")),
        role=role,
        jogador_id=int(jogador) if jogador is not None else None,
        username=payload.get("username"),
        sid=payload.get("sid"),
        auth_source=source,
    )


def _refresh_digest(raw_token: str) -> str:
    return hmac.new(settings.REFRESH_TOKEN_HMAC_SECRET.encode(), raw_token.encode(), hashlib.sha256).hexdigest()


def _new_refresh(sid: str) -> str:
    return f"{sid}.{secrets.token_urlsafe(48)}"


def create_session(db: Session, user: UsuarioModel) -> tuple[AuthSession, str, str, int]:
    now = datetime.now(timezone.utc)
    sid = str(uuid4())
    raw = _new_refresh(sid)
    session = AuthSession(
        sid=sid,
        family_id=str(uuid4()),
        usuario_id=user.id,
        refresh_digest=_refresh_digest(raw),
        expires_at=now + timedelta(days=settings.REFRESH_IDLE_DAYS),
        absolute_expires_at=now + timedelta(days=settings.REFRESH_ABSOLUTE_DAYS),
    )
    db.add(session)
    db.commit()
    auth_user = auth_user_from_model(user, sid=sid, source="cookie")
    access, ttl = create_access_token(auth_user, sid)
    return session, raw, access, ttl


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def rotate_refresh(db: Session, raw_token: str) -> tuple[AuthSession, UsuarioModel, str, str, int]:
    sid = raw_token.split(".", 1)[0]
    now = datetime.now(timezone.utc)
    current = db.query(AuthSession).filter(AuthSession.sid == sid).with_for_update().first()
    if current is None or not hmac.compare_digest(current.refresh_digest, _refresh_digest(raw_token)):
        raise HTTPException(status_code=401, detail="invalid_refresh")
    if current.rotated_at is not None:
        age = (now - _aware(current.rotated_at)).total_seconds()
        if age <= RACE_GRACE_SECONDS:
            raise HTTPException(status_code=409, detail="refresh_already_rotated")
        db.query(AuthSession).filter(AuthSession.family_id == current.family_id).update(
            {AuthSession.revoked_at: now}, synchronize_session=False
        )
        db.commit()
        raise HTTPException(status_code=401, detail="refresh_replay")
    if current.revoked_at is not None or _aware(current.expires_at) <= now or _aware(current.absolute_expires_at) <= now:
        raise HTTPException(status_code=401, detail="refresh_expired")
    user = db.get(UsuarioModel, current.usuario_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="inactive_user")
    new_sid = str(uuid4())
    new_raw = _new_refresh(new_sid)
    successor = AuthSession(
        sid=new_sid,
        family_id=current.family_id,
        usuario_id=current.usuario_id,
        refresh_digest=_refresh_digest(new_raw),
        expires_at=min(now + timedelta(days=settings.REFRESH_IDLE_DAYS), _aware(current.absolute_expires_at)),
        absolute_expires_at=current.absolute_expires_at,
    )
    current.rotated_at = now
    current.replaced_by_sid = new_sid
    db.add(successor)
    db.commit()
    access, ttl = create_access_token(auth_user_from_model(user, sid=new_sid, source="cookie"), new_sid)
    return successor, user, new_raw, access, ttl


def revoke_session(db: Session, sid: str | None) -> None:
    if not sid:
        return
    session = db.query(AuthSession).filter(AuthSession.sid == sid).with_for_update().first()
    if session and session.revoked_at is None:
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()


def csrf_token(sid: str) -> str:
    nonce = secrets.token_urlsafe(24)
    signature = hmac.new(settings.REFRESH_TOKEN_HMAC_SECRET.encode(), f"{sid}:{nonce}".encode(), hashlib.sha256).hexdigest()
    return f"{sid}.{nonce}.{signature}"


def validate_csrf(sid: str | None, cookie: str | None, header: str | None) -> None:
    if not sid or not cookie or not header or not hmac.compare_digest(cookie, header):
        raise HTTPException(status_code=403, detail="csrf_invalid")
    try:
        token_sid, nonce, signature = cookie.split(".", 2)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail="csrf_invalid") from exc
    expected = hmac.new(settings.REFRESH_TOKEN_HMAC_SECRET.encode(), f"{token_sid}:{nonce}".encode(), hashlib.sha256).hexdigest()
    if token_sid != sid or not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=403, detail="csrf_invalid")


def parse_legacy_headers(x_user_id: str | None, x_role: str | None, x_jogador_id: str | None) -> AuthUser:
    if settings.APP_ENV.strip().lower() not in {"development", "test"}:
        raise HTTPException(status_code=401, detail="legacy_auth_disabled")
    if not x_user_id:
        raise HTTPException(status_code=401, detail="missing_auth")
    role = (x_role or "user").lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="invalid_role")
    try:
        jogador = int(x_jogador_id) if x_jogador_id else None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="invalid_jogador_id") from exc
    return AuthUser(x_user_id, role, jogador, auth_source="legacy")


def resolve_current_user(
    db: Session,
    authorization: str | None,
    access_cookie: str | None,
    x_user_id: str | None,
    x_role: str | None,
    x_jogador_id: str | None,
) -> AuthUser:
    bearer = None
    if authorization:
        parts = authorization.split(" ", 1)
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="invalid_authorization")
        bearer = decode_access_token(parts[1], source="bearer")
    cookie = decode_access_token(access_cookie, source="cookie") if access_cookie else None
    if bearer and cookie and (bearer.user_id != cookie.user_id or bearer.sid != cookie.sid):
        raise HTTPException(status_code=401, detail="auth_context_conflict")
    resolved = cookie or bearer
    if resolved:
        persisted = get_usuario_by_user_id(db, resolved.user_id)
        if persisted is None:
            raise HTTPException(status_code=401, detail="inactive_user")
        return auth_user_from_model(persisted, sid=resolved.sid, source=resolved.auth_source)
    legacy = parse_legacy_headers(x_user_id, x_role, x_jogador_id)
    persisted = get_usuario_by_user_id(db, legacy.user_id)
    return auth_user_from_model(persisted, source="legacy") if persisted else legacy


def require_roles(user: AuthUser, *roles: str) -> None:
    if user.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
