> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# SETUP_SCRIPTS_COMPARISON.md
# ComparaÃ§Ã£o Completa: Windows PowerShell vs Linux Bash

## ðŸ“‹ VisÃ£o Geral

VocÃª agora tem **dois conjuntos de scripts**:
- **Windows**: PowerShell (`.ps1`)
- **Linux/macOS**: Bash (`.sh`)

Ambos fazem a mesma coisa, mas adaptados para cada SO.

---

## ðŸŽ¯ Qual Usar?

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

## ðŸ“ Estrutura de Arquivos

### Windows (PowerShell)
```
scripts/
â”œâ”€â”€ setup_all_improved.ps1
â”œâ”€â”€ setup_backend_improved.ps1
â”œâ”€â”€ setup_frontend_improved.ps1
â”œâ”€â”€ setup_backend_structure.ps1
â”œâ”€â”€ sync_and_setup.ps1
â”œâ”€â”€ test_setup.ps1
â”œâ”€â”€ utils/
â”‚   â”œâ”€â”€ logger.ps1
â”‚   â””â”€â”€ validators.ps1
â”œâ”€â”€ SETUP_README.md
â””â”€â”€ logs/
    â”œâ”€â”€ setup-20260328-143015.log
    â””â”€â”€ setup-20260328-150230.log
```

### Linux/macOS (Bash)
```
scripts/
â”œâ”€â”€ setup_all.sh
â”œâ”€â”€ setup_backend.sh
â”œâ”€â”€ setup_frontend.sh
â”œâ”€â”€ setup.sh (auto-detect)
â”œâ”€â”€ sync_and_setup.sh
â”œâ”€â”€ test_setup.sh
â”œâ”€â”€ utils/
â”‚   â”œâ”€â”€ logger.sh
â”‚   â””â”€â”€ validators.sh
â”œâ”€â”€ SETUP_LINUX.md
â””â”€â”€ logs/
    â”œâ”€â”€ setup-20260328-143015.log
    â””â”€â”€ setup-20260328-150230.log
```

---

## ðŸ”„ Mapeamento de Funcionalidades

| Funcionalidade | Windows (PS1) | Linux (SH) | Notas |
|---|---|---|---|
| **Setup Completo** | âœ… `setup_all_improved.ps1` | âœ… `setup_all.sh` | IdÃªnticas |
| **Setup Backend** | âœ… `setup_backend_improved.ps1` | âœ… `setup_backend.sh` | IdÃªnticas |
| **Setup Frontend** | âœ… `setup_frontend_improved.ps1` | âœ… `setup_frontend.sh` | IdÃªnticas |
| **Teste Setup** | âœ… `test_setup.ps1` | âœ… `test_setup.sh` | IdÃªnticas |
| **Logging** | âœ… `logger.ps1` | âœ… `logger.sh` | Mesma lÃ³gica |
| **ValidaÃ§Ã£o** | âœ… `validators.ps1` | âœ… `validators.sh` | Mesma lÃ³gica |
| **Git Sync** | âœ… `sync_and_setup.ps1` | âœ… `sync_and_setup.sh` | IdÃªnticas |
| **Auto-Detect** | âŒ | âœ… `setup.sh` | Scripts podem se chamar |

---

## ðŸ”§ DiferenÃ§as TÃ©cnicas

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

## ðŸ“Š Tempo de ExecuÃ§Ã£o

Ambos tÃªm tempos similares:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Componente       â”‚ Windows    â”‚ Linux/macOS  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Docker Compose   â”‚ 10-20s     â”‚ 10-20s       â”‚
â”‚ Python venv      â”‚ 5-10s      â”‚ 5-10s        â”‚
â”‚ pip install      â”‚ 10-30s     â”‚ 10-30s       â”‚
â”‚ alembic upgrade  â”‚ 5-15s      â”‚ 5-15s        â”‚
â”‚ npm install      â”‚ 30-60s     â”‚ 30-60s       â”‚
â”‚ TOTAL            â”‚ 2-3 min    â”‚ 2-3 min      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸ–¥ï¸ Executando em Diferentes Ambientes

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

## ðŸ” SeguranÃ§a e PermissÃµes

### Windows (PowerShell)
```powershell
# Verificar polÃ­tica de execuÃ§Ã£o
Get-ExecutionPolicy

# Permitir scripts (temporÃ¡rio)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force

# Restaurar
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### Linux/macOS (Bash)
```bash
# Dar permissÃµes executÃ¡veis
chmod +x scripts/*.sh
chmod +x scripts/utils/*.sh

# Verificar permissÃµes
ls -la scripts/

# Executar com sudo (se necessÃ¡rio)
sudo bash scripts/setup_all.sh
```

---

## ðŸ“ Logging Equivalente

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

## ðŸ› Debugging

### Windows
```powershell
# Ver todas as variÃ¡veis
Get-Variable

# Debug mode
Set-PSDebug -Trace 1

# Remover debug
Set-PSDebug -Trace 0
```

### Linux
```bash
# Ver variÃ¡veis exportadas
export

# Debug mode
set -x

# Remover debug
set +x

# Ver o que vai ser executado
bash -n script.sh
```

---

## ðŸ”„ Migrando Entre Plataformas

### De Windows para Linux
```bash
# No Linux
cd ~/projeto-jubileu
bash scripts/setup_all.sh  # Usa versÃ£o Linux

# Ou detecta automaticamente
bash scripts/setup.sh
```

### De Linux para Windows
```powershell
# No Windows
cd C:\Projetos\projeto-jubileu
.\scripts\setup_all_improved.ps1  # Usa versÃ£o PowerShell

# Ou detecta automaticamente
.\scripts\setup.sh
```

### WSL2 (Melhor de ambos)
```bash
# In WSL2 (Ubuntu)
cd ~/projeto-jubileu
bash scripts/setup_all.sh  # Usa version Linux nativa

# Mais rÃ¡pido que Windows PowerShell
# Melhor compatibilidade que Git Bash
```

---

## âœ… Checklist de Compatibilidade

### Windows (PowerShell 5.1)
- [ ] PowerShell 5.1 ou superior
- [ ] ExecutionPolicy permite scripts
- [ ] Python 3.8+ instalado
- [ ] Node.js 18+ instalado
- [ ] Docker Desktop (opcional)
- [ ] Git para Windows (opcional)

### Linux (Ubuntu 20.04+)
- [ ] Bash 4.0+ disponÃ­vel
- [ ] Python 3.8+ instalado
- [ ] Node.js 18+ instalado
- [ ] Docker + Docker Compose (opcional)
- [ ] Git instalado (opcional)

### macOS (10.15+)
- [ ] Bash ou Zsh disponÃ­vel
- [ ] Python 3.8+ instalado (via homebrew)
- [ ] Node.js 18+ instalado (via homebrew)
- [ ] Docker Desktop (opcional)
- [ ] Git (via Xcode Command Line Tools)

---

## ðŸš€ RecomendaÃ§Ãµes por Ambiente

### Para Desenvolvimento Local (RecomendaÃ§Ã£o)

**Windows:**
```
âŒ PowerShell (lento)
âŒ Git Bash (compatibilidade limitada)
âœ… WSL2 + Ubuntu (melhor experiÃªncia)
```

**macOS:**
```
âœ… Bash nativo ou Zsh
âœ… Homebrew para packages
```

**Linux:**
```
âœ… Bash nativo
âœ… apt/dnf/pacman conforme distro
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

## ðŸ“‹ Tabela de ReferÃªncia RÃ¡pida

| AÃ§Ã£o | Windows PS1 | Linux Bash |
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

## ðŸŽ“ ConclusÃ£o

### Use PowerShell se:
- EstÃ¡ em Windows nativo
- Quer experiÃªncia native
- NÃ£o pode usar WSL2

### Use Bash se:
- EstÃ¡ em Linux ou macOS
- EstÃ¡ em WSL2
- Quer compatibilidade multi-plataforma

### Use Auto-Detect se:
- Quer um script que funcione em qualquer lugar
- NÃ£o quer pensar qual versÃ£o executar

---

**Ambas as implementaÃ§Ãµes sÃ£o equivalentes e mantidas em sincronia.**
**Escolha a que quiser - resultado serÃ¡ o mesmo! âœ¨**
