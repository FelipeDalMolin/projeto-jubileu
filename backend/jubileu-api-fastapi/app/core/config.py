from urllib.parse import urlsplit

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Jubileu API"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    RELEASE_REF: str = "development"
    GIT_SHA: str = "unknown"
    BACKEND_IMAGE_DIGEST: str = "unknown"
    FRONTEND_IMAGE_DIGEST: str = "unknown"
    ALEMBIC_EXPECTED_REVISION: str = "0020_auth_sessions_rollback_safe"

    DATABASE_URL: str | None = None

    # OTel remains opt-in. The container overlay used during an investigation
    # flips only OTEL_SDK_DISABLED and keeps the application functional when the
    # Collector is stopped or unavailable.
    OTEL_SDK_DISABLED: bool = True
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://otel-collector:4318"
    OTEL_EXPORTER_OTLP_TIMEOUT_SECONDS: float = 5.0
    OTEL_TRACES_SAMPLER_ARG: float = 1.0
    OTEL_BSP_MAX_QUEUE_SIZE: int = 512
    OTEL_BSP_MAX_EXPORT_BATCH_SIZE: int = 128
    OTEL_SERVICE_NAMESPACE: str = "jubileu"
    OTEL_SERVICE_NAME: str = "jubileu-api"
    OTEL_HOST_NAME: str = "app-host"

    JWT_SECRET: str = "CHANGE_ME"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    AUTH_MODE: str = "jwt_compat"  # legacy | jwt_compat | jwt_only
    REFRESH_TOKEN_HMAC_SECRET: str = "change-me-dev-only-refresh"
    ACCESS_TOKEN_COOKIE: str = "jubileu_access"
    REFRESH_TOKEN_COOKIE: str = "jubileu_refresh"
    CSRF_COOKIE: str = "jubileu_csrf"
    ACCESS_TOKEN_TTL_MINUTES: int = 5
    REFRESH_IDLE_DAYS: int = 30
    REFRESH_ABSOLUTE_DAYS: int = 60
    COOKIE_SECURE: bool = False

    CORS_ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]

    @model_validator(mode="after")
    def validate_auth_security(self):
        env = self.APP_ENV.strip().lower()
        mode = self.AUTH_MODE.strip().lower()
        allowed_modes = {"legacy", "jwt_compat", "jwt_only", "secure"}
        if mode not in allowed_modes:
            raise ValueError("AUTH_MODE invalido")
        if env == "production":
            placeholders = {"change_me", "change-me", "change-me-dev-only", "change-me-with-a-long-random-secret"}
            secrets = {self.JWT_SECRET.strip().lower(), self.REFRESH_TOKEN_HMAC_SECRET.strip().lower()}
            if mode != "secure":
                raise ValueError("AUTH_MODE=secure e obrigatorio em producao")
            if any(len(secret) < 32 or secret in placeholders or "change-me" in secret for secret in secrets):
                raise ValueError("Segredos de autenticacao inseguros em producao")
            if self.JWT_SECRET == self.REFRESH_TOKEN_HMAC_SECRET:
                raise ValueError("JWT_SECRET e REFRESH_TOKEN_HMAC_SECRET devem ser distintos")
            if not self.COOKIE_SECURE:
                raise ValueError("COOKIE_SECURE=true e obrigatorio em producao")
        if not 0.0 <= self.OTEL_TRACES_SAMPLER_ARG <= 1.0:
            raise ValueError("OTEL_TRACES_SAMPLER_ARG deve estar entre 0 e 1")
        otlp_endpoint = urlsplit(self.OTEL_EXPORTER_OTLP_ENDPOINT)
        if otlp_endpoint.scheme not in {"http", "https"} or not otlp_endpoint.hostname:
            raise ValueError("OTEL_EXPORTER_OTLP_ENDPOINT deve usar HTTP ou HTTPS com hostname")
        if (
            otlp_endpoint.username
            or otlp_endpoint.password
            or otlp_endpoint.path not in {"", "/"}
            or otlp_endpoint.query
            or otlp_endpoint.fragment
        ):
            raise ValueError(
                "OTEL_EXPORTER_OTLP_ENDPOINT nao aceita credencial, path, query ou fragmento"
            )
        if self.OTEL_BSP_MAX_QUEUE_SIZE < 1:
            raise ValueError("OTEL_BSP_MAX_QUEUE_SIZE deve ser positivo")
        if not 1 <= self.OTEL_BSP_MAX_EXPORT_BATCH_SIZE <= self.OTEL_BSP_MAX_QUEUE_SIZE:
            raise ValueError("OTEL_BSP_MAX_EXPORT_BATCH_SIZE deve estar entre 1 e o tamanho da fila")
        return self


settings = Settings()
