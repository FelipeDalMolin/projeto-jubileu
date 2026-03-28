"""
Compatibility bridge for legacy auth imports.

Slice 04 introduces app.modules.auth.*. Existing imports from app.deps_auth are
preserved by re-exporting AuthUser/get_current_user/require_roles.
"""

from app.modules.auth.deps import AuthUser, get_current_user, require_roles

ALLOWED_ROLES = {"admin", "treinador", "auxiliar", "user"}

__all__ = ["ALLOWED_ROLES", "AuthUser", "get_current_user", "require_roles"]
