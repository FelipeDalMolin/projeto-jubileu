# setup_all.ps1 (Melhorado)
# Orquestrador principal: Docker + Backend + Frontend

$ErrorActionPreference = "Stop"

# Importa módulos de utilidade
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UtilsDir = Join-Path $ScriptDir "utils"

. (Join-Path $UtilsDir "logger.ps1")
. (Join-Path $UtilsDir "validators.ps1")

Initialize-Log

Info "=== SETUP COMPLETO DO PROJETO ==="
Info "Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
$results = @{
    "Docker"   = "PENDENTE"
    "Backend"  = "PENDENTE"
    "Frontend" = "PENDENTE"
}

try {
    # 1. DOCKER COMPOSE
    $composePath = Join-Path $RepoRoot "docker-compose.yml"
    
    if (Test-Path $composePath) {
        Info ""
        Info "📦 Iniciando Docker Compose..."
        
        $dockerOk, $dockerMsg = Test-DockerInstalled
        if (-not $dockerOk) {
            Warn "Docker não está disponível: $dockerMsg"
            Warn "Pulando Docker Compose..."
            $results["Docker"] = "PULADO"
        } else {
            Success $dockerMsg
            
            try {
                Push-Location $RepoRoot
                Info "Executando: docker compose up -d"
                docker compose up -d
                
                if ($LASTEXITCODE -eq 0) {
                    $results["Docker"] = "OK"
                    Success "Docker Compose iniciado"
                    
                    Info "Aguardando serviços ficarem prontos (15s)..."
                    Start-Sleep -Seconds 15
                } else {
                    Warn "Docker Compose retornou erro, mas continuando..."
                    $results["Docker"] = "ERRO"
                }
            } catch {
                Warn "Erro ao executar Docker Compose: $_"
                $results["Docker"] = "ERRO"
            } finally {
                Pop-Location
            }
        }
    } else {
        Warn "docker-compose.yml não encontrado; pulando Docker Compose"
        $results["Docker"] = "PULADO"
    }
    
    # 2. BACKEND
    Info ""
    Info "🐍 Configurando Backend..."
    
    $backendScript = Join-Path $ScriptDir "setup_backend_improved.ps1"
    
    if (-not (Test-Path $backendScript)) {
        Warn "Script 'setup_backend_improved.ps1' não encontrado"
        Warn "Tentando usar 'setup_backend.ps1'..."
        $backendScript = Join-Path $ScriptDir "setup_backend.ps1"
        
        if (-not (Test-Path $backendScript)) {
            Fail "Nenhum script de backend encontrado"
        }
    }
    
    try {
        & $backendScript
        $results["Backend"] = "OK"
    } catch {
        Warn "Erro ao executar setup_backend: $_"
        $results["Backend"] = "ERRO"
    }
    
    # 3. FRONTEND
    Info ""
    Info "⚛️  Configurando Frontend..."
    
    $frontendScript = Join-Path $ScriptDir "setup_frontend_improved.ps1"
    
    if (-not (Test-Path $frontendScript)) {
        Warn "Script 'setup_frontend_improved.ps1' não encontrado"
        Warn "Tentando usar 'setup_frontend.ps1'..."
        $frontendScript = Join-Path $ScriptDir "setup_frontend.ps1"
        
        if (-not (Test-Path $frontendScript)) {
            Fail "Nenhum script de frontend encontrado"
        }
    }
    
    try {
        & $frontendScript
        $results["Frontend"] = "OK"
    } catch {
        Warn "Erro ao executar setup_frontend: $_"
        $results["Frontend"] = "ERRO"
    }
    
    # 4. RESUMO FINAL
    Info ""
    Info "╔════════════════════════════════════════╗"
    Info "║     RESUMO DO SETUP COMPLETO           ║"
    Info "╚════════════════════════════════════════╝"
    
    foreach ($component in $results.Keys) {
        $status = $results[$component]
        
        $emoji = switch ($status) {
            "OK"      { "✅" }
            "ERRO"    { "❌" }
            "PULADO"  { "⏭️ " }
            "PENDENTE" { "⏳" }
            default   { "❓" }
        }
        
        Write-Host "$emoji $component : $status" -ForegroundColor $(
            if ($status -eq "OK") { "Green" }
            elseif ($status -eq "ERRO") { "Red" }
            else { "Yellow" }
        )
    }
    
    Info ""
    Info "📋 Log completo salvo em: $(Get-LogFile)"
    
    # Verificar se houve erros
    $hasErrors = $results.Values -contains "ERRO"
    if ($hasErrors) {
        Warn ""
        Warn "⚠️  Alguns componentes tiveram erros. Verifique o log acima."
    } else {
        Success ""
        Success "✨ Setup completo concluído com sucesso!"
        Info ""
        Info "Próximos passos:"
        Info "  1. Backend:  python -m app.main  (ou uvicorn app.main:app --reload)"
        Info "  2. Frontend: npm run dev"
        Info "  3. Testar: .\scripts\test_setup.ps1"
    }
    
} catch {
    Fail "Erro falal durante setup completo: $_"
}
