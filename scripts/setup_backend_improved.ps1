# setup_backend.ps1 (Melhorado)
# Configura backend FastAPI com validações robustas

$ErrorActionPreference = "Stop"

# Importa módulos de utilidade
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UtilsDir = Join-Path $ScriptDir "utils"

. (Join-Path $UtilsDir "logger.ps1")
. (Join-Path $UtilsDir "validators.ps1")

Initialize-Log

Info "=== SETUP BACKEND FASTAPI ==="

try {
    # 1. Validação de Pré-requisitos
    Info "Verificando pré-requisitos..."
    
    # Python
    $pythonOk, $pythonMsg = Test-PythonVersion "3.8"
    if (-not $pythonOk) {
        Fail "Python não está disponível: $pythonMsg"
    }
    Success $pythonMsg
    
    # Git
    $gitOk, $gitMsg = Test-GitInstalled
    if (-not $gitOk) {
        Warn "Git não está disponível: $gitMsg"
    } else {
        Success $gitMsg
    }
    
    # Espaço em disco
    $diskOk, $diskMsg = Test-DiskSpace 1024
    if (-not $diskOk) {
        Warn "Espaço em disco baixo: $diskMsg"
    } else {
        Debug "Espaço em disco: $diskMsg"
    }
    
    # 2. Definir caminhos
    $RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
    $BackendDir = Join-Path $RepoRoot "backend\jubileu-api-fastapi"
    
    Info "Caminho do backend: $BackendDir"
    
    if (-not (Test-Path $BackendDir)) {
        Fail "Backend não encontrado em $BackendDir"
    }
    
    # 3. Verificar estrutura
    $reqFile = Join-Path $BackendDir "requirements.txt"
    $alembicIni = Join-Path $BackendDir "alembic.ini"
    
    if (-not (Test-Path $reqFile)) {
        Warn "requirements.txt não encontrado"
    }
    if (-not (Test-Path $alembicIni)) {
        Warn "alembic.ini não encontrado - migrations serão puladas"
    }
    
    Push-Location $BackendDir
    
    try {
        # 4. Configurar .env
        Info "Configurando arquivo .env..."
        $envExample = Join-Path $BackendDir ".env.example"
        $envFile = Join-Path $BackendDir ".env"
        
        if (-not (Test-Path $envFile)) {
            if (Test-Path $envExample) {
                Info "Copiando .env a partir de .env.example..."
                Copy-Item $envExample $envFile
                Success ".env criado"
            } else {
                Warn ".env.example não encontrado - você precisará configurar .env manualmente"
            }
        } else {
            Debug ".env já existe"
        }
        
        # 5. Criar / Validar ambiente virtual
        Info "Configurando ambiente virtual Python..."
        $venvDir = Join-Path $BackendDir ".venv"
        
        if (-not (Test-Path $venvDir)) {
            Info "Criando ambiente virtual em $venvDir..."
            python -m venv $venvDir
            Success "Ambiente virtual criado"
        } else {
            Debug "Ambiente virtual já existe"
        }
        
        # Validar Activate.ps1
        $activate = Join-Path $venvDir "Scripts\Activate.ps1"
        if (-not (Test-Path $activate)) {
            Fail "Activate.ps1 não encontrado em $activate"
        }
        
        # 6. Ativar venv e instalar dependências
        Info "Ativando ambiente virtual..."
        . $activate
        Success "Ambiente virtual ativado"
        
        if (Test-Path $reqFile) {
            Info "Instalando dependências (requirements.txt)..."
            
            # Upgrade pip
            Debug "Atualizando pip..."
            $result = python -m pip install --upgrade pip 2>&1
            if ($LASTEXITCODE -eq 0) {
                Success "pip atualizado"
            } else {
                Warn "Aviso ao atualizar pip: $result"
            }
            
            # Instalar requirements
            Debug "Instalando pacotes de requirements.txt..."
            pip install -r $reqFile
            if ($LASTEXITCODE -eq 0) {
                Success "Dependências instaladas"
            } else {
                Fail "Erro ao instalar dependências"
            }
        } else {
            Warn "requirements.txt não encontrado - pulando instalação de dependências"
        }
        
        # 7. Executar migrations
        if (Test-Path $alembicIni) {
            Info "Executando migrations (alembic upgrade head)..."
            
            try {
                alembic upgrade head
                if ($LASTEXITCODE -eq 0) {
                    Success "Migrations executadas com sucesso"
                } else {
                    Warn "Alembic retornou código de saída: $LASTEXITCODE"
                }
            } catch {
                Warn "Erro potencial ao executar migrations: $_"
                Warn "Certifique-se de que a bancada de dados está rodando"
            }
        } else {
            Debug "alembic.ini não encontrado - pulando migrations"
        }
        
        # 8. Resumo final
        Info ""
        Success "=== SETUP BACKEND COMPLETO ==="
        Info "Próximos passos:"
        Info "  1. Configure as variáveis de ambiente em .env"
        Info "  2. Inicie a API com: python -m app.main"
        Info "  3. Ou use: uvicorn app.main:app --reload"
        
    } finally {
        Pop-Location
    }
    
    Info "Log salvo em: $(Get-LogFile)"
    
} catch {
    Fail "Erro durante setup do backend: $_"
}
