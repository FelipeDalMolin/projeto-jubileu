from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class AuthLoginIn(BaseModel):
    username: str
    password: str


class AuthMeOut(BaseModel):
    user_id: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    email: Optional[str] = None
    role: str
    jogador_id: Optional[int] = None
    expires_in: Optional[int] = None
