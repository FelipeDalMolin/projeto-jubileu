from __future__ import annotations

import base64
import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status

from app.core.config import settings
from app.modules.auth.models import AuthAccount

ALLOWED_ROLES = {"admin", "treinador", "auxiliar", "user"}


@dataclass
class AuthUser:
    user_id: str
    role: str
    jogador_id: Optional[int]


DEFAULT_ACCOUNTS: dict[str, AuthAccount] = {
    "admin": AuthAccount(user_id="u-admin", username="admin", password="admin123", role="admin"),
    "coach": AuthAccount(user_id="u-coach", username="coach", password="coach123", role="treinador"),
    "aux": AuthAccount(user_id="u-aux", username="aux", password="aux123", role="auxiliar"),
    "user": AuthAccount(user_id="u-user", username="user", password="user123", role="user"),
}


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("ascii"))


def _jwt_sign(message: bytes) -> str:
    digest = hmac.new(settings.JWT_SECRET.encode("utf-8"), message, hashlib.sha256).digest()
    return _b64url_encode(digest)


def create_access_token(user: AuthUser) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    exp_at = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": user.user_id,
        "role": user.role,
        "jogador_id": user.jogador_id,
        "iat": int(now.timestamp()),
        "exp": int(exp_at.timestamp()),
    }
    header = {"alg": "HS256", "typ": "JWT"}

    header_part = _b64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    payload_part = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signing_input = f"{header_part}.{payload_part}".encode("ascii")
    signature_part = _jwt_sign(signing_input)
    token = f"{header_part}.{payload_part}.{signature_part}"
    return token, settings.JWT_EXPIRE_MINUTES * 60


def decode_access_token(token: str) -> AuthUser:
    try:
        header_part, payload_part, signature_part = token.split(".")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    signing_input = f"{header_part}.{payload_part}".encode("ascii")
    expected_sig = _jwt_sign(signing_input)
    if not hmac.compare_digest(signature_part, expected_sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")

    try:
        payload = json.loads(_b64url_decode(payload_part).decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload") from exc

    exp = int(payload.get("exp", 0))
    if exp < int(datetime.now(timezone.utc).timestamp()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    role = str(payload.get("role", "user")).strip().lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role")

    jogador_id_raw = payload.get("jogador_id")
    jogador_id = int(jogador_id_raw) if jogador_id_raw is not None else None

    return AuthUser(
        user_id=str(payload.get("sub", "")),
        role=role,
        jogador_id=jogador_id,
    )


def authenticate_user(username: str, password: str) -> Optional[AuthUser]:
    account = DEFAULT_ACCOUNTS.get(username.strip().lower())
    if not account or account.password != password:
        return None
    return AuthUser(user_id=account.user_id, role=account.role, jogador_id=account.jogador_id)


def parse_legacy_headers(
    x_user_id: str | None,
    x_role: str | None,
    x_jogador_id: str | None,
) -> AuthUser:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header",
        )

    role = (x_role or "user").strip().lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid role",
        )

    jogador_id: Optional[int] = None
    if x_jogador_id:
        try:
            jogador_id = int(x_jogador_id)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid X-Jogador-Id",
            ) from exc

    return AuthUser(user_id=x_user_id, role=role, jogador_id=jogador_id)


def parse_authorization_bearer(authorization: str | None) -> Optional[AuthUser]:
    if not authorization:
        return None
    parts = authorization.strip().split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header")
    return decode_access_token(parts[1])


def resolve_current_user(
    authorization: str | None,
    x_user_id: str | None,
    x_role: str | None,
    x_jogador_id: str | None,
) -> AuthUser:
    mode = settings.AUTH_MODE.strip().lower()
    if mode not in {"legacy", "jwt_compat", "jwt_only"}:
        mode = "jwt_compat"

    if mode == "legacy":
        return parse_legacy_headers(x_user_id, x_role, x_jogador_id)

    bearer_user = parse_authorization_bearer(authorization)
    if bearer_user is not None:
        return bearer_user

    if mode == "jwt_only":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    return parse_legacy_headers(x_user_id, x_role, x_jogador_id)


def require_roles(user: AuthUser, *roles: str) -> None:
    if user.role not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient role",
        )
