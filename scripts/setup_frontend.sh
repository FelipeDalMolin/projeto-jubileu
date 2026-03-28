#!/bin/bash
# setup_frontend.sh (Linux)
# Configura frontend React/Vite com validações robustas

set -e
trap 'fail "Script foi interrompido"' INT TERM

# Importar funções utilitárias
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/logger.sh"
source "$SCRIPT_DIR/utils/validators.sh"

info "=== SETUP FRONTEND REACT/VITE (LINUX) ==="

# 1. Validação de Pré-requisitos
info "Verificando pré-requisitos..."

if ! node_msg=$(test_node_version "18.0.0"); then
    fail "Node.js não está disponível ou versão inadequada: $node_msg"
fi
success "$node_msg"

if ! npm_msg=$(test_npm_version "9.0.0"); then
    fail "npm não está disponível ou versão inadequada: $npm_msg"
fi
success "$npm_msg"

if disk_msg=$(test_disk_space 1024); then
    debug "Espaço em disco: $disk_msg"
else
    warn "Espaço em disco baixo: $disk_msg"
fi

# 2. Definir caminhos
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend/jubileu-web"

info "Caminho do frontend: $FRONTEND_DIR"

if [ ! -d "$FRONTEND_DIR" ]; then
    fail "Frontend não encontrado em $FRONTEND_DIR"
fi

# 3. Validar estrutura
PACKAGE_JSON="$FRONTEND_DIR/package.json"
if [ ! -f "$PACKAGE_JSON" ]; then
    fail "package.json não encontrado em $FRONTEND_DIR"
fi
success "package.json encontrado"

cd "$FRONTEND_DIR"

# 4. Configurar .env
info "Configurando arquivo .env..."
ENV_EXAMPLE="$FRONTEND_DIR/.env.example"
ENV_FILE="$FRONTEND_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        info "Copiando .env a partir de .env.example..."
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        success ".env criado"
    else
        warn ".env.example não encontrado - você pode precisar configurar .env manualmente"
    fi
else
    debug ".env já existe"
fi

# 5. Verificar node_modules
info "Verificando dependências..."
NODE_MODULES="$FRONTEND_DIR/node_modules"
if [ -d "$NODE_MODULES" ]; then
    debug "node_modules já existe"
else
    info "node_modules não existe, será criado durante npm install"
fi

# 6. Instalar dependências
info "Instalando dependências (npm install)..."
debug "Executando: npm install"

if npm install; then
    success "Dependências instaladas com sucesso"
else
    fail "Erro ao instalar dependências npm"
fi

# 7. Validar instalação
if [ -d "$NODE_MODULES" ]; then
    local count=$(find "$NODE_MODULES" -maxdepth 1 -type d | wc -l)
    debug "node_modules com ~$count diretórios"
fi

# 8. Verificar se há lockfile
PACKAGE_LOCK="$FRONTEND_DIR/package-lock.json"
if [ -f "$PACKAGE_LOCK" ]; then
    success "package-lock.json encontrado (reprodutibilidade garantida)"
else
    warn "package-lock.json não encontrado - considere fazer commit"
fi

# 9. Testar build (opcional)
if [ -f "$PACKAGE_JSON" ] && grep -q '"build"' "$PACKAGE_JSON"; then
    info "Testando build Vite..."
    debug "Executando: npm run build"
    if npm run build >/dev/null 2>&1; then
        success "Build Vite completado com sucesso"
    else
        warn "Build Vite teve avisos/erros, mas pode estar OK"
    fi
fi

# 10. Resumo final
info ""
success "=== SETUP FRONTEND COMPLETO ==="
info "Próximos passos:"
info "  1. Configure as variáveis de ambiente em .env"
info "  2. Inicie o dev server com: npm run dev"
info "  3. Acesse em http://localhost:5173 (padrão Vite)"

info ""
info "Log salvo em: $(get_log_file)"
