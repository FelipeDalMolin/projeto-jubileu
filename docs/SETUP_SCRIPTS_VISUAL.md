# 📑 Documentação Visual dos Scripts

## 🏗️ Arquitetura dos Scripts

```
┌─────────────────────────────────────────────────────────────┐
│                  SCRIPTS DE SETUP MELHORADOS               │
│                                                             │
│  ⭐ ENTRY POINT: setup_all_improved.ps1                   │
│  ├─ Orquestra Docker + Backend + Frontend                │
│  ├─ Status visual (✅/❌/⏭️) por fase                      │
│  └─ Log centralizado em logs/setup-*.log                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FUNÇÕES UTILITÁRIAS (scripts/utils/)                     │
│  ├─ logger.ps1                                            │
│  │  ├─ Info($message)                                     │
│  │  ├─ Warn($message)                                     │
│  │  ├─ Success($message)                                  │
│  │  ├─ Error($message)                                    │
│  │  ├─ Debug($message)                                    │
│  │  └─ Fail($message) [exits with code 1]               │
│  │                                                         │
│  └─ validators.ps1                                        │
│     ├─ Test-PythonVersion("3.8")                         │
│     ├─ Test-NodeVersion("18.0.0")                        │
│     ├─ Test-NpmVersion("9.0.0")                          │
│     ├─ Test-DockerInstalled()                            │
│     ├─ Test-GitInstalled()                               │
│     ├─ Test-DiskSpace(2048)                              │
│     ├─ Test-EnvFile($path)                               │
│     ├─ Test-DirectoryStructure(...)                      │
│     └─ Invoke-WithRetry($scriptblock, 3)                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SCRIPTS ESPECÍFICOS                                       │
│  ├─ setup_backend_improved.ps1    (Backend FastAPI)       │
│  │  1. Validar Python ≥ 3.8                              │
│  │  2. Definir caminhos                                  │
│  │  3. Validar requirements.txt                          │
│  │  4. Copiar .env (se existir .env.example)            │
│  │  5. Criar/validar .venv                               │
│  │  6. Instalar dependências via pip                     │
│  │  7. Executar alembic upgrade head                     │
│  │  8. Log + resumo                                      │
│  │                                                         │
│  ├─ setup_frontend_improved.ps1   (Frontend React/Vite)  │
│  │  1. Validar Node.js ≥ 18 + npm ≥ 9                   │
│  │  2. Definir caminhos                                  │
│  │  3. Validar package.json                              │
│  │  4. Copiar .env (se existir .env.example)            │
│  │  5. npm install                                       │
│  │  6. (Opcional) npm run build                          │
│  │  7. Log + resumo                                      │
│  │                                                         │
│  ├─ setup_all_improved.ps1        (Orquestrador)         │
│  │  1. Docker Compose (up -d)                            │
│  │  2. ➜ setup_backend_improved.ps1                      │
│  │  3. ➜ setup_frontend_improved.ps1                     │
│  │  4. Resumo final com status                           │
│  │                                                         │
│  └─ test_setup.ps1                (Validador)            │
│     1. Validar Python, Node, npm                         │
│     2. Validar venv + .env + requirements (backend)      │
│     3. Validar package.json + node_modules + .env        │
│     4. Validar Docker (opcional)                         │
│     5. Relatório com ✅/❌/ℹ️ e recomendações            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Fluxo de Execução

### setup_all_improved.ps1

```
INÍCIO
  │
  ├─ [1] Docker Compose?
  │  │
  │  ├─ Sim + Docker disponível
  │  │  ├─ docker compose up -d
  │  │  ├─ Esperar 15s
  │  │  └─ Status: ✅ OK / ❌ ERRO / ⏭️ PULADO
  │  │
  │  └─ Não ou Docker indisponível
  │     └─ Status: ⏭️ PULADO
  │
  ├─ [2] Backend
  │  │
  │  └─ & setup_backend_improved.ps1
  │     ├─ Python validado ✅
  │     ├─ .env criado/validado ✅
  │     ├─ .venv criado ✅
  │     ├─ Dependências instaladas ✅
  │     ├─ Migrations executadas ✅
  │     └─ Status: ✅ OK / ❌ ERRO
  │
  ├─ [3] Frontend
  │  │
  │  └─ & setup_frontend_improved.ps1
  │     ├─ Node.js + npm validados ✅
  │     ├─ .env criado/validado ✅
  │     ├─ npm install executado ✅
  │     ├─ (Opcional) Build testado ✅
  │     └─ Status: ✅ OK / ❌ ERRO
  │
  └─ [4] RESUMO FINAL
     ├─ ✅ Docker : OK
     ├─ ✅ Backend : OK
     ├─ ✅ Frontend : OK
     │
     ├─ Próximos passos
     └─ FIM ✨
```

### test_setup.ps1

```
INÍCIO
  │
  ├─ [1] Pré-requisitos Globais
  │  ├─ Python ≥ 3.8? ✅ / ❌
  │  ├─ Node.js ≥ 18? ✅ / ❌  
  │  └─ npm ≥ 9? ✅ / ❌
  │
  ├─ [2] Backend
  │  ├─ Diretório existe? ✅ / ❌
  │  ├─ .venv existe? ✅ / ❌
  │  ├─ .env configurado? ✅ / ❌
  │  ├─ requirements.txt existe? ✅ / ❌
  │  └─ alembic.ini existe? ✅ / ❌
  │
  ├─ [3] Frontend
  │  ├─ Diretório existe? ✅ / ❌
  │  ├─ package.json existe? ✅ / ❌
  │  ├─ node_modules existe? ✅ / ❌
  │  ├─ .env configurado? ✅ / ❌
  │  └─ package-lock.json existe? ✅ / ❌
  │
  ├─ [4] Docker
  │  ├─ docker-compose.yml existe? ✅ / ❌
  │  └─ Docker disponível? ✅ / ❌
  │
  └─ [5] RELATÓRIO
     ├─ Total: 15 testes
     ├─ Passou: 14 ✅
     ├─ Falhou: 1 ❌
     ├─ Recomendações: ...
     └─ FIM
```

---

## 📝 Logging em Detalhes

### Estrutura do Log

```
logs/
├─ setup-20260328-143015.log
├─ setup-20260328-150230.log
└─ setup-20260328-152645.log

─────────────────────────────────────────────────
Conteúdo de setup-20260328-143015.log:

[14:30:15] [INFO] === SETUP COMPLETO DO PROJETO ===
[14:30:15] [INFO] Data: 2026-03-28 14:30:15
[14:30:16] [INFO] Verificando pré-requisitos...
[14:30:16] [SUCCESS] Python 3.11.2
[14:30:16] [SUCCESS] Node.js 20.10.0
[14:30:17] [SUCCESS] npm 10.2.3
[14:30:18] [INFO] 📦 Iniciando Docker Compose...
[14:30:19] [SUCCESS] Docker Compose iniciado
[14:30:35] [INFO] Aguardando serviços ficarem prontos (15s)...
[14:30:50] [INFO] 🐍 Configurando Backend...
[14:30:50] [INFO] Caminho do backend: C:\...\jubileu-api-fastapi
[14:30:51] [INFO] Configurando arquivo .env...
[14:30:51] [SUCCESS] .env criado
[14:30:52] [INFO] Configurando ambiente virtual Python...
[14:30:52] [INFO] Criando ambiente virtual...
[14:30:55] [SUCCESS] Ambiente virtual criado
[14:30:55] [INFO] Ativando ambiente virtual...
[14:30:55] [SUCCESS] Ambiente virtual ativado
[14:30:56] [INFO] Instalando dependências (requirements.txt)...
[14:31:05] [SUCCESS] Dependências instaladas
[14:31:06] [INFO] Executando migrations (alembic upgrade head)...
[14:31:08] [SUCCESS] Migrations executadas com sucesso
[14:31:09] [INFO] === SETUP FRONTEND COMPLETO ===
...
[14:31:45] [SUCCESS] === SETUP COMPLETO ===
[14:31:45] [INFO] ✨ Setup completo concluído com sucesso!
```

### Cores de Log (Console)

```
🔵 [INFO]    - Informações gerais (Cyan)
🟢 [SUCCESS] - Operações bem-sucedidas (Green)
🟡 [WARN]    - Avisos (Yellow)
🔴 [ERROR]   - Erros (Red)
⚫ [DEBUG]    - Detalhes para debug (Gray)
```

---

## 🔄 Ciclo de Desenvolvimento

```
┌──────────────────────────────────────────────────┐
│         PRIMEIRA VEZ (Setup Inicial)            │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Abrir PowerShell                            │
│  2. .\scripts\setup_all_improved.ps1            │
│  3. .\scripts\test_setup.ps1                    │
│  4. Editar .env (backend + frontend)            │
│  5. Começar desenvolvimento                     │
│                                                  │
└──────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│      DESENVOLVIMENTO DIÁRIO (Sem Mudanças)      │
├──────────────────────────────────────────────────┤
│                                                  │
│  • Backend rodando em terminal 1                │
│    uvicorn app.main:app --reload               │
│                                                  │
│  • Frontend rodando em terminal 2               │
│    npm run dev                                  │
│                                                  │
│  • Terminal 3 para testes                       │
│    pytest tests/ -v                             │
│                                                  │
└──────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│   APÓS git pull (Se mudou requirements/package) │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. .\scripts\sync_and_setup.ps1 (faz tudo)    │
│     OU                                          │
│     .\scripts\setup_backend_improved.ps1        │
│     (se só mudou requirements.txt)              │
│                                                  │
│  2. .\scripts\test_setup.ps1                    │
│  3. Restart dos servidores                      │
│                                                  │
└──────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│      TROUBLESHOOTING (Se Algo Quebrou)          │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Verifique logs:                             │
│     Get-Content ".\logs\setup-*.log" -Tail 50 │
│                                                  │
│  2. Rode testes:                                │
│     .\scripts\test_setup.ps1                    │
│                                                  │
│  3. Siga recomendações do teste                 │
│                                                  │
│  4. Execute setup novamente:                    │
│     .\scripts\setup_all_improved.ps1            │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 🎯 Casos de Uso Reais

### Caso 1: Novo desenvolvedor no projeto
```
1. git clone ...
2. cd projeto-jubileu
3. .\scripts\setup_all_improved.ps1
4. .\scripts\test_setup.ps1
✅ Pronto em ~5 minutos
```

### Caso 2: Mudou requirements.txt no git
```
1. git pull
2. .\scripts\setup_backend_improved.ps1
3. .\scripts\test_setup.ps1
✅ Backend atualizado
```

### Caso 3: Adicionou novo pacote npm
```
1. npm install novo-pacote
2. npm ci (para garantir locks)
3. ✅ Frontend atualizado
```

### Caso 4: Ambiente com erro
```
1. .\scripts\test_setup.ps1
2. Leia output e siga recomendações
3. .\scripts\setup_all_improved.ps1
✅ Ambiente recuperado
```

---

## 🔐 Segurança

### Arquivos NOT tracked (.gitignore)
```
.env                    # Contém senhas/tokens
.venv/                  # Ambiente virtual  
node_modules/           # Dependências
*.log                   # Logs
__pycache__/           # Cache Python
dist/                  # Build output
```

### Arquivos QUE devem estar no git
```
requirements.txt       # Dependências backend
package.json           # Dependências frontend
package-lock.json      # Lock frontend
.env.example           # Template de .env
alembic/               # Migrations
```

---

## 📈 Métricas de Setup

```
Tempo de execução esperado:

┌─────────────────┬──────────┬─────────────┐
│ Componente      │ Tempo    │ Tamanho     │
├─────────────────┼──────────┼─────────────┤
│ Docker Compose  │ 10-20s   │ ~1 GB       │
│ Python venv     │ 5-10s    │ ~500 MB     │
│ pip install     │ 10-30s   │ ~200 MB     │
│ alembic upgrade │ 5-15s    │ varies      │
│ npm install     │ 30-60s   │ ~1.5 GB     │
│ npm build       │ 10-30s   │ ~200 MB     │
├─────────────────┼──────────┼─────────────┤
│ ✨ TOTAL        │ 2-3 min  │ ~3.5 GB     │
└─────────────────┴──────────┴─────────────┘

Requisitos mínimos:
• Disco: 5 GB livre
• RAM: 4 GB disponível
• Internet: 50 MB (downloads)
• Tempo: 5 minutos
```

---

## 🎓 Extensões Futuras

Possíveis adições aos scripts:

```
1. Health Checks
   ✓ API responde em localhost:8000?
   ✓ Frontend carrega em localhost:5173?
   ✓ BD conecta?

2. CI/CD Integration
   ✓ GitHub Actions
   ✓ Docker multistage builds
   ✓ Automated testing

3. Multi-environment
   ✓ Development vs Production
   ✓ Different .env configs

4. Database Management
   ✓ Backup automático
   ✓ Seed data

5. Monitoring
   ✓ Performance metrics
   ✓ Error tracking
```

---

**Versão:** 2.0  
**Data:** 2026-03-28  
**Status:** ✅ Pronto para Uso
