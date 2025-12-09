from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Jubileu API"
    DATABASE_URL: str = "postgresql+psycopg2://usuario:senha@localhost:5432/jubileu_dev"

    JWT_SECRET: str = "CHANGE_ME"
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()