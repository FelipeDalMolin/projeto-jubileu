# Observabilidade operacional

## Objetivo

O report operacional do Projeto Jubileu registra um snapshot repetivel do runtime oficial: Cloudflare Tunnel, NGINX, React/Vite estatico, FastAPI `/api` e PostgreSQL. Ele serve para diagnostico de operacao, disponibilidade, logs recentes e evidencias funcionais basicas.

Esse report nao substitui testes automatizados, validacao manual auditavel dos UCs nem trilha de auditoria de negocio. Ele tambem nao deve ser tratado como prova de E2E browser completo.

## Report operacional vs audit_events

O report operacional mostra estado tecnico do ambiente: containers, HTTP, banco, logs, tunnel e alguns dados funcionais agregados.

`audit_events`, quando existir como trilha de produto, deve registrar eventos de negocio e acoes de usuarios de forma estruturada e consultavel. Ou seja: o report ajuda a responder "o sistema esta saudavel agora?", enquanto `audit_events` deve ajudar a responder "quem fez o que, quando e com qual resultado?".

## Como rodar

Modo rapido:

```bash
ops/jubileu-report.sh --quick
```

Modo completo:

```bash
ops/jubileu-report.sh --full
```

Sem argumento, o script usa `--full`.

Arquivos gerados:

- `reports/ops/jubileu-report-YYYYMMDD-HHMMSS.md`
- `reports/ops/jubileu-report-YYYYMMDD-HHMMSS.json`
- `reports/ops/latest.md`
- `reports/ops/latest.json`

`reports/` e ignorado pelo Git e nao deve ser versionado.

## Variaveis

| Variavel | Default | Uso |
|---|---|---|
| `PROJECT_DIR` | `/opt/projeto-jubileu` | Raiz do repositorio. |
| `PUBLIC_BASE_URL` | `https://app.jubileuweb.com` | Base publica validada por GET. |
| `SINCE` | `24h` | Janela para logs Docker/journal. |
| `REPORT_DIR` | `$PROJECT_DIR/reports/ops` | Destino dos reports gerados. |
| `MASK_PII` | `0` | Use `1` para mascarar nomes em blocos funcionais quando viavel. |

## Interpretacao de status

- `OK`: checks principais saudaveis.
- `WARN`: ha risco ou ruido operacional que merece acompanhamento, mas sem indisponibilidade confirmada.
- `FAIL`: ha falha em endpoint principal, container, Postgres, zumbis ou erros 502/503/504 recentes no NGINX.

O status geral usa precedencia `FAIL > WARN > OK`.

Checks publicos usam `GET` como criterio principal. `HEAD` pode aparecer apenas como diagnostico informativo, porque alguns endpoints retornam `405 Method Not Allowed` para `HEAD` mesmo estando saudaveis via `GET`.

## LGPD e dados operacionais

Reports podem conter dados operacionais e nomes de jogadores quando `MASK_PII=0`. Para compartilhar reports fora do time tecnico, rode:

```bash
MASK_PII=1 ops/jubileu-report.sh --full
```

Mesmo com mascara, revise o arquivo antes de enviar para terceiros.

## Evolucoes recomendadas

- Criar um `systemd timer` ou cron para gerar reports periodicos e manter historico local rotativo.
- Criar uma tela futura `/admin/ops` para expor status consolidado sem despejar logs sensiveis.
- Integrar o JSON do report a um painel simples de saude operacional.
