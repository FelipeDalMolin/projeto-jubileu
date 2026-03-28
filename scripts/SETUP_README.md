# SETUP_README.md
# Documentação dos Scripts de Configuração do Jubileu

## 📌 Visão Geral

Este diretório contém scripts P PowerShell para automatizar a configuração completa do projeto Jubileu (Backend FastAPI + Frontend React/Vite + Docker).

**Características principais:**
- ✅ Verificação de pré-requisitos automática
- 📝 Logging detalhado em arquivo
- 🎯 Tratamento robusto de erros
- 🔄 Idempotente (pode rodar múltiplas vezes)
- 📊 Relatórios de status por componente

---

## 🚀 Uso Rápido

### Setup Completo (Recomendado)
```powershell
cd c:\Projetos\projeto-jubileu\scripts
.\setup_all_improved.ps1
```

Isso vai:
1. Iniciar serviços Docker (se disponível)
2. Configurar backend (venv, deps, migrations)
3. Configurar frontend (npm install)

### Setup Individual

**Backend apenas:**
```powershell
.\setup_backend_improved.ps1
```

**Frontend apenas:**
```powershell
.\setup_frontend_improved.ps1
```

### Testar Configuração
```powershell
.\test_setup.ps1
```

Valida se tudo foi instalado corretamente.

---

## 📁 Estrutura dos Scripts

```
scripts/
├── setup_all_improved.ps1          # Orquestrador principal
├── setup_backend_improved.ps1      # Setup FastAPI
├── setup_frontend_improved.ps1     # Setup React/Vite
├── setup_backend_structure.ps1     # Criador de estrutura (bootstrap)
├── sync_and_setup.ps1              # Git sync + setup
├── test_setup.ps1                  # Validador completo
└── utils/
    ├── logger.ps1                  # Logging com cores e arquivo
    └── validators.ps1              # Validação de pré-requisitos
```

---

## ✅ Pré-requisitos Verificados

### Globalmente
- **Python** ≥ 3.8
- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **Git** (opcional, para sync)
- **Docker** (opcional, para serviços)
- **Espaço em disco** ≥ 2 GB

### Backend
- `requirements.txt` presente
- Espaço para `venv` (~500 MB)
- (Opcional) `alembic.ini` para migrations

### Frontend
- `package.json` presente
- Node <0 MB para `node_modules`

---

## 📊 O Que Cada Script Faz

### `setup_all_improved.ps1`
Coordena todo o setup em 3 fases:

1. **Docker** - Inicia containers (se disponível)
2. **Backend** - Python venv + dependências + migrations
3. **Frontend** - npm install + (opcional) build

```powershell
.\setup_all_improved.ps1
```

**Saída esperada:**
```
[00:05:20] [SUCCESS] ✅ Docker : OK
[00:05:30] [SUCCESS] ✅ Backend : OK  
[00:06:15] [SUCCESS] ✅ Frontend : OK
```

---

### `setup_backend_improved.ps1`
Configura o backend FastAPI:

1. Verifica Python 3.8+
2. Cria/valida `.env` (cópia de `.env.example`)
3. Cria ambiente virtual `.venv`
4. Instala `requirements.txt` via pip
5. Executa migrations com alembic

```powershell
.\setup_backend_improved.ps1
```

**Passos:**
- ✓ Python validado
- ✓ `.env` configurado
- ✓ `.venv` criado
- ✓ pip upgrade
- ✓ dependências instaladas
- ✓ migrations executadas

**Erro comum:**
> "Erro ao instalar dependências"

**Solução:**
- Verifique se `requirements.txt` existe
- Tente: `pip install --upgrade pip`
- Limpe cache: `pip cache purge`

---

### `setup_frontend_improved.ps1`
Configura o frontend React/Vite:

1. Verifica Node.js 18+ e npm 9+
2. Cria/valida `.env`
3. Executa `npm install`
4. (Opcional) Testa build com `npm run build`

```powershell
.\setup_frontend_improved.ps1
```

**Passos:**
- ✓ Node.js/npm validado
- ✓ `.env` configurado  
- ✓ dependências instaladas
- ✓ (opcional) build testado

**Erro comum:**
> "npm ERR! code ERESOLVE"

**Solução:**
- Limpe node_modules: `npm ci`
- Ou force: `npm install --legacy-peer-deps`

---

### `test_setup.ps1`
Valida **toda** a configuração após setup:

- Pré-requisitos (Python, Node, npm)
- Backend (venv, .env, requirements, alembic)
- Frontend (package.json, node_modules, .env)
- Docker (se disponível)

```powershell
.\test_setup.ps1
```

**Saída esperada:**
```
✅ Python : 3.11.2 OK
✅ Node.js : 20.10.0 OK
✅ npm : 10.2.3 OK
✅ Backend venv : OK
✅ Backend .env : OK
...
📊 Resultados: 15 testes passaram
✨ Tudo OK! Seu ambiente está pronto.
```

---

## 📝 Logging

Cada script gera logs em:
```
logs/setup-YYYYMMDD-HHMMSS.log
```

**Exemplo:**
```
[08:30:15] [INFO] === SETUP COMPLETO DO PROJETO ===
[08:30:15] [INFO] Data: 2026-03-28 08:30:15
[08:30:16] [SUCCESS] Python 3.11.2
[08:30:17] [SUCCESS] Node.js 20.10.0
[08:30:18] [INFO] 📦 Iniciando Docker Compose...
[08:30:20] [SUCCESS] Docker Compose iniciado
[08:30:21] [INFO] Aguardando serviços ficarem prontos (15s)...
```

**Visualizar últimos 50 linhas:**
```powershell
Get-Content logs/setup-*.log -Tail 50
```

---

## 🔧 Configuração de Variáveis de Ambiente

### Backend `.env`

Crie em `backend/jubileu-api-fastapi/.env`:

```env
# Database
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/jubileu_dev
DATABASE_TEST_URL=sqlite:///./test.db

# JWT
JWT_SECRET=sua-chave-secreta-aqui-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

# App
DEBUG=true
ENVIRONMENT=development
```

### Frontend `.env`

Crie em `frontend/jubileu-web/.env`:

```env
# API Backend
VITE_API_URL=http://localhost:8000

# App
VITE_APP_TITLE=Jubileu
VITE_DEBUG=true
```

---

## 🚨 Troubleshooting

### "Python não está instalado"
```powershell
# Instalar Python 3.11+
# Visite: https://www.python.org/downloads/
# OU use Chocolatey:
choco install python311
```

### "Node.js versão 18+ não encontrada"
```powershell
# Instalar Node.js 18.0+
# Visite: https://nodejs.org/
# OU use Chocolatey:
choco install nodejs --version=20.10.0
```

### "Docker não está instalado"
```powershell
# Opcional, mas recomendado
# Visite: https://www.docker.com/products/docker-desktop/
# OU use Chocolatey:
choco install docker-desktop
```

### ".env não foi criado"
```powershell
# Verificar se .env.example existe:
Test-Path .\backend\jubileu-api-fastapi\.env.example

# Se não existir, criar manualmente baseado em docs
```

### "Migrations falharam"
```powershell
# Verificar se BD está rodando (Docker)
docker ps

# Verificar se DATABASE_URL em .env inicia
Get-Content .\backend\jubileu-api-fastapi\.env | grep DATABASE_URL

# Rodar migrations manualmente:
cd .\backend\jubileu-api-fastapi
alembic current
alembic upgde head
```

### "npm install falhou com ERESOLVE"
```powershell
# Opção 1: Usar legacy dependency resolution:
npm install --legacy-peer-deps

# Opção 2: Limpar cache e reinstalar:
npm cache clean --force
rm -r node_modules
npm install
```

---

## 📋 Checklist Pós-Setup

- [ ] `.\scripts\test_setup.ps1` passou com sucesso
- [ ] `.env` criado em backend com `DATABASE_URL` válida
- [ ] `.env` criado em frontend com `VITE_API_URL` válida
- [ ] Console backend sem erros ao iniziar
- [ ] Frontend serve em `http://localhost:5173`
- [ ] API responde em `http://localhost:8000/docs` (Swagger)

---

## 🎯 Próximas Etapas

### 1. Iniciar Backend
```powershell
cd .\backend\jubileu-api-fastapi
# Ativar venv manualmente se necessário:
.\.venv\Scripts\Activate.ps1

# Opção A: FastAPI padrão
python -m app.main

# Opção B: Reload em desenvolvimento (recomendado)
uvicorn app.main:app --reload --port 8000
```

API disponível em: http://localhost:8000/docs (Swagger UI)

### 2. Iniciar Frontend
```powershell
cd .\frontend\jubileu-web
npm run dev
```

Frontend disponível em: http://localhost:5173

### 3. Testar Integração
```powershell
# Terminal 3 - rodar testes
cd .\backend\jubileu-api-fastapi
pytest

# Ou testes específicos:
pytest tests/test_smoke_api.py -v
```

---

## 🔄 Workflow Recomendado

### Primeira vez (setup completo):
```powershell
.\scripts\setup_all_improved.ps1
.\scripts\test_setup.ps1
```

### Desenvolvimento diário:
```powershell
# Apenas se mudou requirements.txt:
.\scripts\setup_backend_improved.ps1

# Apenas se mudou package.json:
.\scripts\setup_frontend_improved.ps1

# Após pull do git:
.\scripts\sync_and_setup.ps1
```

### Quando algo quebrou:
```powershell
.\scripts\test_setup.ps1  # Diagnosticar
# Corrigir manualmente conforme output
.\scripts\setup_all_improved.ps1  # Retry
```

---

## 🛠️ Desenvolvimento dos Scripts

### Adicionar Nova Validação

1. Edite `utils/validators.ps1`:
```powershell
function Test-MyValidation {
    param([string]$SomeParam = "default")
    
    try {
        # Sua validação aqui
        if ($condition) {
            return $true, "Mensagem de sucesso"
        } else {
            return $false, "Mensagem de erro"
        }
    } catch {
        return $false, "Erro: $_"
    }
}
```

2. Use em um script:
```powershell
$ok, $msg = Test-MyValidation
if (-not $ok) {
    Fail "Problema: $msg"
}
Success $msg
```

### Adicionar Novo Script

1. Criar em `scripts/` com prefix `setup_` ou `test_`
2. Importar utils:
```powershell
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir "utils/logger.ps1")
. (Join-Path $ScriptDir "utils/validators.ps1")
Initialize-Log
```
3. Seguir padrão de logging
4. Atualizar `SETUP_README.md`

---

## 📞 Suporte

Para problemas:
1. Verifique logs em `logs/setup-*.log`
2. Execute `.\scripts\test_setup.ps1`
3. Siga recommendations do troubleshooting
4. Abra uma issue no repositório

---

**Última atualização:** 2026-03-28  
**Versão:** 2.0 (Scripts Melhorados)
