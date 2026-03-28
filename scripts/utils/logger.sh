#!/bin/bash
# logger.sh
# Funções de logging e utilidades comuns para scripts de setup (Linux)

set -o pipefail

# Diretório de logs
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/../logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/setup-$(date +%Y%m%d-%H%M%S).log"

# Iniciar log
echo "=== Setup Log Started: $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG_FILE"

# Cores ANSI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Função para logging
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%H:%M:%S')
    
    case $level in
        INFO)
            echo -e "${CYAN}[$timestamp] [INFO]${NC} $message"
            ;;
        SUCCESS)
            echo -e "${GREEN}[$timestamp] [SUCCESS]${NC} $message"
            ;;
        WARN)
            echo -e "${YELLOW}[$timestamp] [WARN]${NC} $message"
            ;;
        ERROR)
            echo -e "${RED}[$timestamp] [ERROR]${NC} $message"
            ;;
        DEBUG)
            echo -e "${GRAY}[$timestamp] [DEBUG]${NC} $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Funções de conveniência
info()    { log_message "INFO" "$1"; }
success() { log_message "SUCCESS" "$1"; }
warn()    { log_message "WARN" "$1"; }
error()   { log_message "ERROR" "$1"; }
debug()   { log_message "DEBUG" "$1"; }

fail() {
    error "$1"
    echo "=== Setup Log FAILED at: $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG_FILE"
    exit 1
}

get_log_file() {
    echo "$LOG_FILE"
}

# Exportar funções
export -f info success warn error debug fail get_log_file log_message
export LOG_FILE
