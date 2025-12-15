# setup_backend_structure.ps1
# Cria a estrutura base do backend FastAPI (opção 2 – modular)
# Não sobrescreve arquivos existentes.

$ErrorActionPreference = "Stop"

# Ajuste este caminho se o nome da pasta do backend for diferente
$backendRoot = Join-Path $PSScriptRoot "backend\jubileu-api-fastapi"
$appRoot     = Join-Path $backendRoot "app"

Write-Host "Backend root: $backendRoot"
Write-Host "App root    : $appRoot"
Write-Host ""

function Ensure-Dir($path) {
    if (-not (Test-Path $path)) {
        Write-Host "Criando diretório: $path"
        New-Item -ItemType Directory -Path $path | Out-Null
    }
    else {
        Write-Host "Diretório já existe, pulando: $path"
    }
}

function Ensure-File($path, $content = "") {
    if (-not (Test-Path $path)) {
        Write-Host "Criando arquivo: $path"
        New-Item -ItemType File -Path $path -Value $content | Out-Null
    }
    else {
        Write-Host "Arquivo já existe, pulando: $path"
    }
}

# 1) Diretórios principais
Ensure-Dir $backendRoot
Ensure-Dir $appRoot

Ensure-Dir (Join-Path $appRoot "core")
Ensure-Dir (Join-Path $appRoot "db")
Ensure-Dir (Join-Path $appRoot "modules")

# Módulos de domínio
$modules = @("jogadores", "usuarios", "turmas", "aulas", "partidas", "avaliacoes")
foreach ($m in $modules) {
    Ensure-Dir (Join-Path $appRoot "modules\$m")
}

# 2) __init__.py em todos os pacotes
Ensure-File (Join-Path $appRoot "__init__.py") ""
Ensure-File (Join-Path $appRoot "core\__init__.py") ""
Ensure-File (Join-Path $appRoot "db\__init__.py") ""
Ensure-File (Join-Path $appRoot "modules\__init__.py") ""

foreach ($m in $modules) {
    Ensure-File (Join-Path $appRoot "modules\$m\__init__.py") ""
}

# 3) Arquivos básicos de config / DB / main

$mainContent = @"
from fastapi import FastAPI

from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)


@app.get("/")
def root():
    return {"status": "ok", "message": "Jubileu API rodando"}
"@

Ensure-File (Join-Path $appRoot "main.py") $mainContent

$configContent = @"
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Jubileu API"
    DATABASE_URL: str = "postgresql+psycopg2://usuario:senha@localhost:5432/jubileu_dev"

    JWT_SECRET: str = "CHANGE_ME"
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()
"@

Ensure-File (Join-Path $appRoot "core\config.py") $configContent

$sessionContent = @"
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    future=True,
    echo=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
"@

Ensure-File (Join-Path $appRoot "db\session.py") $sessionContent

$baseContent = @"
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

# IMPORTAR MODELOS AQUI (será preenchido depois)
"@

Ensure-File (Join-Path $appRoot "db\base.py") $baseContent

# 4) Arquivos vazios para cada módulo (models/schemas/service/routes)

foreach ($m in $modules) {
    $modulePath = Join-Path $appRoot "modules\$m"

    Ensure-File (Join-Path $modulePath "models.py")  "# models de $m"
    Ensure-File (Join-Path $modulePath "schemas.py") "# schemas de $m"
    Ensure-File (Join-Path $modulePath "service.py") "# regras de negócio de $m"
    Ensure-File (Join-Path $modulePath "routes.py")  "# rotas de $m"
}

Write-Host ""
Write-Host "Estrutura do backend criada/atualizada com sucesso."
