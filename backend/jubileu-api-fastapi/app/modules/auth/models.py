from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class AuthAccount:
    user_id: str
    username: str
    password: str
    role: str
    jogador_id: Optional[int] = None
