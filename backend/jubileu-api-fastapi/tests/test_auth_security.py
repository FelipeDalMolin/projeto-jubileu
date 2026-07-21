from concurrent.futures import ThreadPoolExecutor
import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.usuario import AuthSession, Usuario
from app.modules.auth import service
from app.core.config import Settings


def _user(username: str = "secure-user") -> Usuario:
    return Usuario(
        user_id=f"u-{username}",
        username=username,
        password_hash=service.legacy_password_hash("secret123"),
        display_name="Secure User",
        role="user",
        is_active=True,
    )


def test_legacy_hash_is_preserved_when_argon2_is_added(db_session):
    user = _user()
    legacy = user.password_hash
    db_session.add(user)
    db_session.commit()

    authenticated = service.authenticate_user(db_session, user.username, "secret123")

    assert authenticated is not None
    assert authenticated.password_hash == legacy
    assert authenticated.password_hash_argon2.startswith("$argon2")
    assert service.authenticate_user(db_session, user.username, "secret123") is not None


def test_known_account_is_rejected_in_production_even_if_active(db_session, monkeypatch):
    user = _user("admin")
    user.user_id = "u-admin"
    user.password_hash = service.legacy_password_hash("admin123")
    user.is_active = True
    db_session.add(user)
    db_session.commit()
    monkeypatch.setattr(service.settings, "APP_ENV", "production")
    assert service.authenticate_user(db_session, "admin", "admin123") is None


def test_production_rejects_insecure_or_ambiguous_auth_configuration():
    with pytest.raises(ValueError):
        Settings(APP_ENV="production", AUTH_MODE="jwt_compat", COOKIE_SECURE=True)
    with pytest.raises(ValueError):
        Settings(
            APP_ENV="production",
            AUTH_MODE="secure",
            COOKIE_SECURE=True,
            JWT_SECRET="same-secret-that-is-long-enough-123456789",
            REFRESH_TOKEN_HMAC_SECRET="same-secret-that-is-long-enough-123456789",
        )


def test_cookie_refresh_rotation_and_logout(client: TestClient, db_session):
    user = _user("cookie-user")
    db_session.add(user)
    db_session.commit()
    login = client.post("/api/auth/login", json={"username": user.username, "password": "secret123"})
    assert login.status_code == 200
    assert "access_token" not in login.json()
    old_refresh = client.cookies.get("jubileu_refresh")
    csrf = client.cookies.get("jubileu_csrf")
    assert old_refresh and csrf

    refreshed = client.post("/api/auth/refresh", headers={"X-CSRF-Token": csrf})
    assert refreshed.status_code == 200, refreshed.text
    assert client.cookies.get("jubileu_refresh") != old_refresh
    new_csrf = client.cookies.get("jubileu_csrf")
    logged_out = client.post("/api/auth/logout", headers={"X-CSRF-Token": new_csrf})
    assert logged_out.status_code == 204
    assert db_session.query(AuthSession).filter(AuthSession.revoked_at.is_not(None)).count() == 1


def test_cookie_requires_csrf_and_conflicting_bearer_is_rejected(client: TestClient, db_session):
    first = _user("cookie-first")
    second = _user("bearer-second")
    db_session.add_all([first, second])
    db_session.commit()
    assert client.post("/api/auth/login", json={"username": first.username, "password": "secret123"}).status_code == 200
    assert client.post("/api/auth/logout").status_code == 403

    other = service.auth_user_from_model(second, sid="different-session", source="bearer")
    bearer, _ = service.create_access_token(other, "different-session")
    conflict = client.get("/api/auth/me", headers={"Authorization": f"Bearer {bearer}"})
    assert conflict.status_code == 401
    assert conflict.json()["detail"] == "auth_context_conflict"


@pytest.mark.postgresql
def test_refresh_rotation_is_transactional_on_postgresql():
    database_url = os.getenv("DATABASE_URL_TEST")
    if not database_url or not database_url.startswith("postgresql"):
        pytest.skip("DATABASE_URL_TEST PostgreSQL nao configurada")
    engine = create_engine(database_url, future=True)
    Session = sessionmaker(bind=engine, expire_on_commit=False, future=True)
    marker = uuid4().hex[:10]
    with Session() as db:
        user = _user(f"pg-{marker}")
        db.add(user)
        db.commit()
        _, raw, _, _ = service.create_session(db, user)

    def rotate():
        with Session() as db:
            try:
                result = service.rotate_refresh(db, raw)
                return "ok", result[0].sid
            except Exception as exc:
                return "error", getattr(exc, "detail", str(exc))

    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: rotate(), range(2)))
        assert sum(1 for kind, _ in results if kind == "ok") == 1
        assert ("error", "refresh_already_rotated") in results
    finally:
        with Session() as db:
            db.query(AuthSession).filter(AuthSession.usuario_id == user.id).delete()
            db.query(Usuario).filter(Usuario.id == user.id).delete()
            db.commit()
