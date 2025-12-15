$ErrorActionPreference = "Stop"

function Info($m) { Write-Host "[INFO]  $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[WARN]  $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "[ERRO]  $m" -ForegroundColor Red; exit 1 }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
$FrontendDir = Join-Path $RepoRoot "frontend\jubileu-web"

if (-not (Test-Path $FrontendDir)) {
  Fail "Frontend nao encontrado em $FrontendDir"
}

Push-Location $FrontendDir
try {
  $envExample = Join-Path $FrontendDir ".env.example"
  $envFile = Join-Path $FrontendDir ".env"
  if ((Test-Path $envExample) -and (-not (Test-Path $envFile))) {
    Info "Criando .env a partir de .env.example (frontend)..."
    Copy-Item $envExample $envFile
  } elseif (-not (Test-Path $envExample)) {
    Warn ".env.example nao encontrado no frontend; pulando copia do .env."
  }

  Info "Instalando dependencias do frontend (npm install)..."
  npm install
} finally {
  Pop-Location
}
