#!/bin/bash
# test_setup.sh (Linux)
# Valida e testa se o setup foi realizado corretamente

set -e
trap 'fail "Script foi interrompido"' INT TERM

# Importar funções utilitárias
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/logger.sh"
source "$SCRIPT_DIR/utils/validators.sh"

info "=== TESTE DE VALIDAÇÃO DO SETUP (LINUX) ==="
info "Data: $(date '+%Y-%m-%d %H:%M:%S')"

REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Rastrear resultados dos testes
declare -A test_results=()

# ==============================================================
# 1. VALIDAÇÕES GLOBAIS
# ==============================================================
info ""
info "🔍 Validações Globais"

if python_msg=$(test_python_version "3.8"); then
    test_results[Python]="OK:$python_msg"
    success "✓ Python: $python_msg"
else
    test_results[Python]="FAIL:$python_msg"
    echo -e "${RED}✗ Python: $python_msg${NC}"
fi

if node_msg=$(test_node_version "18.0.0"); then
    test_results[Node.js]="OK:$node_msg"
    success "✓ Node.js: $node_msg"
else
    test_results[Node.js]="FAIL:$node_msg"
    echo -e "${RED}✗ Node.js: $node_msg${NC}"
fi

if npm_msg=$(test_npm_version "9.0.0"); then
    test_results[npm]="OK:$npm_msg"
    success "✓ npm: $npm_msg"
else
    test_results[npm]="FAIL:$npm_msg"
    echo -e "${RED}✗ npm: $npm_msg${NC}"
fi

# ==============================================================
# 2. VALIDAÇÃO DO BACKEND
# ==============================================================
info ""
info "🔍 Validação do Backend"

BACKEND_DIR="$REPO_ROOT/backend/jubileu-api-fastapi"

if [ -d "$BACKEND_DIR" ]; then
    success "Diretório backend encontrado"
    
    # Verificar venv
    VENV_DIR="$BACKEND_DIR/.venv"
    if [ -d "$VENV_DIR" ]; then
        test_results[Backend_venv]="OK:.venv existe"
        success "✓ Ambiente virtual .venv"
    else
        test_results[Backend_venv]="FAIL:.venv não existe"
        echo -e "${RED}✗ Ambiente virtual .venv não encontrado${NC}"
    fi
    
    # Verificar .env
    if env_msg=$(test_env_file "$BACKEND_DIR"); then
        test_results[Backend_env]="OK:$env_msg"
        success "✓ Arquivo .env: $env_msg"
    else
        test_results[Backend_env]="FAIL:$env_msg"
        echo -e "${RED}✗ .env: $env_msg${NC}"
    fi
    
    # Verificar requirements.txt
    if [ -f "$BACKEND_DIR/requirements.txt" ]; then
        test_results[Backend_requirements]="OK:requirements.txt encontrado"
        success "✓ requirements.txt encontrado"
    else
        test_results[Backend_requirements]="FAIL:requirements.txt não encontrado"
        echo -e "${RED}✗ requirements.txt não encontrado${NC}"
    fi
    
    # Verificar alembic.ini
    if [ -f "$BACKEND_DIR/alembic.ini" ]; then
        test_results[Backend_alembic]="OK:alembic.ini encontrado"
        success "✓ alembic.ini encontrado"
    else
        test_results[Backend_alembic]="WARN:alembic.ini não encontrado"
        debug "ℹ alembic.ini não encontrado (pode ser intencional)"
    fi
else
    echo -e "${RED}✗ Diretório backend não encontrado: $BACKEND_DIR${NC}"
fi

# ==============================================================
# 3. VALIDAÇÃO DO FRONTEND
# ==============================================================
info ""
info "🔍 Validação do Frontend"

FRONTEND_DIR="$REPO_ROOT/frontend/jubileu-web"

if [ -d "$FRONTEND_DIR" ]; then
    success "Diretório frontend encontrado"
    
    # Verificar package.json
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        test_results[Frontend_package]="OK:package.json encontrado"
        success "✓ package.json encontrado"
    else
        test_results[Frontend_package]="FAIL:package.json não encontrado"
        echo -e "${RED}✗ package.json não encontrado${NC}"
    fi
    
    # Verificar node_modules
    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        test_results[Frontend_modules]="OK:node_modules instalado"
        success "✓ node_modules instalado"
    else
        test_results[Frontend_modules]="FAIL:node_modules não instalado"
        echo -e "${RED}✗ node_modules não encontrado (execute npm install)${NC}"
    fi
    
    # Verificar .env
    if env_msg=$(test_env_file "$FRONTEND_DIR"); then
        test_results[Frontend_env]="OK:$env_msg"
        success "✓ Arquivo .env: $env_msg"
    else
        test_results[Frontend_env]="FAIL:$env_msg"
        echo -e "${RED}✗ .env: $env_msg${NC}"
    fi
    
    # Verificar package-lock.json
    if [ -f "$FRONTEND_DIR/package-lock.json" ]; then
        test_results[Frontend_lock]="OK:package-lock.json encontrado"
        success "✓ package-lock.json encontrado"
    else
        test_results[Frontend_lock]="WARN:package-lock.json não encontrado"
        debug "ℹ package-lock.json não encontrado (recomenda-se fazer commit)"
    fi
else
    echo -e "${RED}✗ Diretório frontend não encontrado: $FRONTEND_DIR${NC}"
fi

# ==============================================================
# 4. VALIDAÇÃO DO DOCKER
# ==============================================================
info ""
info "🔍 Validação do Docker"

COMPOSE_PATH="$REPO_ROOT/docker-compose.yml"
if [ -f "$COMPOSE_PATH" ]; then
    success "docker-compose.yml encontrado"
    
    if docker_msg=$(test_docker_installed); then
        test_results[Docker]="OK:$docker_msg"
        success "✓ Docker: $docker_msg"
        
        # Verificar containers
        if containers=$(docker ps --quiet 2>/dev/null); then
            container_count=$(echo "$containers" | wc -l)
            if [ "$container_count" -gt 0 ]; then
                test_results[Docker_containers]="OK:$container_count container(s) em execução"
                success "✓ $container_count container(s) em execução"
            else
                debug "ℹ Nenhum container em execução"
            fi
        fi
    else
        test_results[Docker]="FAIL:$docker_msg"
        echo -e "${RED}✗ Docker não disponível: $docker_msg${NC}"
    fi
else
    debug "ℹ docker-compose.yml não encontrado"
fi

# ==============================================================
# 5. RESUMO E RELATÓRIO
# ==============================================================
info ""
info "╔════════════════════════════════════════╗"
info "║      RELATÓRIO DE VALIDAÇÃO            ║"
info "╚════════════════════════════════════════╝"

pass_count=0
fail_count=0
warn_count=0

for test_name in "${!test_results[@]}"; do
    result="${test_results[$test_name]}"
    status="${result%%:*}"
    message="${result#*:}"
    
    case $status in
        OK)
            echo -e "${GREEN}✅ $test_name${NC}"
            ((pass_count++))
            ;;
        FAIL)
            echo -e "${RED}❌ $test_name${NC}"
            echo -e "${RED}   → $message${NC}"
            ((fail_count++))
            ;;
        WARN)
            echo -e "${YELLOW}⚠️  $test_name${NC}"
            ((warn_count++))
            ;;
    esac
done

info ""
info "📊 Resultados:"
success "$pass_count testes passaram"
if [ "$fail_count" -gt 0 ]; then
    echo -e "${RED}$fail_count testes falharam${NC}"
fi
if [ "$warn_count" -gt 0 ]; then
    echo -e "${YELLOW}$warn_count avisos${NC}"
fi

info ""
info "📋 Log completo: $(get_log_file)"

# ==============================================================
# 6. RECOMENDAÇÕES
# ==============================================================
if [ "$fail_count" -eq 0 ]; then
    success ""
    success "✨ Tudo OK! Seu ambiente está pronto."
    info ""
    info "Você pode iniciar com:"
    info "  Backend:  cd ./backend/jubileu-api-fastapi"
    info "            source .venv/bin/activate"
    info "            python -m app.main"
    info ""
    info "  Frontend: cd ./frontend/jubileu-web"
    info "            npm run dev"
else
    warn ""
    warn "⚠️  Você tem $fail_count issue(s) para resolver"
    info ""
    info "Execute novamente após corrigir os issues:"
    info "  bash $(basename "$0")"
    exit 1
fi
