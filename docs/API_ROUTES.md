# Rotas de API e Correlacao de Requests

## Contrato de Rotas

O caminho publico de runtime e:

```text
Cloudflare -> NGINX -> React SPA + FastAPI /api -> PostgreSQL
```

NGINX e o ponto de entrada publico. FastAPI e PostgreSQL nao devem ser expostos diretamente.

Use estes significados ao diagnosticar:

| URL | Significado |
| --- | --- |
| `/dias` | Rota de navegacao da SPA React. Deve retornar HTML do frontend. |
| `/api/dias` | Rota de dados do backend pelo gateway de API. |
| `/api/dias/` | Variante nao canonica; FastAPI retorna `404` sem redirect. |
| `/health` | Health check simples do backend, independente de trabalho de banco. |
| `/api/health` | Health check pelo gateway de API; valida o caminho `/api` via proxy/runtime. |

Rotas canonicas do backend usam `/api` e colecoes sem barra final. Aliases de dados sem
`/api` nao sao montados no FastAPI. `/dias`, `/jogadores` e `/turmas` continuam existindo
somente como rotas de navegacao da SPA pelo NGINX.

## Diagnostico no Navegador

Abra o Network do DevTools e filtre por `Fetch/XHR`.

- Uma rota de tela como `/dias` deve carregar HTML e assets do frontend.
- Chamadas de dados feitas por essa tela devem apontar para `/api/...`.
- Uma request para `/api/api/...` e sempre um bug de contrato de rotas.
- Se `/dias` abre mas `/api/health` falha, a SPA esta viva, mas o caminho da API/proxy esta quebrado.
- Se `/api/health` funciona mas `/api/dias` falha, o gateway esta vivo e o problema provavelmente esta em rota, autenticacao, banco ou regra interna da aplicacao.
- Se localhost funciona e a URL publica falha, verifique Cloudflare, NGINX, tunel ou wiring de deploy.
- Se o browser publico funciona mas o VS Code Tunnel nao, trate primeiro como problema do editor/tunel, nao necessariamente como queda da aplicacao.

## Correlacao de Requests

Requests do frontend devem incluir um UUID opaco em `X-Request-ID`. NGINX/FastAPI geram um novo
id quando o header nao vem ou nao tem formato UUID/32-hex, e a response devolve o id efetivo.
Somente `traceparent` W3C v00 com trace/span IDs nao nulos e aceito; `tracestate` controlado pelo
cliente e descartado no NGINX publico. Esses headers nunca sao usados para auth.

Para rastrear uma request:

1. Abra o Network do DevTools.
2. Selecione a request `/api/...` que falhou.
3. Leia o header de response `X-Request-ID`.
4. Procure o mesmo id nos logs do FastAPI.
5. Se os access logs do NGINX incluirem request id, procure o mesmo id nos logs do NGINX.

Os logs JSON de request do FastAPI incluem:

```json
{"event":"request_completed","request_id":"...","trace_id":"...","span_id":"...","method":"GET","route":"/api/eventos/{evento_id}","status_code":200,"duration_ms":12.3,"service_version":"...","deployment_environment":"production"}
```

A configuracao NGINX versionada gera o id quando necessario, encaminha `X-Request-ID` e o
`traceparent` validado para FastAPI e registra JSON com template normalizado de rota,
status/upstream, duracoes, bytes,
request id, `CF-Ray` validado, release e ambiente. Rotas dinamicas conhecidas substituem segmentos por
`{...}` e qualquer path desconhecido vira `<unmatched>`. Assim o access log nao persiste corpo,
query string, segmento livre de path, cookie, token, nome ou IP completo.
Probes 2xx de `/health`, `/api/health`, `/api/ready` e `/nginx-health` sao omitidos; falhas da API
continuam aparecendo no log estruturado do backend.

## Comandos Locais

Inventario de rotas do backend:

```bash
cd backend/jubileu-api-fastapi
.venv/bin/python scripts/print_routes.py
```

Testes focados de contrato do backend:

```bash
cd backend/jubileu-api-fastapi
.venv/bin/python -m pytest tests/test_smoke_api.py tests/test_api_standardization_aliases.py -q
```

Check de contrato do frontend:

```bash
cd frontend/jubileu-web
npm run check:api-contract
```

Smoke de runtime via NGINX:

```bash
SMOKE_USERNAME="$JUBILEU_SMOKE_USERNAME" SMOKE_PASSWORD="$JUBILEU_SMOKE_PASSWORD" \
  RELEASE_BASE_URL=http://127.0.0.1:"$NGINX_PORT" scripts/release/smoke_release.sh
```
