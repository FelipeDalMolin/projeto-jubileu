# DEV-40 - Dashboard Tailwind v1

## Objetivo

Refatorar a pagina `/dashboard` para uma experiencia operacional clara, responsiva e Tailwind-only, sem alterar backend, contratos dos services ou instalar dependencias.

## Diagnostico visual

`DashboardHome.tsx` usa classes Bootstrap-like (`container`, `row`, `col-*`, `card`, `btn`, `alert`, `list-group`, `badge`, `text-muted`, `fw-semibold`), mas o ciclo v0.3.x usa Tailwind-only. O resultado e uma tela visualmente fraca e inconsistente com o restante da aplicacao.

## Arquivos impactados

- `frontend/jubileu-web/src/pages/dashboard/DashboardHome.tsx`
- `frontend/jubileu-web/src/components/dashboard/cards/InfoCard.tsx`
- `frontend/jubileu-web/src/components/dashboard/common/SectionHeader.tsx`
- `frontend/jubileu-web/src/routes/AppRoutes.tsx`

## Fonte canonica do dashboard

O dashboard deve ter uma unica fonte ativa:

- Rotas e paginas: `frontend/jubileu-web/src/pages/dashboard/`
- Componentes compartilhados: `frontend/jubileu-web/src/components/dashboard/`
- Dados reais: `frontend/jubileu-web/src/services/dashboard/`

Remover fontes paralelas baseadas em mock ou prototipo:

- `frontend/jubileu-web/src/pages/dashboards/DashboardPage.tsx`
- `frontend/jubileu-web/src/pages/dashboard/TrofeuPage.tsx`
- `frontend/jubileu-web/src/mocks/dashboard/`
- `frontend/jubileu-web/src/mocks/trofeu/`
- dominios exclusivos do prototipo `trofeu`

`/dashboard/estatisticas` deve apontar para `DashboardEstatisticas`, usando service real. `/dashboard/trofeu` permanece apenas como redirect legado para `/dashboard/estatisticas`.

## Criterios de aceite

- `/dashboard` usa layout Tailwind com container `mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8`.
- Header mostra titulo, subtitulo, periodo `Ultimos 30 dias`, loading e links para estatisticas/partidas.
- KPIs responsivos: Jogadores, Partidas, Gols e Media de presenca.
- Atividade recente e Top artilheiros usam paineis claros em `lg:grid-cols-2`.
- Estados loading, erro e vazio estao implementados.
- `DashboardHome.tsx` nao contem classes Bootstrap-like.
- `/dashboard/estatisticas` usa `DashboardEstatisticas` como fonte canonica.
- Nao existem imports ativos de `TrofeuPage`, `trofeuMock`, `mocks/dashboard` ou `pages/dashboards`.
- `npm run lint` e `npm run build` passam.

## Comandos de validacao

```powershell
cd frontend\jubileu-web
npm run lint
npm run build
```

```powershell
git grep -nE "container|row|col-|card|card-body|btn|alert|list-group|badge|text-muted|fw-semibold|rounded-pill|d-flex|justify-content|align-items" frontend/jubileu-web/src/pages/dashboard/DashboardHome.tsx
```

Resultado esperado da busca: sem ocorrencias.

```powershell
rg -n "TrofeuPage|trofeuMock|mocks/dashboard|pages/dashboards" frontend/jubileu-web/src -S
```

Resultado esperado da busca: sem ocorrencias.

## Riscos

- `InfoCard` e `SectionHeader` sao compartilhados por outras telas de dashboard; a mudanca deve manter props e semantica publicas.
- Outras telas de dashboard ainda podem ter Bootstrap-like; isso fica para `DEV-42`.
- `/dashboard/estatisticas` ainda depende do visual atual de `DashboardEstatisticas`, `DashboardFilters` e `RankingTable`; a limpeza Tailwind transversal fica para `DEV-42`.

## Fora de escopo

- Alterar backend ou contratos dos services.
- Instalar Bootstrap, shadcn/ui, lucide, recharts ou qualquer dependencia nova.
- Refatorar `DashboardFilters` e `RankingTable`.
- Redesenhar dashboards secundarios.
- Reintroduzir ranking de trofeu com dados mockados.

## Plano de rollback

Reverter o PR do `DEV-40` ou restaurar os tres arquivos alterados para a versao anterior. Como nao ha migration nem contrato novo, o rollback e apenas frontend/documentacao.

## Sugestao de issue Linear

- Issue: `DEV-40 - UI operacional geral`
- Entrega deste PR: `Dashboard Tailwind v1`
- Issue relacionada para limpeza transversal futura: `DEV-42 - Tailwind-only UI cleanup v0.3`
- Branch sugerida: `dev-40-ui-operacional-geral`
