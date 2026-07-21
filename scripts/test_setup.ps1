# test_setup.ps1
# Valida e testa se o setup foi realizado corretamente

$ErrorActionPreference = "Stop"

# Importa módulos de utilidade
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UtilsDir = Join-Path $ScriptDir "utils"

. (Join-Path $UtilsDir "logger.ps1")
. (Join-Path $UtilsDir "validators.ps1")

Initialize-Log

Info "=== TESTE DE VALIDAÇÃO DO SETUP ==="
Info "Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
$testResults = @{}

try {
    # ==============================================================
    # 1. VALIDAÇÕES GLOBAIS
    # ==============================================================
    Info ""
    Info "🔍 Validações Globais"
    
    $testResults["Python"] = Test-PythonVersion "3.8"
    $testResults["Node.js"] = Test-NodeVersion "18.0.0"
    $testResults["npm"] = Test-NpmVersion "9.0.0"
    
    # ==============================================================
    # 2. VALIDAÇÃO DO BACKEND
    # ==============================================================
    Info ""
    Info "🔍 Validação do Backend"
    
    $BackendDir = Join-Path $RepoRoot "backend\jubileu-api-fastapi"
    
    if (Test-Path $BackendDir) {
        Success "Diretório backend encontrado"
        
        # Verificar venv
        $venvDir = Join-Path $BackendDir ".venv"
        if (Test-Path $venvDir) {
            $testResults["Backend venv"] = @($true, "Ambiente virtual existe")
            Success "✓ Ambiente virtual .venv"
        } else {
            $testResults["Backend venv"] = @($false, "Ambiente virtual não existe")
            Warn "✗ Ambiente virtual .venv não encontrado"
        }
        
        # Verificar .env
        $envOk, $envMsg = Test-EnvFile $BackendDir
        if ($envOk) {
            $testResults["Backend .env"] = @($true, "Arquivo .env OK")
            Success "✓ Arquivo .env configurado"
        } else {
            $testResults["Backend .env"] = @($false, $envMsg)
            Warn "✗ $envMsg"
        }
        
        # Verificar requirements.txt
        $reqFile = Join-Path $BackendDir "requirements.txt"
        if (Test-Path $reqFile) {
            $testResults["Backend requirements"] = @($true, "requirements.txt encontrado")
            Success "✓ requirements.txt encontrado"
        } else {
            $testResults["Backend requirements"] = @($false, "requirements.txt não encontrado")
            Warn "✗ requirements.txt não encontrado"
        }
        
        # Verificar alembic.ini
        $alembicIni = Join-Path $BackendDir "alembic.ini"
        if (Test-Path $alembicIni) {
            $testResults["Backend alembic"] = @($true, "alembic.ini encontrado")
            Success "✓ alembic.ini encontrado"
        } else {
            $testResults["Backend alembic"] = @($false, "alembic.ini não encontrado")
            Debug "ℹ alembic.ini não encontrado (pode ser intencional)"
        }
        
    } else {
        Warn "✗ Diretório backend não encontrado: $BackendDir"
    }
    
    # ==============================================================
    # 3. VALIDAÇÃO DO FRONTEND
    # ==============================================================
    Info ""
    Info "🔍 Validação do Frontend"
    
    $FrontendDir = Join-Path $RepoRoot "frontend\jubileu-web"
    
    if (Test-Path $FrontendDir) {
        Success "Diretório frontend encontrado"
        
        # Verificar package.json
        $packageJson = Join-Path $FrontendDir "package.json"
        if (Test-Path $packageJson) {
            $testResults["Frontend package.json"] = @($true, "package.json encontrado")
            Success "✓ package.json encontrado"
        } else {
            $testResults["Frontend package.json"] = @($false, "package.json não encontrado")
            Fail "✗ package.json não encontrado"
        }
        
        # Verificar node_modules
        $nodeModules = Join-Path $FrontendDir "node_modules"
        if (Test-Path $nodeModules) {
            $testResults["Frontend node_modules"] = @($true, "node_modules instalado")
            Success "✓ node_modules instalado"
        } else {
            $testResults["Frontend node_modules"] = @($false, "node_modules não instalado")
            Warn "✗ node_modules não encontrado (execute npm install)"
        }
        
        # Verificar .env
        $envOk, $envMsg = Test-EnvFile $FrontendDir
        if ($envOk) {
            $testResults["Frontend .env"] = @($true, "Arquivo .env OK")
            Success "✓ Arquivo .env configurado"
        } else {
            $testResults["Frontend .env"] = @($false, $envMsg)
            Warn "✗ $envMsg"
        }
        
        # Verificar package-lock.json
        $packageLock = Join-Path $FrontendDir "package-lock.json"
        if (Test-Path $packageLock) {
            $testResults["Frontend package-lock"] = @($true, "package-lock.json encontrado")
            Success "✓ package-lock.json encontrado"
        } else {
            $testResults["Frontend package-lock"] = @($false, "package-lock.json não encontrado")
            Debug "ℹ package-lock.json não encontrado (recomenda-se fazer commit)"
        }
        
    } else {
        Warn "✗ Diretório frontend não encontrado: $FrontendDir"
    }
    
    # ==============================================================
    # 4. VALIDAÇÃO DO DOCKER
    # ==============================================================
    Info ""
    Info "🔍 Validação do Docker"
    
    $composePath = Join-Path $RepoRoot "compose.dev.yml"
    if (Test-Path $composePath) {
        Success "compose.dev.yml encontrado"
        
        $dockerOk, $dockerMsg = Test-DockerInstalled
        if ($dockerOk) {
            $testResults["Docker"] = @($true, $dockerMsg)
            Success "✓ Docker disponível"
            
            try {
                Debug "Verificando containers em execução..."
                $containers = docker ps --quiet 2>$null
                if ($containers) {
                    $containerCount = ($containers | Measure-Object -Line).Lines
                    Success "✓ $containerCount container(s) em execução"
                } else {
                    Debug "ℹ Nenhum container em execução"
                }
            } catch {
                Warn "Aviso ao verificar containers: $_"
            }
        } else {
            $testResults["Docker"] = @($false, $dockerMsg)
            Warn "✗ Docker não disponível: $dockerMsg"
        }
    } else {
        Debug "ℹ compose.dev.yml não encontrado"
    }
    
    # ==============================================================
    # 5. RESUMO E RELATÓRIO
    # ==============================================================
    Info ""
    Info "╔════════════════════════════════════════╗"
    Info "║      RELATÓRIO DE VALIDAÇÃO            ║"
    Info "╚════════════════════════════════════════╝"
    
    $passCount = 0
    $failCount = 0
    $warnCount = 0
    
    foreach ($test in $testResults.GetEnumerator() | Sort-Object -Property Key) {
        $testName = $test.Key
        $result = $test.Value
        $isOk = $result[0]
        $message = $result[1]
        
        if ($isOk) {
            Write-Host "$testName : OK" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "$testName : FALHOU" -ForegroundColor Red
            Write-Host "   -> $message" -ForegroundColor Red
            $failCount++
        }
    }
    
    Info ""
    Info "Resultados:"
    Success "$passCount testes passaram"
    if ($failCount -gt 0) {
        Warn "$failCount testes falharam"
    }
    
    Info ""
    Info "Log completo: $(Get-LogFile)"
    
    # ==============================================================
    # 6. RECOMENDAÇÕES
    # ==============================================================
    if ($failCount -eq 0) {
        Success ""
        Success "Tudo OK! Seu ambiente está pronto."
        Info ""
        Info "Você pode iniciar com:"
        Info "  Backend:  cd .\backend\jubileu-api-fastapi"
        Info "            python -m app.main"
        Info ""
        Info "  Frontend: cd .\frontend\jubileu-web"
        Info "            npm run dev"
    } else {
        Warn ""
        Warn "Você tem $failCount issue(s) para resolver:"
        
        foreach ($test in $testResults.GetEnumerator() | Sort-Object -Property Key) {
            $testName = $test.Key
            $result = $test.Value
            $isOk = $result[0]
            $message = $result[1]
            
            if (-not $isOk) {
                Warn "  • ${testName}: $message"
            }
        }
        
        Info ""
        Info "Execute novamente após corrigir os issues:"
        Info "  .\scripts\test_setup.ps1"
    }
    
} catch {
    Fail "Erro durante teste: $_"
}
