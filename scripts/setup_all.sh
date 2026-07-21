#!/bin/bash
# setup_all.sh (Linux)
# Orquestrador principal: Docker + Backend + Frontend

set -e
trap 'fail "Script foi interrompido"' INT TERM

# Importar funções utilitárias
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/logger.sh"
source "$SCRIPT_DIR/utils/validators.sh"

info "=== SETUP COMPLETO DO PROJETO (LINUX) ==="
info "Data: $(date '+%Y-%m-%d %H:%M:%S')"

REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Rastrear resultados
declare -A results=(
    [Docker]="PENDENTE"
    [Backend]="PENDENTE"
    [Frontend]="PENDENTE"
)

# 1. DOCKER COMPOSE
COMPOSE_PATH="$REPO_ROOT/compose.dev.yml"

if [ -f "$COMPOSE_PATH" ]; then
    info ""
    info "📦 Iniciando Docker Compose..."
    
    if docker_msg=$(test_docker_installed); then
        success "$docker_msg"
        
        cd "$REPO_ROOT"
        info "Executando runtime oficial compose.dev.yml"
        
        if "$REPO_ROOT/scripts/dev/up_dev.sh" >/dev/null 2>&1; then
            results[Docker]="OK"
            success "Docker Compose iniciado"
            
            info "Aguardando serviços ficarem prontos (15s)..."
            sleep 15
        else
            warn "Docker Compose retornou erro, mas continuando..."
            results[Docker]="ERRO"
        fi
    else
        warn "Docker não está disponível: $docker_msg"
        warn "Pulando Docker Compose..."
        results[Docker]="PULADO"
    fi
else
    warn "compose.dev.yml não encontrado; pulando Docker Compose"
    results[Docker]="PULADO"
fi

# 2. BACKEND
info ""
info "🐍 Configurando Backend..."

BACKEND_SCRIPT="$SCRIPT_DIR/setup_backend.sh"

if [ ! -f "$BACKEND_SCRIPT" ]; then
    fail "Script 'setup_backend.sh' não encontrado"
fi

if bash "$BACKEND_SCRIPT"; then
    results[Backend]="OK"
else
    warn "Erro ao executar setup_backend.sh"
    results[Backend]="ERRO"
fi

# 3. FRONTEND
info ""
info "⚛️  Configurando Frontend..."

FRONTEND_SCRIPT="$SCRIPT_DIR/setup_frontend.sh"

if [ ! -f "$FRONTEND_SCRIPT" ]; then
    fail "Script 'setup_frontend.sh' não encontrado"
fi

if bash "$FRONTEND_SCRIPT"; then
    results[Frontend]="OK"
else
    warn "Erro ao executar setup_frontend.sh"
    results[Frontend]="ERRO"
fi

# 4. RESUMO FINAL
info ""
info "╔════════════════════════════════════════╗"
info "║     RESUMO DO SETUP COMPLETO           ║"
info "╚════════════════════════════════════════╝"

has_errors=false

for component in "${!results[@]}"; do
    status="${results[$component]}"
    
    case $status in
        OK)
            echo -e "${GREEN}✅ $component : $status${NC}"
            ;;
        ERRO)
            echo -e "${RED}❌ $component : $status${NC}"
            has_errors=true
            ;;
        PULADO)
            echo -e "${YELLOW}⏭️  $component : $status${NC}"
            ;;
        *)
            echo -e "${GRAY}❓ $component : $status${NC}"
            ;;
    esac
done

info ""
info "📋 Log completo salvo em: $(get_log_file)"

if [ "$has_errors" = true ]; then
    warn ""
    warn "⚠️  Alguns componentes tiveram erros. Verifique o log acima."
    exit 1
else
    success ""
    success "✨ Setup completo concluído com sucesso!"
    info ""
    info "Próximos passos:"
    info "  1. Backend:  cd backend/jubileu-api-fastapi && source .venv/bin/activate && python -m app.main"
    info "  2. Frontend: cd frontend/jubileu-web && npm run dev"
    info "  3. Testar: bash scripts/test_setup.sh"
fi
