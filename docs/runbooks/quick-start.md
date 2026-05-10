# Quick Start

## Backend

```powershell
cd backend\jubileu-api-fastapi
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m pytest
```

Se a venv ainda nao existir, siga [setup-windows.md](setup-windows.md) ou [setup-linux.md](setup-linux.md).

## Frontend

```powershell
cd frontend\jubileu-web
npm ci
npm run lint
npm run build
npm run dev
```

## Documentacao Principal

- Estado atual: [../current/](../current/)
- Plano v0.3.x: [../plans/v0.3/](../plans/v0.3/)
- ADRs: [../adr/](../adr/)
- Release v0.3: [release-v03.md](release-v03.md)

## Regras Rapidas

- Use `Evento` como entidade publica.
- `AULA` e apenas `Evento.tipo`.
- Nao use Bootstrap ou shadcn/ui no ciclo v0.3.x.
- Nao exponha FastAPI/PostgreSQL publicamente.
