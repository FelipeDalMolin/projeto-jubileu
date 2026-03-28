# SETUP_SCRIPTS_COMPARISON.md
# Comparação Completa: Windows PowerShell vs Linux Bash

## 📋 Visão Geral

Você agora tem **dois conjuntos de scripts**:
- **Windows**: PowerShell (`.ps1`)
- **Linux/macOS**: Bash (`.sh`)

Ambos fazem a mesma coisa, mas adaptados para cada SO.

---

## 🎯 Qual Usar?

### Windows (Powershell 5.1+)
```powershell
# Setup completo
.\scripts\setup_all_improved.ps1

# Backend
.\scripts\setup_backend_improved.ps1

# Frontend
.\scripts\setup_frontend_improved.ps1

# Teste
.\scripts\test_setup.ps1
```

### Linux / macOS / Git Bash
```bash
# Setup completo
bash scripts/setup_all.sh

# Backend
bash scripts/setup_backend.sh

# Frontend
bash scripts/setup_frontend.sh

# Teste
bash scripts/test_setup.sh
```

### Auto-Detectar (Qualquer SO)
```bash
bash scripts/setup.sh              # Linux/macOS/Git Bash
# OU
.\scripts\setup.sh                 # Windows PowerShell
```

---

## 📁 Estrutura de Arquivos

### Windows (PowerShell)
```
scripts/
├── setup_all_improved.ps1
├── setup_backend_improved.ps1
├── setup_frontend_improved.ps1
├── setup_backend_structure.ps1
├── sync_and_setup.ps1
├── test_setup.ps1
├── utils/
│   ├── logger.ps1
│   └── validators.ps1
├── SETUP_README.md
└── logs/
    ├── setup-20260328-143015.log
    └── setup-20260328-150230.log
```

### Linux/macOS (Bash)
```
scripts/
├── setup_all.sh
├── setup_backend.sh
├── setup_frontend.sh
├── setup.sh (auto-detect)
├── sync_and_setup.sh
├── test_setup.sh
├── utils/
│   ├── logger.sh
│   └── validators.sh
├── SETUP_LINUX.md
└── logs/
    ├── setup-20260328-143015.log
    └── setup-20260328-150230.log
```

---

## 🔄 Mapeamento de Funcionalidades

| Funcionalidade | Windows (PS1) | Linux (SH) | Notas |
|---|---|---|---|
| **Setup Completo** | ✅ `setup_all_improved.ps1` | ✅ `setup_all.sh` | Idênticas |
| **Setup Backend** | ✅ `setup_backend_improved.ps1` | ✅ `setup_backend.sh` | Idênticas |
| **Setup Frontend** | ✅ `setup_frontend_improved.ps1` | ✅ `setup_frontend.sh` | Idênticas |
| **Teste Setup** | ✅ `test_setup.ps1` | ✅ `test_setup.sh` | Idênticas |
| **Logging** | ✅ `logger.ps1` | ✅ `logger.sh` | Mesma lógica |
| **Validação** | ✅ `validators.ps1` | ✅ `validators.sh` | Mesma lógica |
| **Git Sync** | ✅ `sync_and_setup.ps1` | ✅ `sync_and_setup.sh` | Idênticas |
| **Auto-Detect** | ❌ | ✅ `setup.sh` | Scripts podem se chamar |

---

## 🔧 Diferenças Técnicas

### 1. Linguagem
```
Windows: PowerShell (cmdlet-based)
Linux:   Bash + POSIX shell (command-based)
```

### 2. Caminhos
```powershell
# Windows
$BACKEND_DIR = Join-Path $REPO_ROOT "backend\jubileu-api-fastapi"
```

```bash
# Linux
BACKEND_DIR="$REPO_ROOT/backend/jubileu-api-fastapi"
```

### 3. Ativar venv
```powershell
# Windows
. $activate  # ou & $activate
```

```bash
# Linux
source $activate
```

### 4. Cores no Log
```powershell
# Windows (names)
-ForegroundColor Cyan, Green, Yellow, Red
```

```bash
# Linux (ANSI codes)
\033[0;36m (cyan)
\033[0;32m (green)
\033[1;33m (yellow)
\033[0;31m (red)
```

### 5. Error Handling
```powershell
# Windows
$ErrorActionPreference = "Stop"
try { ... } catch { ... }
```

```bash
# Linux
set -e
trap 'fail "..."' INT TERM
```

---

## 📊 Tempo de Execução

Ambos têm tempos similares:

```
┌──────────────────┬────────────┬──────────────┐
│ Componente       │ Windows    │ Linux/macOS  │
├──────────────────┼────────────┼──────────────┤
│ Docker Compose   │ 10-20s     │ 10-20s       │
│ Python venv      │ 5-10s      │ 5-10s        │
│ pip install      │ 10-30s     │ 10-30s       │
│ alembic upgrade  │ 5-15s      │ 5-15s        │
│ npm install      │ 30-60s     │ 30-60s       │
│ TOTAL            │ 2-3 min    │ 2-3 min      │
└──────────────────┴────────────┴──────────────┘
```

---

## 🖥️ Executando em Diferentes Ambientes

### Windows 10/11 (PowerShell)
```powershell
cd C:\Projetos\projeto-jubileu
.\scripts\setup_all_improved.ps1
```

### Windows 10/11 (Git Bash)
```bash
cd /c/Projetos/projeto-jubileu
bash scripts/setup_all.sh
```

### Windows 10/11 (WSL2 - Ubuntu)
```bash
$ cd ~/projeto-jubileu
$ bash scripts/setup_all.sh
```

### Ubuntu/Debian/Linux
```bash
$ cd ~/projeto-jubileu
$ bash scripts/setup_all.sh
```

### macOS (Bash)
```bash
$ cd ~/projeto-jubileu
$ bash scripts/setup_all.sh
```

---

## 🔐 Segurança e Permissões

### Windows (PowerShell)
```powershell
# Verificar política de execução
Get-ExecutionPolicy

# Permitir scripts (temporário)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force

# Restaurar
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### Linux/macOS (Bash)
```bash
# Dar permissões executáveis
chmod +x scripts/*.sh
chmod +x scripts/utils/*.sh

# Verificar permissões
ls -la scripts/

# Executar com sudo (se necessário)
sudo bash scripts/setup_all.sh
```

---

## 📝 Logging Equivalente

### Windows
```powershell
Get-Content ".\logs\setup-20260328-143015.log" -Tail 50
Get-Content ".\logs\setup-20260328-143015.log" -Wait  # Follow
```

### Linux
```bash
tail -n 50 logs/setup-20260328-143015.log
tail -f logs/setup-20260328-143015.log  # Follow
```

---

## 🐛 Debugging

### Windows
```powershell
# Ver todas as variáveis
Get-Variable

# Debug mode
Set-PSDebug -Trace 1

# Remover debug
Set-PSDebug -Trace 0
```

### Linux
```bash
# Ver variáveis exportadas
export

# Debug mode
set -x

# Remover debug
set +x

# Ver o que vai ser executado
bash -n script.sh
```

---

## 🔄 Migrando Entre Plataformas

### De Windows para Linux
```bash
# No Linux
cd ~/projeto-jubileu
bash scripts/setup_all.sh  # Usa versão Linux

# Ou detecta automaticamente
bash scripts/setup.sh
```

### De Linux para Windows
```powershell
# No Windows
cd C:\Projetos\projeto-jubileu
.\scripts\setup_all_improved.ps1  # Usa versão PowerShell

# Ou detecta automaticamente
.\scripts\setup.sh
```

### WSL2 (Melhor de ambos)
```bash
# In WSL2 (Ubuntu)
cd ~/projeto-jubileu
bash scripts/setup_all.sh  # Usa version Linux nativa

# Mais rápido que Windows PowerShell
# Melhor compatibilidade que Git Bash
```

---

## ✅ Checklist de Compatibilidade

### Windows (PowerShell 5.1)
- [ ] PowerShell 5.1 ou superior
- [ ] ExecutionPolicy permite scripts
- [ ] Python 3.8+ instalado
- [ ] Node.js 18+ instalado
- [ ] Docker Desktop (opcional)
- [ ] Git para Windows (opcional)

### Linux (Ubuntu 20.04+)
- [ ] Bash 4.0+ disponível
- [ ] Python 3.8+ instalado
- [ ] Node.js 18+ instalado
- [ ] Docker + Docker Compose (opcional)
- [ ] Git instalado (opcional)

### macOS (10.15+)
- [ ] Bash ou Zsh disponível
- [ ] Python 3.8+ instalado (via homebrew)
- [ ] Node.js 18+ instalado (via homebrew)
- [ ] Docker Desktop (opcional)
- [ ] Git (via Xcode Command Line Tools)

---

## 🚀 Recomendações por Ambiente

### Para Desenvolvimento Local (Recomendação)

**Windows:**
```
❌ PowerShell (lento)
❌ Git Bash (compatibilidade limitada)
✅ WSL2 + Ubuntu (melhor experiência)
```

**macOS:**
```
✅ Bash nativo ou Zsh
✅ Homebrew para packages
```

**Linux:**
```
✅ Bash nativo
✅ apt/dnf/pacman conforme distro
```

### Para CI/CD (GitHub Actions, etc)

```yaml
# Sempre use Bash para CI/CD
matrix:
  os: [ubuntu-latest, macos-latest, windows-latest]
  
jobs:
  setup:
    runs-on: ${{ matrix.os }}
    steps:
      - run: bash scripts/setup_all.sh  # Mesmo em Windows CI
```

---

## 📋 Tabela de Referência Rápida

| Ação | Windows PS1 | Linux Bash |
|------|------------|-----------|
| Setup completo | `.\scripts\setup_all_improved.ps1` | `bash scripts/setup_all.sh` |
| Backend | `.\scripts\setup_backend_improved.ps1` | `bash scripts/setup_backend.sh` |
| Frontend | `.\scripts\setup_frontend_improved.ps1` | `bash scripts/setup_frontend.sh` |
| Teste | `.\scripts\test_setup.ps1` | `bash scripts/test_setup.sh` |
| Ver logs | `Get-Content .\logs\setup-*.log` | `tail logs/setup-*.log` |
| Ativar venv | `.\.venv\Scripts\Activate.ps1` | `source .venv/bin/activate` |
| Backend start | `python -m app.main` | `python -m app.main` |
| Frontend start | `npm run dev` | `npm run dev` |

---

## 🎓 Conclusão

### Use PowerShell se:
- Está em Windows nativo
- Quer experiência native
- Não pode usar WSL2

### Use Bash se:
- Está em Linux ou macOS
- Está em WSL2
- Quer compatibilidade multi-plataforma

### Use Auto-Detect se:
- Quer um script que funcione em qualquer lugar
- Não quer pensar qual versão executar

---

**Ambas as implementações são equivalentes e mantidas em sincronia.**  
**Escolha a que quiser - resultado será o mesmo! ✨**
