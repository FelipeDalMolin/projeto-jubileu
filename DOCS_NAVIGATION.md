# 📚 Guia de Navegação - Documentação de Setup

Encontre a documentação certa para sua situação:

---

## 🎯 Escolha Seu Cenário

### "Sou um usuário Windows e quero fazer setup"
👉 [QUICK_START.md](QUICK_START.md) (5 minutos)
```powershell
.\scripts\setup_all_improved.ps1
.\scripts\test_setup.ps1
```

### "Sou um usuário Linux/macOS e quero fazer setup"
👉 [SETUP_LINUX.md](SETUP_LINUX.md) (primeiras 50 linhas)
```bash
bash scripts/setup_all.sh
bash scripts/test_setup.sh
```

### "Estou em WSL2 (Windows Subsystem for Linux)"
👉 [SETUP_LINUX.md](SETUP_LINUX.md) - use scripts Bash
```bash
bash scripts/setup_all.sh
bash scripts/test_setup.sh
```

### "Quero entender a diferença entre Windows e Linux scripts"
👉 [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md)
- Mapeamento de funcionalidades
- Guia de escolha
- Tabelas de referência

### "Quero documentação completa de scripts"
👉 [scripts/SETUP_README.md](scripts/SETUP_README.md) (Windows)
👉 [SETUP_LINUX.md](SETUP_LINUX.md) (Linux)

### "Algo deu errado, preciso de troubleshooting"

**Windows:**
1. Leia [scripts/SETUP_README.md](scripts/SETUP_README.md) - seção "Troubleshooting"
2. Verifique logs: `Get-Content .\logs\setup-*.log -Tail 50`
3. Execute: `.\scripts\test_setup.ps1`

**Linux:**
1. Leia [SETUP_LINUX.md](SETUP_LINUX.md) - seção "Troubleshooting"
2. Verifique logs: `tail -n 50 logs/setup-*.log`
3. Execute: `bash scripts/test_setup.sh`

### "Quero ver diagramas e arquitetura"
👉 [SETUP_SCRIPTS_VISUAL.md](SETUP_SCRIPTS_VISUAL.md)
- Arquitetura dos scripts
- Fluxogramas de execução
- Métricas de setup

### "Quero entender os problemas que foram resolvidos"
👉 [SETUP_SCRIPTS_ANALYSIS.md](SETUP_SCRIPTS_ANALYSIS.md)
- Problemas identificados
- Soluções implementadas
- Plano de melhoria

### "Quero um resumo do que foi criado para Linux"
👉 [SETUP_LINUX_SUMMARY.md](SETUP_LINUX_SUMMARY.md)
- Arquivos criados
- Equivalências Windows ↔ Linux
- Exemplos de uso

---

## 📁 Mapa de Arquivos de Documentação

```
Raiz do Projeto/
├── QUICK_START.md                    ⭐ Leia primeiro (5 min)
├── SETUP_SCRIPTS_ANALYSIS.md         📊 Análise técnica
├── SETUP_SCRIPTS_COMPARISON.md       🔄 Windows vs Linux
├── SETUP_SCRIPTS_VISUAL.md           📈 Diagramas e fluxos
├── SETUP_LINUX.md                    🐧 Guia Linux completo
├── SETUP_LINUX_SUMMARY.md            📝 Resumo Linux
├── DOCS_NAVIGATION.md                👈 Este arquivo
│
└── scripts/
    ├── SETUP_README.md               📖 Guia Windows completo
    ├── setup_all_improved.ps1        🪟 Setup Windows
    ├── setup_all.sh                  🐧 Setup Linux
    ├── test_setup.ps1                ✅ Teste Windows
    ├── test_setup.sh                 ✅ Teste Linux
    └── utils/
        ├── logger.ps1
        ├── logger.sh
        ├── validators.ps1
        └── validators.sh
```

---

## 🔍 Buscar por Palavra-Chave

### Python, Poetry, venv
👉 `scripts/SETUP_README.md` - Backend Setup (backend)
👉 `SETUP_LINUX.md` - Backend Setup (backend)

### npm, Node.js, Vite, React
👉 `scripts/SETUP_README.md` - Frontend Setup (frontend)
👉 `SETUP_LINUX.md` - Frontend Setup (frontend)

### Docker, Docker Compose
👉 `scripts/SETUP_README.md` - Troubleshooting
👉 `SETUP_LINUX.md` - Troubleshooting

### Git, Branch, Pull, Merge
👉 `scripts/sync_and_setup.ps1` (Windows)
👉 `scripts/sync_and_setup.sh` (Linux)

### Logging, Debugging, Logs
👉 `SETUP_SCRIPTS_VISUAL.md` - Logging em Detalhes
👉 `scripts/utils/logger.ps1` (Windows)
👉 `scripts/utils/logger.sh` (Linux)

### CI/CD, GitHub Actions
👉 `SETUP_SCRIPTS_COMPARISON.md` - CI/CD Ready
👉 Usar: `bash scripts/setup_all.sh`

### WSL2, Linux no Windows
👉 `SETUP_LINUX.md` - "WSL2 (Windows Subsystem for Linux)"

---

## ⚡ Referência Rápida

| Necessidade | Arquivo | Link |
|-----------|---------|------|
| Quick start (5min) | QUICK_START.md | [Link](QUICK_START.md) |
| Completo Windows | scripts/SETUP_README.md | [Link](scripts/SETUP_README.md) |
| Completo Linux | SETUP_LINUX.md | [Link](SETUP_LINUX.md) |
| Comparativa | SETUP_SCRIPTS_COMPARISON.md | [Link](SETUP_SCRIPTS_COMPARISON.md) |
| Diagramas | SETUP_SCRIPTS_VISUAL.md | [Link](SETUP_SCRIPTS_VISUAL.md) |
| Análise | SETUP_SCRIPTS_ANALYSIS.md | [Link](SETUP_SCRIPTS_ANALYSIS.md) |
| Resumo Linux | SETUP_LINUX_SUMMARY.md | [Link](SETUP_LINUX_SUMMARY.md) |

---

## 📚 Leitura por Nível de Experiência

### Iniciante
1. [QUICK_START.md](QUICK_START.md) - 5 min
2. Executar scripts
3. [scripts/SETUP_README.md](scripts/SETUP_README.md) - Seção "Troubleshooting"

### Intermediário
1. [QUICK_START.md](QUICK_START.md) - 5 min
2. [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md) - escolher plataforma
3. Documentação específica (Windows ou Linux)

### Avançado
1. [SETUP_SCRIPTS_VISUAL.md](SETUP_SCRIPTS_VISUAL.md) - Arquitetura
2. [SETUP_SCRIPTS_ANALYSIS.md](SETUP_SCRIPTS_ANALYSIS.md) - Análise
3. Código dos scripts (`.ps1` ou `.sh`)
4. [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md) - Detalhes técnicos

---

## 🎓 Roteiros de Leitura

### Roteiro A: "Quero fazer setup rápido"
1. [QUICK_START.md](QUICK_START.md) - 5 min
2. Executar script apropiado para seu SO
3. Pronto! ✨

**Tempo total:** ~15 minutos

---

### Roteiro B: "Sou novo no projeto e quero entender tudo"
1. [SETUP_SCRIPTS_ANALYSIS.md](SETUP_SCRIPTS_ANALYSIS.md) - Problemas identificados
2. [SETUP_SCRIPTS_VISUAL.md](SETUP_SCRIPTS_VISUAL.md) - Arquitetura
3. [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md) - Escolher SO
4. Documentação específica (Windows ou Linux)
5. Executar scripts
6. Explorar código

**Tempo total:** ~1-2 horas

---

### Roteiro C: "Sou dev Linux e Windows quero saber ambos"
1. [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md) - Comparativa
2. [scripts/SETUP_README.md](scripts/SETUP_README.md) - Windows
3. [SETUP_LINUX.md](SETUP_LINUX.md) - Linux
4. [SETUP_LINUX_SUMMARY.md](SETUP_LINUX_SUMMARY.md) - Resumo

**Tempo total:** ~2-3 horas

---

### Roteiro D: "Preciso integrar em CI/CD"
1. [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md) - "CI/CD Ready"
2. [SETUP_LINUX_SUMMARY.md](SETUP_LINUX_SUMMARY.md) - "CI/CD Pipeline"
3. Usar: `bash scripts/setup_all.sh`
4. Integrar em seu workflow

**Tempo total:** ~30 minutos

---

## 💡 Dicas de Navegação

### Encontrar um arquivo?
1. Pressione `Ctrl+P` (VS Code)
2. Digite `SETUP` ou `setup`
3. Escolha o arquivo desejado

### Buscar uma seção?
1. Abra o arquivo
2. Pressione `Ctrl+F` para buscar
3. Digite seu termo

### Ver estrutura?
```
# No terminal Windows
tree scripts /f

# No terminal Linux
tree scripts/

# Simplificado
ls -la scripts/
```

---

## ✅ Checklist de Leitura

Dependendo de suas necessidades, marque:

- [ ] Preciso fazer setup rápido → [QUICK_START.md](QUICK_START.md)
- [ ] Preciso entender a arquitetura → [SETUP_SCRIPTS_VISUAL.md](SETUP_SCRIPTS_VISUAL.md)
- [ ] Preciso troubleshooting → `scripts/SETUP_README.md` ou `SETUP_LINUX.md`
- [ ] Preciso comparar SO → [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md)
- [ ] Preciso integrar em CI/CD → [SETUP_LINUX_SUMMARY.md](SETUP_LINUX_SUMMARY.md)

---

## 🎯 Próximas Ações

**Iniciante:**
```
1. Leia: QUICK_START.md
2. Execute: seu-script-correspondente
3. Se tiver erro: Leia troubleshooting
```

**Intermediário:**
```
1. Leia: SETUP_SCRIPTS_COMPARISON.md
2. Escolha plataforma
3. Leia documentação específica
4. Execute
```

**Avançado:**
```
1. Explore: SETUP_SCRIPTS_VISUAL.md
2. Leia código dos scripts
3. Customize conforme necessário
4. Integre em seu workflow
```

---

## 📞 Precisa de Ajuda?

1. **Rápido?** → [QUICK_START.md](QUICK_START.md)
2. **Erro?** → Procure por "troubleshooting" no arquivo relevante
3. **Entender melhor?** → [SETUP_SCRIPTS_VISUAL.md](SETUP_SCRIPTS_VISUAL.md)
4. **Comparar?** → [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md)
5. **Profundo?** → Leia o código dos scripts

---

## 🎉 Você Está Pronto!

Escolha seu caminho acima e comece! ✨

**Recomendado para primeira vez:**
1. [QUICK_START.md](QUICK_START.md) - Leia (5 min)
2. Execute seu script
3. Parabéns! 🎊

**Última atualização:** 2026-03-28
