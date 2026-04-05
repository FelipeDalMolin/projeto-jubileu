#!/bin/bash
# validators.sh
# Funções de validação de pré-requisitos e ambiente (Linux)

# Verifica se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verifica versão do Python
test_python_version() {
    local min_version="${1:-3.8}"
    
    if ! command_exists python3; then
        return 1
    fi
    
    local version=$(python3 --version 2>&1 | awk '{print $2}')
    local min_ver_num=$(echo "$min_version" | tr '.' ' ' | awk '{printf "%d%d%d", $1, $2, $3}')
    local ver_num=$(echo "$version" | tr '.' ' ' | awk '{printf "%d%d%d", $1, $2, $3}')
    
    if [ "$ver_num" -lt "$min_ver_num" ]; then
        echo "Python $version (mínimo: $min_version)"
        return 1
    fi
    
    echo "Python $version"
    return 0
}

# Verifica versão do Node.js
test_node_version() {
    local min_version="${1:-18.0.0}"
    
    if ! command_exists node; then
        echo "Node.js não está instalado"
        return 1
    fi
    
    local version=$(node --version 2>&1 | sed 's/v//')
    local min_ver_num=$(echo "$min_version" | tr '.' ' ' | awk '{printf "%d%d%d", $1, $2, $3}')
    local ver_num=$(echo "$version" | tr '.' ' ' | awk '{printf "%d%d%d", $1, $2, $3}')
    
    if [ "$ver_num" -lt "$min_ver_num" ]; then
        echo "Node.js $version (mínimo: $min_version)"
        return 1
    fi
    
    echo "Node.js $version"
    return 0
}

# Verifica versão do npm
test_npm_version() {
    local min_version="${1:-9.0.0}"
    
    if ! command_exists npm; then
        echo "npm não está instalado"
        return 1
    fi
    
    local version=$(npm --version 2>&1)
    local min_ver_num=$(echo "$min_version" | tr '.' ' ' | awk '{printf "%d%d%d", $1, $2, $3}')
    local ver_num=$(echo "$version" | tr '.' ' ' | awk '{printf "%d%d%d", $1, $2, $3}')
    
    if [ "$ver_num" -lt "$min_ver_num" ]; then
        echo "npm $version (mínimo: $min_version)"
        return 1
    fi
    
    echo "npm $version"
    return 0
}

# Verifica se Docker está instalado
test_docker_installed() {
    if ! command_exists docker; then
        echo "Docker não está instalado"
        return 1
    fi
    
    local version=$(docker --version 2>&1)
    echo "$version"
    return 0
}

# Verifica se Git está disponível
test_git_installed() {
    if ! command_exists git; then
        echo "Git não está instalado"
        return 1
    fi
    
    local version=$(git --version 2>&1)
    echo "$version"
    return 0
}

# Verifica espaço em disco disponível (em MB)
test_disk_space() {
    local min_space_mb="${1:-2048}"
    
    local available_kb=$(df . | awk 'NR==2 {print $4}')
    local available_mb=$((available_kb / 1024))
    
    if [ "$available_mb" -lt "$min_space_mb" ]; then
        echo "$available_mb MB (mínimo: $min_space_mb MB)"
        return 1
    fi
    
    echo "$available_mb MB disponível"
    return 0
}

# Verifica arquivo .env
test_env_file() {
    local path="$1"
    local env_file="$path/.env"
    local env_example="$path/.env.example"
    
    if [ -f "$env_file" ]; then
        echo ".env já existe"
        return 0
    elif [ -f "$env_example" ]; then
        echo ".env.example encontrado (será copiado)"
        return 0
    else
        echo "Nenhum .env ou .env.example encontrado"
        return 1
    fi
}

# Verifica estrutura de diretório
test_directory_structure() {
    local path="$1"
    shift
    local required_dirs=("$@")
    
    if [ ! -d "$path" ]; then
        echo "Diretório não existe: $path"
        return 1
    fi
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$path/$dir" ]; then
            echo "Diretório ausente: $dir"
            return 1
        fi
    done
    
    echo "Estrutura OK"
    return 0
}

# Executa comando com retry
invoke_with_retry() {
    local max_attempts="${1:-3}"
    local delay_seconds="${2:-2}"
    shift 2
    local cmd=("$@")
    
    for ((i = 1; i <= max_attempts; i++)); do
        if "${cmd[@]}"; then
            return 0
        fi
        
        if [ "$i" -lt "$max_attempts" ]; then
            sleep "$delay_seconds"
        fi
    done
    
    return 1
}

# Exportar funções
export -f command_exists test_python_version test_node_version test_npm_version
export -f test_docker_installed test_git_installed test_disk_space test_env_file
export -f test_directory_structure invoke_with_retry
