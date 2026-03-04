from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from fastapi import Header, HTTPException, status


ALLOWED_ROLES = {"admin", "treinador", "auxiliar", "user"}


@dataclass
class AuthUser:
    user_id: str
    role: str
    jogador_id: Optional[int]


def get_current_user(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_role: str | None = Header(default="user", alias="X-Role"),
    x_jogador_id: str | None = Header(default=None, alias="X-Jogador-Id"),
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


def require_roles(user: AuthUser, *roles: str) -> None:
    if user.role not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient role",
        )

