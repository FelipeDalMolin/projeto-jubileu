from __future__ import annotations

from fastapi import Header

from app.modules.auth.service import AuthUser, require_roles, resolve_current_user


def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_role: str | None = Header(default="user", alias="X-Role"),
    x_jogador_id: str | None = Header(default=None, alias="X-Jogador-Id"),
) -> AuthUser:
    return resolve_current_user(
        authorization=authorization,
        x_user_id=x_user_id,
        x_role=x_role,
        x_jogador_id=x_jogador_id,
    )


__all__ = ["AuthUser", "get_current_user", "require_roles"]
