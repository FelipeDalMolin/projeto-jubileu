# SETUP_LINUX.md
# Configuração do Projeto Jubileu no Linux

## 📋 Índice

- [Requisitos](#-requisitos)
- [Instalação Rápida](#-instalação-rápida)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Manual do Usuário](#-manual-do-usuário)
- [Troubleshooting](#-troubleshooting)
- [Comparação Windows vs Linux](#-comparação-windows-vs-linux)

---

## 📦 Requisitos

### Pré-requisitos do Sistema

| Componente | Versão Mínima | Como Instalar |
|-----------|---------------|---------------|
| **Python** | 3.8+ | `sudo apt install python3.11 python3-venv` |
| **Node.js** | 18.0.0+ | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo bash && sudo apt install nodejs` |
| **npm** | 9.0.0+ | Vem com Node.js |
| **Docker** | Latest | `curl -fsSL https://get.docker.com \| sh` |
| **Git** | Latest | `sudo apt install git` |

### Espaço em Disco

```
Mínimo: 5 GB livres
Recomendado: 10 GB livres

Distribuição:
- Backend .venv: ~500 MB
- Frontend node_modules: ~1.5 GB
- Docker images: ~1 GB
- Outros: ~2 GB
```

### Permissões

```bash
# Para usar Docker sem sudo (opcional)
sudo usermod -aG docker $USER
newgrp docker

# Para executar scripts
chmod +x scripts/*.sh
chmod +x scripts/utils/*.sh
```

---

## ⚡ Instalação Rápida

### Passo 1: Clonar Repositório
```bash
git clone https://github.com/seu-usuario/projeto-jubileu.git
cd projeto-jubileu
```

### Passo 2: Executar Setup
```bash
# Opção 1: Script unificado (auto-detecta SO)
bash scripts/setup.sh

# Opção 2: Setup direto (Linux/macOS/Git Bash)
bash scripts/setup_all.sh
```

### Passo 3: Validar
```bash
bash scripts/test_setup.sh
```

### Passo 4: Configurar Variáveis de Ambiente
```bash
# Backend
nano backend/jubileu-api-fastapi/.env

# Frontend
nano frontend/jubileu-web/.env
```

### Passo 5: Iniciar Sistema
Abra 2-3 terminais:

**Terminal 1: Backend**
```bash
cd backend/jubileu-api-fastapi
source .venv/bin/activate
python -m app.main
# Ou com reload automático:
uvicorn app.main:app --reload --port 8000
```

**Terminal 2: Frontend**
```bash
cd frontend/jubileu-web
npm run dev
```

**Terminal 3: Testes (opcional)**
```bash
cd backend/jubileu-api-fastapi
pytest tests/ -v
```

---

## 📜 Scripts Disponíveis

### `setup_all.sh` ⭐ Recomendado
Setup completo (Docker + Backend + Frontend)

```bash
bash scripts/setup_all.sh
```

**O que faz:**
1. Docker Compose (up -d)
2. Backend setup (venv, pip, alembic)
3. Frontend setup (npm install)
4. Relatório de status

**Tempo esperado:** 2-3 minutos

---

### `setup_backend.sh`
Setup apenas do backend FastAPI

```bash
bash scripts/setup_backend.sh
```

**O que faz:**
1. Valida Python ≥ 3.8
2. Cria/valida `.env`
3. Cria `.venv`
4. Instala `requirements.txt`
5. Executa alembic migrations

**Tempo esperado:** 30-60 segundos

---

### `setup_frontend.sh`
Setup apenas do frontend React/Vite

```bash
bash scripts/setup_frontend.sh
```

**O que faz:**
1. Valida Node.js ≥ 18 + npm ≥ 9
2. Cria/valida `.env`
3. Executa `npm install`
4. (Opcional) Testa build

**Tempo esperado:** 30-120 segundos

---

### `test_setup.sh`
Valida toda a configuração

```bash
bash scripts/test_setup.sh
```

**O que valida:**
- ✅ Python, Node.js, npm, Git, Docker
- ✅ Backend (.venv, .env, requirements, alembic)
- ✅ Frontend (package.json, node_modules, .env)
- ✅ Docker (if available)

**Saída esperada:**
```
✅ Python : 3.11.2 OK
✅ Node.js : 20.10.0 OK
✅ npm : 10.2.3 OK
✅ Backend venv : OK
...
📊 Resultados: 15 testes passaram
✨ Tudo OK! Seu ambiente está pronto.
```

---

### `setup.sh` (Auto-Detectar SO)
Script que auto-detecta Windows/Linux/macOS

```bash
bash scripts/setup.sh
```

**Comportamento:**
- Windows + PowerShell → Redireciona para `setup_all_improved.ps1`
- Linux/macOS/Git Bash → Executa `setup_all.sh`

---

## 📖 Manual do Usuário

### Estrutura de Logging

```
logs/
├─ setup-20260328-143015.log
├─ setup-20260328-150230.log
└─ setup-20260328-152645.log
```

**Visualizar logs:**
```bash
# Últimas 50 linhas
tail -n 50 logs/setup-*.log

# Seguir em tempo real
tail -f logs/setup-*.log

# Grep por erros
grep ERROR logs/setup-*.log
```

---

### Arquivo .env

#### Backend: `backend/jubileu-api-fastapi/.env`
```env
# Database
DATABASE_URL=postgresql+psycopg2://jubileu:senha@localhost:5432/jubileu_dev

# JWT
JWT_SECRET=sua-chave-secreta-minimo-32-caracteres-aqui
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

# App
DEBUG=true
ENVIRONMENT=development

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

#### Frontend: `frontend/jubileu-web/.env`
```env
# API Backend
VITE_API_URL=http://localhost:8000

# App
VITE_APP_TITLE=Jubileu
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

---

### Ativar Ambiente Virtual

```bash
# Ativar
source backend/jubileu-api-fastapi/.venv/bin/activate

# Desativar
deactivate

# Verificar Python
which python
python --version
```

---

### Comandos Úteis

#### Pip
```bash
# Instalar de novo
pip install -r requirements.txt

# Adicionar novo pacote
pip install novo-pacote

# Atualizar
pip install --upgrade pacote

# Gerar requirements.txt
pip freeze > requirements.txt
```

#### npm
```bash
# Instalar de novo
npm ci

# Adicionar novo pacote
npm install novo-pacote

# Dev dependency
npm install --save-dev novo-pacote

# Limpar cache
npm cache clean --force
```

#### Docker
```bash
# Ver containers
docker ps -a

# Ver logs
docker logs nome-container -f

# Parar todos
docker compose down

# Iniciar
docker compose up -d
```

---

## 🆘 Troubleshooting

### "command not found: python3"
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.11

# Fedora
sudo dnf install python3.11

# Arch
sudo pacman -S python
```

### "command not found: npm"
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash
sudo apt install nodejs

# Fedora
sudo dnf install nodejs npm

# Arch
sudo pacman -S nodejs npm
```

### "Failed to connect to Docker"
```bash
# Se Docker não está rodando
sudo systemctl start docker

# Para executar sem sudo
sudo usermod -aG docker $USER
newgrp docker
```

### "Error: EACCES: permission denied"
```bash
# Dar permissões executáveis
chmod +x scripts/*.sh
chmod +x scripts/utils/*.sh

# Executar como sudo (último recurso)
sudo bash scripts/setup_all.sh
```

### "npm ERR! code ERESOLVE"
```bash
# Opção 1: Legacy peer deps
npm install --legacy-peer-deps

# Opção 2: Limpar e reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "Alembic upgrade head failed"
```bash
# Verificar status
alembic current

# Ver histórico
alembic history

# Downgrade
alembic downgrade base

# Upgrade novamente
alembic upgrade head
```

### "Address already in use"
```bash
# Backend na porta 8000
fuser -k 8000/tcp

# Frontend na porta 5173
fuser -k 5173/tcp

# Ou mudar porta
uvicorn app.main:app --port 8001
```

---

## 📊 Comparação Windows vs Linux

| Aspecto | Windows (PowerShell) | Linux/macOS (Bash) |
|---------|--------------------|--------------------|
| **Setup Completo** | `.\scripts\setup_all_improved.ps1` | `bash scripts/setup_all.sh` |
| **Setup Backend** | `.\scripts\setup_backend_improved.ps1` | `bash scripts/setup_backend.sh` |
| **Ativar venv** | `.\.venv\Scripts\Activate.ps1` | `source .venv/bin/activate` |
| **Instalar deps** | `pip install -r requirements.txt` | `pip install -r requirements.txt` |
| **npm install** | `npm install` | `npm install` |
| **Testar** | `.\scripts\test_setup.ps1` | `bash scripts/test_setup.sh` |
| **View logs** | `Get-Content logs\setup-*.log` | `tail logs/setup-*.log` |
| **Ver permissões** | `ls -l` | `ls -l` |
| **Executar script** | `bash script.sh` | `bash script.sh` |

---

## 🔧 Instalação Manual (Se scripts não funcionarem)

### 1. Backend
```bash
cd backend/jubileu-api-fastapi

# Criar venv
python3 -m venv .venv
source .venv/bin/activate

# Instalar deps
pip install --upgrade pip
pip install -r requirements.txt

# Migrations
alembic upgrade head
```

### 2. Frontend
```bash
cd frontend/jubileu-web

# npm install
npm install

# Dev server
npm run dev
```

### 3. Iniciar
```
Terminal 1: cd backend/jubileu-api-fastapi && source .venv/bin/activate && uvicorn app.main:app --reload
Terminal 2: cd frontend/jubileu-web && npm run dev
```

---

## 📋 Checklist Final

- [ ] Clonou o repositório
- [ ] Executou `bash scripts/setup_all.sh`
- [ ] Executou `bash scripts/test_setup.sh` (passou)
- [ ] Verificou logs em `logs/`
- [ ] Configurou `.env` (backend e frontend)
- [ ] Backend inicia sem erros
- [ ] Frontend carrega em localhost:5173
- [ ] API responde em localhost:8000/docs
- [ ] Pode acessar do navegador
- [ ] Testes passam: `pytest tests/ -v`

---

## 🎓 Dicas Adicionais

### Usar pyenv (Gerenciador de versões Python)
```bash
# Instalar pyenv
curl https://pyenv.run | bash

# Listar versões disponíveis
pyenv versions

# Instalar Python 3.11
pyenv install 3.11.0

# Usar localmente
pyenv local 3.11.0
```

### Usar nvm (Node Version Manager)
```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash

# Listar versões
nvm list-remote

# Instalar Node 20
nvm install 20

# Usar
nvm use 20
```

### WSL2 (Windows Subsystem for Linux)
Se estiver no Windows, WSL2 oferece melhor experiência:
```bash
# Instalar WSL2
wsl --install

# Em WSL2, usar scripts Linux normalmente
bash scripts/setup_all.sh
```

---

## 📞 Suporte

Para problemas:
1. Verifique logs: `tail logs/setup-*.log`
2. Execute: `bash scripts/test_setup.sh`
3. Siga troubleshooting acima
4. Abra issue no repositório

---

**Última atualização:** 2026-03-28  
**Versão:** 2.0 - Scripts Linux
**Status:** ✅ Pronto para Usar
