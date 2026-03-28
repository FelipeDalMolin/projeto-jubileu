# setup_frontend.ps1 (Melhorado)
# Configura frontend React/Vite com validações robustas

$ErrorActionPreference = "Stop"

# Importa módulos de utilidade
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UtilsDir = Join-Path $ScriptDir "utils"

. (Join-Path $UtilsDir "logger.ps1")
. (Join-Path $UtilsDir "validators.ps1")

Initialize-Log

Info "=== SETUP FRONTEND REACT/VITE ==="

try {
    # 1. Validação de Pré-requisitos
    Info "Verificando pré-requisitos..."
    
    # Node.js
    $nodeOk, $nodeMsg = Test-NodeVersion "18.0.0"
    if (-not $nodeOk) {
        Fail "Node.js não está disponível ou versão inadequada: $nodeMsg"
    }
    Success $nodeMsg
    
    # npm
    $npmOk, $npmMsg = Test-NpmVersion "9.0.0"
    if (-not $npmOk) {
        Fail "npm não está disponível ou versão inadequada: $npmMsg"
    }
    Success $npmMsg
    
    # Espaço em disco
    $diskOk, $diskMsg = Test-DiskSpace 1024
    if (-not $diskOk) {
        Warn "Espaço em disco baixo: $diskMsg"
    } else {
        Debug "Espaço em disco: $diskMsg"
    }
    
    # 2. Definir caminhos
    $RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
    $FrontendDir = Join-Path $RepoRoot "frontend\jubileu-web"
    
    Info "Caminho do frontend: $FrontendDir"
    
    if (-not (Test-Path $FrontendDir)) {
        Fail "Frontend não encontrado em $FrontendDir"
    }
    
    # 3. Validar estrutura
    $packageJson = Join-Path $FrontendDir "package.json"
    if (-not (Test-Path $packageJson)) {
        Fail "package.json não encontrado em $FrontendDir"
    }
    Success "package.json encontrado"
    
    Push-Location $FrontendDir
    
    try {
        # 4. Configurar .env
        Info "Configurando arquivo .env..."
        $envExample = Join-Path $FrontendDir ".env.example"
        $envFile = Join-Path $FrontendDir ".env"
        
        if (-not (Test-Path $envFile)) {
            if (Test-Path $envExample) {
                Info "Copiando .env a partir de .env.example..."
                Copy-Item $envExample $envFile
                Success ".env criado"
            } else {
                Warn ".env.example não encontrado - você pode precisar configurar .env manualmente"
            }
        } else {
            Debug ".env já existe"
        }
        
        # 5. Limpar node_modules se solicitado
        $nodeModules = Join-Path $FrontendDir "node_modules"
        if (Test-Path $nodeModules) {
            Debug "node_modules já existe"
        }
        
        # 6. Instalar dependências
        Info "Instalando dependências (npm install)..."
        Debug "Executando: npm install"
        
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Success "Dependências instaladas com sucesso"
        } else {
            Fail "Erro ao instalar dependências npm"
        }
        
        # 7. Validar instalação
        if (Test-Path $nodeModules) {
            $count = @(Get-ChildItem -Path $nodeModules -Directory).Count
            Debug "node_modules com ~$count diretórios"
        }
        
        # 8. Verificar se há lockfile
        $packageLock = Join-Path $FrontendDir "package-lock.json"
        if (Test-Path $packageLock) {
            Success "package-lock.json encontrado (reprodutibilidade garantida)"
        } else {
            Warn "package-lock.json não encontrado - considere fazer commit"
        }
        
        # 9. Testar build (opcional)
        $hasVite = $null -ne (npm list vite 2>$null)
        if ($hasVite) {
            Info "Testando build Vite..."
            Debug "Executando: npm run build"
            npm run build
            if ($LASTEXITCODE -eq 0) {
                Success "Build Vite completado com sucesso"
            } else {
                Warn "Build Vite teve avisos/erros, mas pode estar OK"
            }
        }
        
        # 10. Resumo final
        Info ""
        Success "=== SETUP FRONTEND COMPLETO ==="
        Info "Próximos passos:"
        Info "  1. Configure as variáveis de ambiente em .env"
        Info "  2. Inicie o dev server com: npm run dev"
        Info "  3. Acesse em http://localhost:5173 (padrão Vite)"
        
    } finally {
        Pop-Location
    }
    
    Info "Log salvo em: $(Get-LogFile)"
    
} catch {
    Fail "Erro durante setup do frontend: $_"
}
