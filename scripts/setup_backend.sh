#!/bin/bash
# setup_backend.sh (Linux)
# Configura backend FastAPI com validações robustas

set -e
trap 'fail "Script foi interrompido"' INT TERM

# Importar funções utilitárias
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/logger.sh"
source "$SCRIPT_DIR/utils/validators.sh"

info "=== SETUP BACKEND FASTAPI (LINUX) ==="

# 1. Validação de Pré-requisitos
info "Verificando pré-requisitos..."

if ! python_msg=$(test_python_version "3.8"); then
    fail "Python não está disponível: $python_msg"
fi
success "$python_msg"

if git_msg=$(test_git_installed); then
    success "$git_msg"
else
    warn "Git não está disponível"
fi

if disk_msg=$(test_disk_space 1024); then
    debug "Espaço em disco: $disk_msg"
else
    warn "Espaço em disco baixo: $disk_msg"
fi

# 2. Definir caminhos
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend/jubileu-api-fastapi"

info "Caminho do backend: $BACKEND_DIR"

if [ ! -d "$BACKEND_DIR" ]; then
    fail "Backend não encontrado em $BACKEND_DIR"
fi

# 3. Verificar estrutura
REQ_FILE="$BACKEND_DIR/requirements.txt"
ALEMBIC_INI="$BACKEND_DIR/alembic.ini"

if [ ! -f "$REQ_FILE" ]; then
    warn "requirements.txt não encontrado"
fi
if [ ! -f "$ALEMBIC_INI" ]; then
    warn "alembic.ini não encontrado - migrations serão puladas"
fi

cd "$BACKEND_DIR"

# 4. Configurar .env
info "Configurando arquivo .env..."
ENV_EXAMPLE="$BACKEND_DIR/.env.example"
ENV_FILE="$BACKEND_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        info "Copiando .env a partir de .env.example..."
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        success ".env criado"
    else
        warn ".env.example não encontrado - você precisará configurar .env manualmente"
    fi
else
    debug ".env já existe"
fi

# 5. Criar / Validar ambiente virtual
info "Configurando ambiente virtual Python..."
VENV_DIR="$BACKEND_DIR/.venv"

if [ ! -d "$VENV_DIR" ]; then
    info "Criando ambiente virtual em $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
    success "Ambiente virtual criado"
else
    debug "Ambiente virtual já existe"
fi

# Validar activate
ACTIVATE="$VENV_DIR/bin/activate"
if [ ! -f "$ACTIVATE" ]; then
    fail "Activate não encontrado em $ACTIVATE"
fi

# 6. Ativar venv e instalar dependências
info "Ativando ambiente virtual..."
source "$ACTIVATE"
success "Ambiente virtual ativado"

if [ -f "$REQ_FILE" ]; then
    info "Instalando dependências (requirements.txt)..."
    
    debug "Atualizando pip..."
    if python -m pip install --upgrade pip >/dev/null 2>&1; then
        success "pip atualizado"
    else
        warn "Aviso ao atualizar pip"
    fi
    
    debug "Instalando pacotes de requirements.txt..."
    if pip install -r "$REQ_FILE"; then
        success "Dependências instaladas"
    else
        fail "Erro ao instalar dependências"
    fi
else
    warn "requirements.txt não encontrado - pulando instalação de dependências"
fi

# 7. Executar migrations
if [ -f "$ALEMBIC_INI" ]; then
    info "Executando migrations (alembic upgrade head)..."
    
    if alembic upgrade head 2>/dev/null; then
        success "Migrations executadas com sucesso"
    else
        warn "Erro potencial ao executar migrations"
        warn "Certifique-se de que a bancada de dados está rodando"
    fi
else
    debug "alembic.ini não encontrado - pulando migrations"
fi

# 8. Resumo final
info ""
success "=== SETUP BACKEND COMPLETO ==="
info "Próximos passos:"
info "  1. Configure as variáveis de ambiente em .env"
info "  2. Inicie a API com: python -m app.main"
info "  3. Ou use: uvicorn app.main:app --reload"

info ""
info "Log salvo em: $(get_log_file)"
