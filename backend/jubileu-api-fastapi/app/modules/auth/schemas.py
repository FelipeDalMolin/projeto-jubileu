from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class AuthLoginIn(BaseModel):
    username: str
    password: str


class AuthTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthMeOut(BaseModel):
    user_id: str
    role: str
    jogador_id: Optional[int] = None
