# validators.ps1
# Funções de validação de pré-requisitos e ambiente

# Verifica se um comando existe disponível
function Test-CommandExists {
    param([string]$Command)
    
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Verifica versão do Python
function Test-PythonVersion {
    param([string]$MinVersion = "3.8")
    
    if (-not (Test-CommandExists "python")) {
        return $false, "Python não está instalado"
    }
    
    try {
        $version = python --version 2>&1
        $versionNumber = [version]($version -replace "Python\s*", "")
        $minVersionObj = [version]$MinVersion
        
        if ($versionNumber -lt $minVersionObj) {
            return $false, "Python $versionNumber (mínimo: $MinVersion)"
        }
        
        return $true, "Python $versionNumber"
    } catch {
        return $false, "Erro ao verificar Python: $_"
    }
}

# Verifica versão do Node.js
function Test-NodeVersion {
    param([string]$MinVersion = "18.0.0")
    
    if (-not (Test-CommandExists "node")) {
        return $false, "Node.js não está instalado"
    }
    
    try {
        $version = node --version
        $versionNumber = [version]($version -replace "v", "")
        $minVersionObj = [version]$MinVersion
        
        if ($versionNumber -lt $minVersionObj) {
            return $false, "Node.js $versionNumber (mínimo: $MinVersion)"
        }
        
        return $true, "Node.js $versionNumber"
    } catch {
        return $false, "Erro ao verificar Node.js: $_"
    }
}

# Verifica versão do npm
function Test-NpmVersion {
    param([string]$MinVersion = "9.0.0")
    
    if (-not (Test-CommandExists "npm")) {
        return $false, "npm não está instalado"
    }
    
    try {
        $version = npm --version
        $versionNumber = [version]$version
        $minVersionObj = [version]$MinVersion
        
        if ($versionNumber -lt $minVersionObj) {
            return $false, "npm $versionNumber (mínimo: $MinVersion)"
        }
        
        return $true, "npm $versionNumber"
    } catch {
        return $false, "Erro ao verificar npm: $_"
    }
}

# Verifica se Docker está instalado
function Test-DockerInstalled {
    if (-not (Test-CommandExists "docker")) {
        return $false, "Docker não está instalado"
    }
    
    try {
        $version = docker --version
        return $true, $version
    } catch {
        return $false, "Erro ao verificar Docker: $_"
    }
}

# Verifica se Git está disponível
function Test-GitInstalled {
    if (-not (Test-CommandExists "git")) {
        return $false, "Git não está instalado"
    }
    
    try {
        $version = git --version
        return $true, $version
    } catch {
        return $false, "Erro ao verificar Git: $_"
    }
}

# Verifica espaço em disco disponível
function Test-DiskSpace {
    param([int64]$MinSpaceMB = 2048)
    
    try {
        $drive = Get-PSDrive -Name $PWD.Drive.Name
        $availableMB = $drive.Free / 1MB
        
        if ($availableMB -lt $MinSpaceMB) {
            return $false, "$([math]::Round($availableMB, 2)) MB (mínimo: $MinSpaceMB MB)"
        }
        
        return $true, "$([math]::Round($availableMB, 2)) MB disponível"
    } catch {
        return $false, "Erro ao verificar espaço: $_"
    }
}

# Verifica arquivo .env
function Test-EnvFile {
    param([string]$Path)
    
    $envFile = Join-Path $Path ".env"
    $envExample = Join-Path $Path ".env.example"
    
    if (Test-Path $envFile) {
        return $true, ".env já existe"
    } elseif (Test-Path $envExample) {
        return $true, ".env.example encontrado (será copiado)"
    } else {
        return $false, "Nenhum .env ou .env.example encontrado"
    }
}

# Verifica se um diretório tem estrutura válida
function Test-DirectoryStructure {
    param(
        [string]$Path,
        [string[]]$RequiredDirs = @(),
        [string[]]$RequiredFiles = @()
    )
    
    if (-not (Test-Path $Path -PathType Container)) {
        return $false, "Diretório não existe: $Path"
    }
    
    foreach ($dir in $RequiredDirs) {
        $fullPath = Join-Path $Path $dir
        if (-not (Test-Path $fullPath -PathType Container)) {
            return $false, "Diretório ausente: $dir"
        }
    }
    
    foreach ($file in $RequiredFiles) {
        $fullPath = Join-Path $Path $file
        if (-not (Test-Path $fullPath -PathType Leaf)) {
            return $false, "Arquivo ausente: $file"
        }
    }
    
    return $true, "Estrutura OK"
}

# Executa validações com retry
function Invoke-WithRetry {
    param(
        [scriptblock]$Command,
        [int]$MaxAttempts = 3,
        [int]$DelaySeconds = 2
    )
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $result = & $Command
            return $result, $null
        } catch {
            if ($i -lt $MaxAttempts) {
                Start-Sleep -Seconds $DelaySeconds
            } else {
                return $null, $_.Exception.Message
            }
        }
    }
}

Export-ModuleMember -Function @(
    'Test-CommandExists',
    'Test-PythonVersion',
    'Test-NodeVersion',
    'Test-NpmVersion',
    'Test-DockerInstalled',
    'Test-GitInstalled',
    'Test-DiskSpace',
    'Test-EnvFile',
    'Test-DirectoryStructure',
    'Invoke-WithRetry'
)
