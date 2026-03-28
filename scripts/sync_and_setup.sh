#!/bin/bash
# sync_and_setup.sh (Linux)
# Git sync + setup completo

set -e
trap 'fail "Script foi interrompido"' INT TERM

# Importar funções utilitárias
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/logger.sh"
source "$SCRIPT_DIR/utils/validators.sh"

info "=== SYNC E SETUP (LINUX) ==="

REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

# 1. Verificar Git
if ! git_msg=$(test_git_installed); then
    fail "Git não está disponível: $git_msg"
fi
success "$git_msg"

# 2. Verificar status do Git
info "Verificando status do Git..."
if [ -n "$(git status --porcelain)" ]; then
    warn "Há alterações locais não commitadas"
    warn "O pull pode falhar se houver conflito"
    warn "Sugestão: faça commit ou use 'git stash' antes de rodar novamente"
    git status
fi

# 3. Fetch
info "Atualizando refs remotas (git fetch --all --prune)..."
git fetch --all --prune

# 4. Definir branch
BRANCH_CANDIDATES=("jubileuv2" "jubileu-v2" "main" "master")
TARGET_BRANCH=""

for candidate in "${BRANCH_CANDIDATES[@]}"; do
    if git show-ref --verify --quiet "refs/heads/$candidate" 2>/dev/null || \
       git ls-remote --exit-code --heads origin "$candidate" >/dev/null 2>&1; then
        TARGET_BRANCH="$candidate"
        break
    fi
done

if [ -z "$TARGET_BRANCH" ]; then
    fail "Nenhuma branch esperada encontrada (jubileuv2/jubileu-v2/main/master)"
fi

# 5. Trocar/Criar branch
if git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH" 2>/dev/null; then
    info "Trocando para a branch '$TARGET_BRANCH'..."
    git switch "$TARGET_BRANCH"
elif git ls-remote --exit-code --heads origin "$TARGET_BRANCH" >/dev/null 2>&1; then
    info "Criando branch local '$TARGET_BRANCH' a partir de origin/$TARGET_BRANCH..."
    git switch -c "$TARGET_BRANCH" --track "origin/$TARGET_BRANCH"
else
    fail "Branch '$TARGET_BRANCH' não encontrada"
fi

# 6. Configurar upstream
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)
if [ -z "$UPSTREAM" ]; then
    info "Configurando upstream para origin/$TARGET_BRANCH..."
    git branch --set-upstream-to="origin/$TARGET_BRANCH" "$TARGET_BRANCH"
fi

# 7. Pull com rebase
info "Aplicando atualizações da branch (git pull --rebase)..."
git pull --rebase

# 8. Executar setup completo
SETUP_ALL="$SCRIPT_DIR/setup_all.sh"
if [ ! -f "$SETUP_ALL" ]; then
    fail "Script setup_all.sh não encontrado em $SETUP_ALL"
fi

info ""
info "Executando setup completo..."
bash "$SETUP_ALL"

exit $?
