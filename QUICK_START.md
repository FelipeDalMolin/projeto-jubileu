# 🚀 Quick Start - Scripts de Setup Melhorados

## Estrutura Completa

```
scripts/
├── 📄 setup_all_improved.ps1          ⭐ USE ESTE (setup completo)
├── 📄 setup_backend_improved.ps1      📦 backend apenas
├── 📄 setup_frontend_improved.ps1     ⚛️ frontend apenas
├── 📄 test_setup.ps1                  ✅ validar tudo
├── 📄 setup_backend_structure.ps1     (sem mudanças)
├── 📄 sync_and_setup.ps1              (sem mudanças)
├── 📄 SETUP_README.md                 📖 documentação completa
│
├── utils/
│   ├── logger.ps1                     🔵 logging com arquivo
│   └── validators.ps1                 🟢 validações pré-requisitos
│
└── logs/
    └── setup-20260328-143015.log      📋 logs de execução
```

---

## ⚡ Início Rápido (5 minutos)

### Passo 1: Abrir PowerShell
```powershell
cd c:\Projetos\projeto-jubileu
```

### Passo 2: Executar Setup Completo
```powershell
.\scripts\setup_all_improved.ps1
```

**Saída esperada:**
```
[08:30:15] [INFO] === SETUP COMPLETO DO PROJETO ===
[08:30:16] [SUCCESS] Python 3.11.2
[08:30:17] [SUCCESS] Node.js 20.10.0
...
✅ Docker : OK
✅ Backend : OK
✅ Frontend : OK
✨ Setup completo concluído com sucesso!
```

### Passo 3: Validar Tudo
```powershell
.\scripts\test_setup.ps1
```

**Saída esperada:**
```
✅ Python : OK
✅ Node.js : OK
✅ npm : OK
✅ Backend venv : OK
✅ Backend .env : OK
✅ Frontend package.json : OK
✅ Frontend node_modules : OK
📊 Resultados: 15 testes passaram
✨ Tudo OK! Seu ambiente está pronto.
```

---

## 📥 O que foi Instalado

✅ **Backend** (`backend/jubileu-api-fastapi/`)
- `.venv/` - Ambiente virtual Python isolado
- `.env` - Arquivo de configuração (copiado de .env.example)
- `__pycache__/` - Cache do Python
- Dependências instaladas (pip)
- Migrations executadas (alembic)

✅ **Frontend** (`frontend/jubileu-web/`)
- `node_modules/` - Dependências npm instaladas
- `.env` - Arquivo de configuração (copiado de .env.example)
- `package-lock.json` - Lock file para reprodutibilidade

✅ **Docker** (opcional)
- Containers iniciados (se docker-compose.yml existe)

✅ **Logs**
- `logs/setup-YYYYMMDD-HHMMSS.log` - Histórico de execução

---

## 🎯 Casos de Uso

### ✅ Setup pela primeira vez
```powershell
.\scripts\setup_all_improved.ps1
.\scripts\test_setup.ps1
```

### ✅ Apenas backend novo
```powershell
.\scripts\setup_backend_improved.ps1
```

### ✅ Apenas frontend novo
```powershell
.\scripts\setup_frontend_improved.ps1
```

### ✅ Verificar configuração
```powershell
.\scripts\test_setup.ps1
```

### ✅ Após fazer git pull
```powershell
.\scripts\sync_and_setup.ps1  # Já faz setup completo
```

### ✅ Ver logs da última execução
```powershell
Get-Content ".\logs\setup-*.log" -Last 50
```

---

## 📖 Documentação

- **Uso completo:** [scripts/SETUP_README.md](scripts/SETUP_README.md)
- **Análise detalhada:** [SETUP_SCRIPTS_ANALYSIS.md](SETUP_SCRIPTS_ANALYSIS.md)
- **Resumo das melhorias:** [RESUMO_MELHORIAS.md](RESUMO_MELHORIAS.md)

---

## ✨ Principais Melhorias

| Feature | Antes | Depois |
|---------|-------|--------|
| Valida Python | ❌ | ✅ 3.8+ |
| Valida Node.js | ❌ | ✅ 18+ |
| Logging em arquivo | ❌ | ✅ `logs/` |
| Status visual | ❌ | ✅ ✅/❌/⏭️ |
| Teste automatizado | ❌ | ✅ `test_setup.ps1` |
| Documentação | ⚠️ | ✅ Completa |

---

## 🔧 Configuração Pós-Setup

### Backend `.env`
Edite `backend/jubileu-api-fastapi/.env`:
```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/jubileu_dev
JWT_SECRET=sua-chave-secreta-aqui-min-32-chars
DEBUG=true
```

### Frontend `.env`
Edite `frontend/jubileu-web/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_DEBUG=true
```

---

## 🚀 Iniciar Desenvolvimento

### Terminal 1: Backend
```powershell
cd .\backend\jubileu-api-fastapi
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```
API em: http://localhost:8000/docs

### Terminal 2: Frontend
```powershell
cd .\frontend\jubileu-web
npm run dev
```
App em: http://localhost:5173

### Terminal 3: Testes
```powershell
cd .\backend\jubileu-api-fastapi
pytest tests/ -v
```

---

## ❌ Troubleshooting

### "Python não está instalado"
```powershell
# Visite: https://www.python.org/downloads/
# Ou use: choco install python311
```

### "npm ERESOLVE error"
```powershell
npm install --legacy-peer-deps
# Ou: npm cache clean --force && npm install
```

### "alembic upgrade head falhou"
```powershell
# Verificar se BD está rodando:
docker ps
# Ou revisar .env DATABASE_URL
```

### "Espaço em disco insuficiente"
Necesário ~3 GB livre:
- Backend `.venv` ~500 MB
- Frontend `node_modules` ~1.5 GB
- Docker images ~1 GB

---

## 📊 Fluxograma de Decisão

```
Uso os scripts?
  ├─ Sim, setup completo
  │   └─ .\scripts\setup_all_improved.ps1
  │
  ├─ Apenas verificar
  │   └─ .\scripts\test_setup.ps1
  │
  ├─ Apenas backend
  │   └─ .\scripts\setup_backend_improved.ps1
  │
  ├─ Apenas frontend
  │   └─ .\scripts\setup_frontend_improved.ps1
  │
  └─ Para git pull
      └─ .\scripts\sync_and_setup.ps1

Algo deu errado?
  ├─ Verifique logs
  │   └─ Get-Content ".\logs\setup-*.log"
  │
  ├─ Rode testes
  │   └─ .\scripts\test_setup.ps1
  │
  └─ Siga troubleshooting acima
```

---

## ✅ Checklist Final

- [ ] Executou `.\scripts\setup_all_improved.ps1`
- [ ] Executou `.\scripts\test_setup.ps1` (passou)
- [ ] Verificou logs em `logs/`
- [ ] Configurou `.env` (backend e frontend)
- [ ] Backend inicia sem erros
- [ ] Frontend carrega em localhost:5173
- [ ] API responde em localhost:8000/docs
- [ ] Pode acessar do navegador
- [ ] Testes passam: `pytest tests/ -v`

---

## 🎉 Pronto!

Seu ambiente está configurado e pronto para desenvolvimento.

**Próximo passo:**
```powershell
cd .\backend\jubileu-api-fastapi
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Happy coding! 🚀
