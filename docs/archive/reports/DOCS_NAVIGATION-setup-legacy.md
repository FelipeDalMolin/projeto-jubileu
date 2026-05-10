> Status: Historico / Superseded
> Substituido por: docs/current/*, docs/adr/* ou docs/plans/v0.3/*.
> Nao usar como fonte de implementacao ativa sem validar contra a documentacao viva.
# ðŸ“š Guia de NavegaÃ§Ã£o - DocumentaÃ§Ã£o de Setup

Encontre a documentaÃ§Ã£o certa para sua situaÃ§Ã£o:

---

## ðŸŽ¯ Escolha Seu CenÃ¡rio

### "Sou um usuÃ¡rio Windows e quero fazer setup"
ðŸ‘‰ [QUICK_START.md](QUICK_START.md) (5 minutos)
```powershell
.\scripts\setup_all_improved.ps1
.\scripts\test_setup.ps1
```

### "Sou um usuÃ¡rio Linux/macOS e quero fazer setup"
ðŸ‘‰ [SETUP_LINUX.md](SETUP_LINUX.md) (primeiras 50 linhas)
```bash
bash scripts/setup_all.sh
bash scripts/test_setup.sh
```

### "Estou em WSL2 (Windows Subsystem for Linux)"
ðŸ‘‰ [SETUP_LINUX.md](SETUP_LINUX.md) - use scripts Bash
```bash
bash scripts/setup_all.sh
bash scripts/test_setup.sh
```

### "Quero entender a diferenÃ§a entre Windows e Linux scripts"
ðŸ‘‰ [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md)
- Mapeamento de funcionalidades
- Guia de escolha
- Tabelas de referÃªncia

### "Quero documentaÃ§Ã£o completa de scripts"
ðŸ‘‰ [scripts/SETUP_README.md](scripts/SETUP_README.md) (Windows)
ðŸ‘‰ [SETUP_LINUX.md](SETUP_LINUX.md) (Linux)

### "Algo deu errado, preciso de troubleshooting"

**Windows:**
1. Leia [scripts/SETUP_README.md](scripts/SETUP_README.md) - seÃ§Ã£o "Troubleshooting"
2. Verifique logs: `Get-Content .\logs\setup-*.log -Tail 50`
3. Execute: `.\scripts\test_setup.ps1`

**Linux:**
1. Leia [SETUP_LINUX.md](SETUP_LINUX.md) - seÃ§Ã£o "Troubleshooting"
2. Verifique logs: `tail -n 50 logs/setup-*.log`
3. Execute: `bash scripts/test_setup.sh`

### "Quero ver diagramas e arquitetura"
ðŸ‘‰ [SETUP_SCRIPTS_VISUAL.md](SETUP_SCRIPTS_VISUAL.md)
- Arquitetura dos scripts
- Fluxogramas de execuÃ§Ã£o
- MÃ©tricas de setup

### "Quero entender os problemas que foram resolvidos"
ðŸ‘‰ [SETUP_SCRIPTS_ANALYSIS.md](SETUP_SCRIPTS_ANALYSIS.md)
- Problemas identificados
- SoluÃ§Ãµes implementadas
- Plano de melhoria

### "Quero um resumo do que foi criado para Linux"
ðŸ‘‰ [SETUP_LINUX_SUMMARY.md](SETUP_LINUX_SUMMARY.md)
- Arquivos criados
- EquivalÃªncias Windows â†” Linux
- Exemplos de uso

---

## ðŸ“ Mapa de Arquivos de DocumentaÃ§Ã£o

```
Raiz do Projeto/
â”œâ”€â”€ QUICK_START.md                    â­ Leia primeiro (5 min)
â”œâ”€â”€ SETUP_SCRIPTS_ANALYSIS.md         ðŸ“Š AnÃ¡lise tÃ©cnica
â”œâ”€â”€ SETUP_SCRIPTS_COMPARISON.md       ðŸ”„ Windows vs Linux
â”œâ”€â”€ SETUP_SCRIPTS_VISUAL.md           ðŸ“ˆ Diagramas e fluxos
â”œâ”€â”€ SETUP_LINUX.md                    ðŸ§ Guia Linux completo
â”œâ”€â”€ SETUP_LINUX_SUMMARY.md            ðŸ“ Resumo Linux
â”œâ”€â”€ DOCS_NAVIGATION.md                ðŸ‘ˆ Este arquivo
â”‚
â””â”€â”€ scripts/
    â”œâ”€â”€ SETUP_README.md               ðŸ“– Guia Windows completo
    â”œâ”€â”€ setup_all_improved.ps1        ðŸªŸ Setup Windows
    â”œâ”€â”€ setup_all.sh                  ðŸ§ Setup Linux
    â”œâ”€â”€ test_setup.ps1                âœ… Teste Windows
    â”œâ”€â”€ test_setup.sh                 âœ… Teste Linux
    â””â”€â”€ utils/
        â”œâ”€â”€ logger.ps1
        â”œâ”€â”€ logger.sh
        â”œâ”€â”€ validators.ps1
        â””â”€â”€ validators.sh
```

---

## ðŸ” Buscar por Palavra-Chave

### Python, Poetry, venv
ðŸ‘‰ `scripts/SETUP_README.md` - Backend Setup (backend)
ðŸ‘‰ `SETUP_LINUX.md` - Backend Setup (backend)

### npm, Node.js, Vite, React
ðŸ‘‰ `scripts/SETUP_README.md` - Frontend Setup (frontend)
ðŸ‘‰ `SETUP_LINUX.md` - Frontend Setup (frontend)

### Docker, Docker Compose
ðŸ‘‰ `scripts/SETUP_README.md` - Troubleshooting
ðŸ‘‰ `SETUP_LINUX.md` - Troubleshooting

### Git, Branch, Pull, Merge
ðŸ‘‰ `scripts/sync_and_setup.ps1` (Windows)
ðŸ‘‰ `scripts/sync_and_setup.sh` (Linux)

### Logging, Debugging, Logs
ðŸ‘‰ `SETUP_SCRIPTS_VISUAL.md` - Logging em Detalhes
ðŸ‘‰ `scripts/utils/logger.ps1` (Windows)
ðŸ‘‰ `scripts/utils/logger.sh` (Linux)

### CI/CD, GitHub Actions
ðŸ‘‰ `SETUP_SCRIPTS_COMPARISON.md` - CI/CD Ready
ðŸ‘‰ Usar: `bash scripts/setup_all.sh`

### WSL2, Linux no Windows
ðŸ‘‰ `SETUP_LINUX.md` - "WSL2 (Windows Subsystem for Linux)"

---

## âš¡ ReferÃªncia RÃ¡pida

| Necessidade | Arquivo | Link |
|-----------|---------|------|
| Quick start (5min) | QUICK_START.md | [Link](QUICK_START.md) |
| Completo Windows | scripts/SETUP_README.md | [Link](scripts/SETUP_README.md) |
| Completo Linux | SETUP_LINUX.md | [Link](SETUP_LINUX.md) |
| Comparativa | SETUP_SCRIPTS_COMPARISON.md | [Link](SETUP_SCRIPTS_COMPARISON.md) |
| Diagramas | SETUP_SCRIPTS_VISUAL.md | [Link](SETUP_SCRIPTS_VISUAL.md) |
| AnÃ¡lise | SETUP_SCRIPTS_ANALYSIS.md | [Link](SETUP_SCRIPTS_ANALYSIS.md) |
| Resumo Linux | SETUP_LINUX_SUMMARY.md | [Link](SETUP_LINUX_SUMMARY.md) |

---

## ðŸ“š Leitura por NÃ­vel de ExperiÃªncia

### Iniciante
1. [QUICK_START.md](QUICK_START.md) - 5 min
2. Executar scripts
3. [scripts/SETUP_README.md](scripts/SETUP_README.md) - SeÃ§Ã£o "Troubleshooting"

### IntermediÃ¡rio
1. [QUICK_START.md](QUICK_START.md) - 5 min
2. [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md) - escolher plataforma
3. DocumentaÃ§Ã£o especÃ­fica (Windows ou Linux)

### AvanÃ§ado
1. [SETUP_SCRIPTS_VISUAL.md](SETUP_SCRIPTS_VISUAL.md) - Arquitetura
2. [SETUP_SCRIPTS_ANALYSIS.md](SETUP_SCRIPTS_ANALYSIS.md) - AnÃ¡lise
3. CÃ³digo dos scripts (`.ps1` ou `.sh`)
4. [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md) - Detalhes tÃ©cnicos

---

## ðŸŽ“ Roteiros de Leitura

### Roteiro A: "Quero fazer setup rÃ¡pido"
1. [QUICK_START.md](QUICK_START.md) - 5 min
2. Executar script apropiado para seu SO
3. Pronto! âœ¨

**Tempo total:** ~15 minutos

---

### Roteiro B: "Sou novo no projeto e quero entender tudo"
1. [SETUP_SCRIPTS_ANALYSIS.md](SETUP_SCRIPTS_ANALYSIS.md) - Problemas identificados
2. [SETUP_SCRIPTS_VISUAL.md](SETUP_SCRIPTS_VISUAL.md) - Arquitetura
3. [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md) - Escolher SO
4. DocumentaÃ§Ã£o especÃ­fica (Windows ou Linux)
5. Executar scripts
6. Explorar cÃ³digo

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

## ðŸ’¡ Dicas de NavegaÃ§Ã£o

### Encontrar um arquivo?
1. Pressione `Ctrl+P` (VS Code)
2. Digite `SETUP` ou `setup`
3. Escolha o arquivo desejado

### Buscar uma seÃ§Ã£o?
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

## âœ… Checklist de Leitura

Dependendo de suas necessidades, marque:

- [ ] Preciso fazer setup rÃ¡pido â†’ [QUICK_START.md](QUICK_START.md)
- [ ] Preciso entender a arquitetura â†’ [SETUP_SCRIPTS_VISUAL.md](SETUP_SCRIPTS_VISUAL.md)
- [ ] Preciso troubleshooting â†’ `scripts/SETUP_README.md` ou `SETUP_LINUX.md`
- [ ] Preciso comparar SO â†’ [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md)
- [ ] Preciso integrar em CI/CD â†’ [SETUP_LINUX_SUMMARY.md](SETUP_LINUX_SUMMARY.md)

---

## ðŸŽ¯ PrÃ³ximas AÃ§Ãµes

**Iniciante:**
```
1. Leia: QUICK_START.md
2. Execute: seu-script-correspondente
3. Se tiver erro: Leia troubleshooting
```

**IntermediÃ¡rio:**
```
1. Leia: SETUP_SCRIPTS_COMPARISON.md
2. Escolha plataforma
3. Leia documentaÃ§Ã£o especÃ­fica
4. Execute
```

**AvanÃ§ado:**
```
1. Explore: SETUP_SCRIPTS_VISUAL.md
2. Leia cÃ³digo dos scripts
3. Customize conforme necessÃ¡rio
4. Integre em seu workflow
```

---

## ðŸ“ž Precisa de Ajuda?

1. **RÃ¡pido?** â†’ [QUICK_START.md](QUICK_START.md)
2. **Erro?** â†’ Procure por "troubleshooting" no arquivo relevante
3. **Entender melhor?** â†’ [SETUP_SCRIPTS_VISUAL.md](SETUP_SCRIPTS_VISUAL.md)
4. **Comparar?** â†’ [SETUP_SCRIPTS_COMPARISON.md](SETUP_SCRIPTS_COMPARISON.md)
5. **Profundo?** â†’ Leia o cÃ³digo dos scripts

---

## ðŸŽ‰ VocÃª EstÃ¡ Pronto!

Escolha seu caminho acima e comece! âœ¨

**Recomendado para primeira vez:**
1. [QUICK_START.md](QUICK_START.md) - Leia (5 min)
2. Execute seu script
3. ParabÃ©ns! ðŸŽŠ

**Ãšltima atualizaÃ§Ã£o:** 2026-03-28
