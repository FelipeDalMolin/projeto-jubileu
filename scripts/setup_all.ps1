$ErrorActionPreference = "Stop"

function Info($m) { Write-Host "[INFO]  $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[WARN]  $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "[ERRO]  $m" -ForegroundColor Red; exit 1 }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path

$composePath = Join-Path $RepoRoot "docker-compose.yml"
if (Test-Path $composePath) {
  Info "Subindo servicos via Docker Compose..."
  try {
    docker compose up -d
  } catch {
    Warn "Falha ao executar 'docker compose up -d': $_"
  }
} else {
  Warn "docker-compose.yml nao encontrado; pulando Docker Compose."
}

$backendScript = Join-Path $ScriptDir "setup_backend.ps1"
if (-not (Test-Path $backendScript)) {
  Fail "Script backend nao encontrado em $backendScript"
}
& $backendScript

$frontendScript = Join-Path $ScriptDir "setup_frontend.ps1"
if (-not (Test-Path $frontendScript)) {
  Fail "Script frontend nao encontrado em $frontendScript"
}
& $frontendScript
