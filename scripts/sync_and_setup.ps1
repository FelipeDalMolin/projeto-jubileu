$ErrorActionPreference = "Stop"

function Info($m) { Write-Host "[INFO]  $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[WARN]  $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "[ERRO]  $m" -ForegroundColor Red; exit 1 }

function Test-LocalBranch($name) {
  git show-ref --verify --quiet ("refs/heads/" + $name) 2>$null
  return $LASTEXITCODE -eq 0
}

function Test-RemoteBranch($name) {
  git ls-remote --exit-code --heads origin $name *> $null
  return $LASTEXITCODE -eq 0
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
$BranchCandidates = @("jubileuv2", "jubileu-v2")

Push-Location $RepoRoot
try {
  Info "Verificando status do Git..."
  $dirty = git status --porcelain
  if ($dirty) {
    Warn "Ha alteracoes locais nao commitadas. O pull pode falhar se houver conflito."
    Warn "Sugestao: faca commit ou use 'git stash -u' antes de rodar novamente."
    git status
  }

  Info "Atualizando refs remotas (git fetch --all --prune)..."
  git fetch --all --prune

  $targetBranch = $null
  foreach ($candidate in $BranchCandidates) {
    if (Test-LocalBranch $candidate -or Test-RemoteBranch $candidate) {
      $targetBranch = $candidate
      break
    }
  }

  if (-not $targetBranch) {
    Fail "Nenhuma branch esperada encontrada (jubileuv2/jubileu-v2)."
  }

  if (Test-LocalBranch $targetBranch) {
    Info "Trocando para a branch '$targetBranch'..."
    git switch $targetBranch
  } elseif (Test-RemoteBranch $targetBranch) {
    Info "Criando branch local '$targetBranch' a partir de origin/$targetBranch..."
    git switch -c $targetBranch --track ("origin/" + $targetBranch)
  } else {
    Fail "Branch '$targetBranch' nao encontrada."
  }

  $upstream = git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null
  if (-not $upstream) {
    Info "Configurando upstream para origin/$targetBranch..."
    git branch --set-upstream-to=("origin/" + $targetBranch) $targetBranch
  }

  Info "Aplicando atualizacoes da branch (git pull --rebase)..."
  git pull --rebase

  $setupAll = Join-Path $ScriptDir "setup_all.ps1"
  if (-not (Test-Path $setupAll)) {
    Fail "Script setup_all.ps1 nao encontrado em $setupAll"
  }

  Info "Executando setup completo..."
  & $setupAll
} finally {
  Pop-Location
}
