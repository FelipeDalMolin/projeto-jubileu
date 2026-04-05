#!/bin/bash
# setup_all_unified.sh
# Setup unificado que funciona em Windows (Git Bash), Linux e macOS

# Detectar sistema operacional
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "Linux";;
        Darwin*)    echo "macOS";;
        MINGW*)     echo "Windows";;
        MSYS*)      echo "Windows";;
        CYGWIN*)    echo "Windows";;
        *)          echo "Unknown";;
    esac
}

# Detectar shell
detect_shell() {
    case "$SHELL" in
        *bash)      echo "bash";;
        *zsh)       echo "zsh";;
        *sh)        echo "sh";;
        *pwsh)      echo "powershell";;
        *)          echo "unknown";;
    esac
}

OS=$(detect_os)
SHELL_TYPE=$(detect_shell)

echo "🔍 Ambiente Detectado:"
echo "   OS: $OS"
echo "   Shell: $SHELL_TYPE"
echo ""

# Se estiver em Windows e usar PowerShell, redirecionar para PS1
if [ "$OS" = "Windows" ] && [ "$SHELL_TYPE" = "powershell" ]; then
    echo "⚠️  Detectado PowerShell no Windows"
    echo "Redirecionando para setup_all_improved.ps1..."
    echo ""
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR" || exit 1
    
    # Se estiver em Git Bash, usar powershell.exe
    if command -v powershell.exe >/dev/null 2>&1; then
        powershell.exe -NoProfile -ExecutionPolicy Bypass -File "setup_all_improved.ps1"
    else
        pwsh -NoProfile -ExecutionPolicy Bypass -File "setup_all_improved.ps1"
    fi
    exit $?
fi

# Para Linux/macOS/Git Bash, usar shell scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Dar permissões executáveis
chmod +x "$SCRIPT_DIR/setup_all.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/setup_backend.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/setup_frontend.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/test_setup.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/utils/logger.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/utils/validators.sh" 2>/dev/null || true

# Executar setup completo
bash "$SCRIPT_DIR/setup_all.sh"
exit $?
