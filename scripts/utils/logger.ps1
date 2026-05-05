# logger.ps1
# Funções de logging e utilidades comuns para scripts de setup

$Script:LogFile = $null
$Script:LogDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "..\logs"

# Garante que o diretório de logs existe
if (-not (Test-Path $Script:LogDir)) {
    New-Item -ItemType Directory -Path $Script:LogDir -Force | Out-Null
}

# Inicializa arquivo de log
function Initialize-Log {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $Script:LogFile = Join-Path $Script:LogDir "setup-$timestamp.log"
    Add-Content -Path $Script:LogFile -Value "=== Setup Log Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -Force
}

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "DEBUG", "SUCCESS")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Cores por tipo
    $colors = @{
        "INFO"    = "Cyan"
        "WARN"    = "Yellow"
        "ERROR"   = "Red"
        "DEBUG"   = "Gray"
        "SUCCESS" = "Green"
    }
    
    Write-Host $logMessage -ForegroundColor $colors[$Level]
    
    if ($Script:LogFile) {
        Add-Content -Path $Script:LogFile -Value $logMessage
    }
}

function Info { Write-Log -Message $args[0] -Level "INFO" }
function Warn { Write-Log -Message $args[0] -Level "WARN" }
function Fail { Write-Log -Message $args[0] -Level "ERROR" }
function Error-Log { Write-Log -Message $args[0] -Level "ERROR" }
function Debug { Write-Log -Message $args[0] -Level "DEBUG" }
function Success { Write-Log -Message $args[0] -Level "SUCCESS" }

function Fail {
    param([string]$Message)
    Error-Log $Message
    if ($Script:LogFile) {
        Add-Content -Path $Script:LogFile -Value "=== Setup Log FAILED at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
    }
    exit 1
}

function Get-LogFile {
    return $Script:LogFile
}

# Exporta as funções
Export-ModuleMember -Function @(
    'Initialize-Log',
    'Write-Log',
    'Info',
    'Warn',
    'Error-Log',
    'Debug',
    'Success',
    'Fail',
    'Get-LogFile'
)
