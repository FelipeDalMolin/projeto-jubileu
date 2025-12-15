$ErrorActionPreference = "Stop"

function Info($m) { Write-Host "[INFO]  $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[WARN]  $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "[ERRO]  $m" -ForegroundColor Red; exit 1 }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
$BackendDir = Join-Path $RepoRoot "backend\jubileu-api-fastapi"

if (-not (Test-Path $BackendDir)) {
  Fail "Backend nao encontrado em $BackendDir"
}

Push-Location $BackendDir
try {
  $envExample = Join-Path $BackendDir ".env.example"
  $envFile = Join-Path $BackendDir ".env"
  if ((Test-Path $envExample) -and (-not (Test-Path $envFile))) {
    Info "Criando .env a partir de .env.example (backend)..."
    Copy-Item $envExample $envFile
  } elseif (-not (Test-Path $envExample)) {
    Warn ".env.example nao encontrado no backend; pulando copia do .env."
  }

  $venvDir = Join-Path $BackendDir ".venv"
  if (-not (Test-Path $venvDir)) {
    Info "Criando ambiente virtual .venv..."
    python -m venv $venvDir
  }

  $activate = Join-Path $venvDir "Scripts\Activate.ps1"
  if (-not (Test-Path $activate)) {
    Fail "Activate.ps1 nao encontrado em $activate"
  }
  . $activate

  $requirements = Join-Path $BackendDir "requirements.txt"
  if (Test-Path $requirements) {
    Info "Instalando dependencias do backend (requirements.txt)..."
    python -m pip install --upgrade pip | Out-Null
    pip install -r $requirements
  } else {
    Warn "requirements.txt nao encontrado; pulando instalacao do backend."
  }

  $alembicIni = Join-Path $BackendDir "alembic.ini"
  if (Test-Path $alembicIni) {
    Info "Rodando migrations (alembic upgrade head)..."
    alembic upgrade head
  } else {
    Warn "alembic.ini nao encontrado; pulando migrations."
  }
} finally {
  Pop-Location
}
