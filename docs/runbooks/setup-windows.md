# Setup de Desenvolvimento no Windows

## Pre-requisitos
- Git
- Node.js LTS (ex.: 18+)
- Python 3.11+ (com venv)
- Docker Desktop (habilita docker compose)

## Passo a passo
- Clone o repo: `git clone https://github.com/FelipeDalMolin/projeto-jubileu.git`
- Entre na pasta: `cd projeto-jubileu`
- Garanta a branch: `git switch jubileu-v2` (o script tambem tenta alinhar a branch automaticamente)
- Rode o bootstrap: `.\scripts\sync_and_setup.ps1`

## Como rodar
- Docker: `docker compose up -d`
- API: `cd backend\jubileu-api-fastapi` ; `.\.venv\Scripts\Activate.ps1` ; `uvicorn app.main:app --reload`
- Web: `cd frontend\jubileu-web` ; `npm run dev`

## Troubleshooting
- Porta 5432 ocupada: pare servicos Postgres existentes ou ajuste `DATABASE_URL` no `.env`.
- Erro no `alembic upgrade head`: verifique se o banco esta acessivel e se `DATABASE_URL` esta correto; rode novamente apos corrigir.
- `npm install` ou `npm run dev` falhando: confirme Node.js LTS instalado, limpe cache `npm cache verify`, e reinstale dependencias.
- Docker nao sobe: abra o Docker Desktop e confirme que `docker compose` funciona pelo PowerShell.
