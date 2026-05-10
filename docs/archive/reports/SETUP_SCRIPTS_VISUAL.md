> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# ðŸ“‘ DocumentaÃ§Ã£o Visual dos Scripts

## ðŸ—ï¸ Arquitetura dos Scripts

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                  SCRIPTS DE SETUP MELHORADOS               â”‚
â”‚                                                             â”‚
â”‚  â­ ENTRY POINT: setup_all_improved.ps1                   â”‚
â”‚  â”œâ”€ Orquestra Docker + Backend + Frontend                â”‚
â”‚  â”œâ”€ Status visual (âœ…/âŒ/â­ï¸) por fase                      â”‚
â”‚  â””â”€ Log centralizado em logs/setup-*.log                 â”‚
â”‚                                                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                             â”‚
â”‚  FUNÃ‡Ã•ES UTILITÃRIAS (scripts/utils/)                     â”‚
â”‚  â”œâ”€ logger.ps1                                            â”‚
â”‚  â”‚  â”œâ”€ Info($message)                                     â”‚
â”‚  â”‚  â”œâ”€ Warn($message)                                     â”‚
â”‚  â”‚  â”œâ”€ Success($message)                                  â”‚
â”‚  â”‚  â”œâ”€ Error($message)                                    â”‚
â”‚  â”‚  â”œâ”€ Debug($message)                                    â”‚
â”‚  â”‚  â””â”€ Fail($message) [exits with code 1]               â”‚
â”‚  â”‚                                                         â”‚
â”‚  â””â”€ validators.ps1                                        â”‚
â”‚     â”œâ”€ Test-PythonVersion("3.8")                         â”‚
â”‚     â”œâ”€ Test-NodeVersion("18.0.0")                        â”‚
â”‚     â”œâ”€ Test-NpmVersion("9.0.0")                          â”‚
â”‚     â”œâ”€ Test-DockerInstalled()                            â”‚
â”‚     â”œâ”€ Test-GitInstalled()                               â”‚
â”‚     â”œâ”€ Test-DiskSpace(2048)                              â”‚
â”‚     â”œâ”€ Test-EnvFile($path)                               â”‚
â”‚     â”œâ”€ Test-DirectoryStructure(...)                      â”‚
â”‚     â””â”€ Invoke-WithRetry($scriptblock, 3)                â”‚
â”‚                                                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                             â”‚
â”‚  SCRIPTS ESPECÃFICOS                                       â”‚
â”‚  â”œâ”€ setup_backend_improved.ps1    (Backend FastAPI)       â”‚
â”‚  â”‚  1. Validar Python â‰¥ 3.8                              â”‚
â”‚  â”‚  2. Definir caminhos                                  â”‚
â”‚  â”‚  3. Validar requirements.txt                          â”‚
â”‚  â”‚  4. Copiar .env (se existir .env.example)            â”‚
â”‚  â”‚  5. Criar/validar .venv                               â”‚
â”‚  â”‚  6. Instalar dependÃªncias via pip                     â”‚
â”‚  â”‚  7. Executar alembic upgrade head                     â”‚
â”‚  â”‚  8. Log + resumo                                      â”‚
â”‚  â”‚                                                         â”‚
â”‚  â”œâ”€ setup_frontend_improved.ps1   (Frontend React/Vite)  â”‚
â”‚  â”‚  1. Validar Node.js â‰¥ 18 + npm â‰¥ 9                   â”‚
â”‚  â”‚  2. Definir caminhos                                  â”‚
â”‚  â”‚  3. Validar package.json                              â”‚
â”‚  â”‚  4. Copiar .env (se existir .env.example)            â”‚
â”‚  â”‚  5. npm install                                       â”‚
â”‚  â”‚  6. (Opcional) npm run build                          â”‚
â”‚  â”‚  7. Log + resumo                                      â”‚
â”‚  â”‚                                                         â”‚
â”‚  â”œâ”€ setup_all_improved.ps1        (Orquestrador)         â”‚
â”‚  â”‚  1. Docker Compose (up -d)                            â”‚
â”‚  â”‚  2. âžœ setup_backend_improved.ps1                      â”‚
â”‚  â”‚  3. âžœ setup_frontend_improved.ps1                     â”‚
â”‚  â”‚  4. Resumo final com status                           â”‚
â”‚  â”‚                                                         â”‚
â”‚  â””â”€ test_setup.ps1                (Validador)            â”‚
â”‚     1. Validar Python, Node, npm                         â”‚
â”‚     2. Validar venv + .env + requirements (backend)      â”‚
â”‚     3. Validar package.json + node_modules + .env        â”‚
â”‚     4. Validar Docker (opcional)                         â”‚
â”‚     5. RelatÃ³rio com âœ…/âŒ/â„¹ï¸ e recomendaÃ§Ãµes            â”‚
â”‚                                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸ“Š Fluxo de ExecuÃ§Ã£o

### setup_all_improved.ps1

```
INÃCIO
  â”‚
  â”œâ”€ [1] Docker Compose?
  â”‚  â”‚
  â”‚  â”œâ”€ Sim + Docker disponÃ­vel
  â”‚  â”‚  â”œâ”€ docker compose up -d
  â”‚  â”‚  â”œâ”€ Esperar 15s
  â”‚  â”‚  â””â”€ Status: âœ… OK / âŒ ERRO / â­ï¸ PULADO
  â”‚  â”‚
  â”‚  â””â”€ NÃ£o ou Docker indisponÃ­vel
  â”‚     â””â”€ Status: â­ï¸ PULADO
  â”‚
  â”œâ”€ [2] Backend
  â”‚  â”‚
  â”‚  â””â”€ & setup_backend_improved.ps1
  â”‚     â”œâ”€ Python validado âœ…
  â”‚     â”œâ”€ .env criado/validado âœ…
  â”‚     â”œâ”€ .venv criado âœ…
  â”‚     â”œâ”€ DependÃªncias instaladas âœ…
  â”‚     â”œâ”€ Migrations executadas âœ…
  â”‚     â””â”€ Status: âœ… OK / âŒ ERRO
  â”‚
  â”œâ”€ [3] Frontend
  â”‚  â”‚
  â”‚  â””â”€ & setup_frontend_improved.ps1
  â”‚     â”œâ”€ Node.js + npm validados âœ…
  â”‚     â”œâ”€ .env criado/validado âœ…
  â”‚     â”œâ”€ npm install executado âœ…
  â”‚     â”œâ”€ (Opcional) Build testado âœ…
  â”‚     â””â”€ Status: âœ… OK / âŒ ERRO
  â”‚
  â””â”€ [4] RESUMO FINAL
     â”œâ”€ âœ… Docker : OK
     â”œâ”€ âœ… Backend : OK
     â”œâ”€ âœ… Frontend : OK
     â”‚
     â”œâ”€ PrÃ³ximos passos
     â””â”€ FIM âœ¨
```

### test_setup.ps1

```
INÃCIO
  â”‚
  â”œâ”€ [1] PrÃ©-requisitos Globais
  â”‚  â”œâ”€ Python â‰¥ 3.8? âœ… / âŒ
  â”‚  â”œâ”€ Node.js â‰¥ 18? âœ… / âŒ
  â”‚  â””â”€ npm â‰¥ 9? âœ… / âŒ
  â”‚
  â”œâ”€ [2] Backend
  â”‚  â”œâ”€ DiretÃ³rio existe? âœ… / âŒ
  â”‚  â”œâ”€ .venv existe? âœ… / âŒ
  â”‚  â”œâ”€ .env configurado? âœ… / âŒ
  â”‚  â”œâ”€ requirements.txt existe? âœ… / âŒ
  â”‚  â””â”€ alembic.ini existe? âœ… / âŒ
  â”‚
  â”œâ”€ [3] Frontend
  â”‚  â”œâ”€ DiretÃ³rio existe? âœ… / âŒ
  â”‚  â”œâ”€ package.json existe? âœ… / âŒ
  â”‚  â”œâ”€ node_modules existe? âœ… / âŒ
  â”‚  â”œâ”€ .env configurado? âœ… / âŒ
  â”‚  â””â”€ package-lock.json existe? âœ… / âŒ
  â”‚
  â”œâ”€ [4] Docker
  â”‚  â”œâ”€ docker-compose.yml existe? âœ… / âŒ
  â”‚  â””â”€ Docker disponÃ­vel? âœ… / âŒ
  â”‚
  â””â”€ [5] RELATÃ“RIO
     â”œâ”€ Total: 15 testes
     â”œâ”€ Passou: 14 âœ…
     â”œâ”€ Falhou: 1 âŒ
     â”œâ”€ RecomendaÃ§Ãµes: ...
     â””â”€ FIM
```

---

## ðŸ“ Logging em Detalhes

### Estrutura do Log

```
logs/
â”œâ”€ setup-20260328-143015.log
â”œâ”€ setup-20260328-150230.log
â””â”€ setup-20260328-152645.log

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ConteÃºdo de setup-20260328-143015.log:

[14:30:15] [INFO] === SETUP COMPLETO DO PROJETO ===
[14:30:15] [INFO] Data: 2026-03-28 14:30:15
[14:30:16] [INFO] Verificando prÃ©-requisitos...
[14:30:16] [SUCCESS] Python 3.11.2
[14:30:16] [SUCCESS] Node.js 20.10.0
[14:30:17] [SUCCESS] npm 10.2.3
[14:30:18] [INFO] ðŸ“¦ Iniciando Docker Compose...
[14:30:19] [SUCCESS] Docker Compose iniciado
[14:30:35] [INFO] Aguardando serviÃ§os ficarem prontos (15s)...
[14:30:50] [INFO] ðŸ Configurando Backend...
[14:30:50] [INFO] Caminho do backend: C:\...\jubileu-api-fastapi
[14:30:51] [INFO] Configurando arquivo .env...
[14:30:51] [SUCCESS] .env criado
[14:30:52] [INFO] Configurando ambiente virtual Python...
[14:30:52] [INFO] Criando ambiente virtual...
[14:30:55] [SUCCESS] Ambiente virtual criado
[14:30:55] [INFO] Ativando ambiente virtual...
[14:30:55] [SUCCESS] Ambiente virtual ativado
[14:30:56] [INFO] Instalando dependÃªncias (requirements.txt)...
[14:31:05] [SUCCESS] DependÃªncias instaladas
[14:31:06] [INFO] Executando migrations (alembic upgrade head)...
[14:31:08] [SUCCESS] Migrations executadas com sucesso
[14:31:09] [INFO] === SETUP FRONTEND COMPLETO ===
...
[14:31:45] [SUCCESS] === SETUP COMPLETO ===
[14:31:45] [INFO] âœ¨ Setup completo concluÃ­do com sucesso!
```

### Cores de Log (Console)

```
ðŸ”µ [INFO]    - InformaÃ§Ãµes gerais (Cyan)
ðŸŸ¢ [SUCCESS] - OperaÃ§Ãµes bem-sucedidas (Green)
ðŸŸ¡ [WARN]    - Avisos (Yellow)
ðŸ”´ [ERROR]   - Erros (Red)
âš« [DEBUG]    - Detalhes para debug (Gray)
```

---

## ðŸ”„ Ciclo de Desenvolvimento

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚         PRIMEIRA VEZ (Setup Inicial)            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                  â”‚
â”‚  1. Abrir PowerShell                            â”‚
â”‚  2. .\scripts\setup_all_improved.ps1            â”‚
â”‚  3. .\scripts\test_setup.ps1                    â”‚
â”‚  4. Editar .env (backend + frontend)            â”‚
â”‚  5. ComeÃ§ar desenvolvimento                     â”‚
â”‚                                                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                        â”‚
                        â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚      DESENVOLVIMENTO DIÃRIO (Sem MudanÃ§as)      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                  â”‚
â”‚  â€¢ Backend rodando em terminal 1                â”‚
â”‚    uvicorn app.main:app --reload               â”‚
â”‚                                                  â”‚
â”‚  â€¢ Frontend rodando em terminal 2               â”‚
â”‚    npm run dev                                  â”‚
â”‚                                                  â”‚
â”‚  â€¢ Terminal 3 para testes                       â”‚
â”‚    pytest tests/ -v                             â”‚
â”‚                                                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                        â”‚
                        â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   APÃ“S git pull (Se mudou requirements/package) â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                  â”‚
â”‚  1. .\scripts\sync_and_setup.ps1 (faz tudo)    â”‚
â”‚     OU                                          â”‚
â”‚     .\scripts\setup_backend_improved.ps1        â”‚
â”‚     (se sÃ³ mudou requirements.txt)              â”‚
â”‚                                                  â”‚
â”‚  2. .\scripts\test_setup.ps1                    â”‚
â”‚  3. Restart dos servidores                      â”‚
â”‚                                                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                        â”‚
                        â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚      TROUBLESHOOTING (Se Algo Quebrou)          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                  â”‚
â”‚  1. Verifique logs:                             â”‚
â”‚     Get-Content ".\logs\setup-*.log" -Tail 50 â”‚
â”‚                                                  â”‚
â”‚  2. Rode testes:                                â”‚
â”‚     .\scripts\test_setup.ps1                    â”‚
â”‚                                                  â”‚
â”‚  3. Siga recomendaÃ§Ãµes do teste                 â”‚
â”‚                                                  â”‚
â”‚  4. Execute setup novamente:                    â”‚
â”‚     .\scripts\setup_all_improved.ps1            â”‚
â”‚                                                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸŽ¯ Casos de Uso Reais

### Caso 1: Novo desenvolvedor no projeto
```
1. git clone ...
2. cd projeto-jubileu
3. .\scripts\setup_all_improved.ps1
4. .\scripts\test_setup.ps1
âœ… Pronto em ~5 minutos
```

### Caso 2: Mudou requirements.txt no git
```
1. git pull
2. .\scripts\setup_backend_improved.ps1
3. .\scripts\test_setup.ps1
âœ… Backend atualizado
```

### Caso 3: Adicionou novo pacote npm
```
1. npm install novo-pacote
2. npm ci (para garantir locks)
3. âœ… Frontend atualizado
```

### Caso 4: Ambiente com erro
```
1. .\scripts\test_setup.ps1
2. Leia output e siga recomendaÃ§Ãµes
3. .\scripts\setup_all_improved.ps1
âœ… Ambiente recuperado
```

---

## ðŸ” SeguranÃ§a

### Arquivos NOT tracked (.gitignore)
```
.env                    # ContÃ©m senhas/tokens
.venv/                  # Ambiente virtual
node_modules/           # DependÃªncias
*.log                   # Logs
__pycache__/           # Cache Python
dist/                  # Build output
```

### Arquivos QUE devem estar no git
```
requirements.txt       # DependÃªncias backend
package.json           # DependÃªncias frontend
package-lock.json      # Lock frontend
.env.example           # Template de .env
alembic/               # Migrations
```

---

## ðŸ“ˆ MÃ©tricas de Setup

```
Tempo de execuÃ§Ã£o esperado:

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Componente      â”‚ Tempo    â”‚ Tamanho     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Docker Compose  â”‚ 10-20s   â”‚ ~1 GB       â”‚
â”‚ Python venv     â”‚ 5-10s    â”‚ ~500 MB     â”‚
â”‚ pip install     â”‚ 10-30s   â”‚ ~200 MB     â”‚
â”‚ alembic upgrade â”‚ 5-15s    â”‚ varies      â”‚
â”‚ npm install     â”‚ 30-60s   â”‚ ~1.5 GB     â”‚
â”‚ npm build       â”‚ 10-30s   â”‚ ~200 MB     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ âœ¨ TOTAL        â”‚ 2-3 min  â”‚ ~3.5 GB     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Requisitos mÃ­nimos:
â€¢ Disco: 5 GB livre
â€¢ RAM: 4 GB disponÃ­vel
â€¢ Internet: 50 MB (downloads)
â€¢ Tempo: 5 minutos
```

---

## ðŸŽ“ ExtensÃµes Futuras

PossÃ­veis adiÃ§Ãµes aos scripts:

```
1. Health Checks
   âœ“ API responde em localhost:8000?
   âœ“ Frontend carrega em localhost:5173?
   âœ“ BD conecta?

2. CI/CD Integration
   âœ“ GitHub Actions
   âœ“ Docker multistage builds
   âœ“ Automated testing

3. Multi-environment
   âœ“ Development vs Production
   âœ“ Different .env configs

4. Database Management
   âœ“ Backup automÃ¡tico
   âœ“ Seed data

5. Monitoring
   âœ“ Performance metrics
   âœ“ Error tracking
```

---

**VersÃ£o:** 2.0
**Data:** 2026-03-28
**Status:** âœ… Pronto para Uso
