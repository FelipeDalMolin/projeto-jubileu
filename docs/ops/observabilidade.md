# Observabilidade operacional

## Escopo e separacao

O Jubileu usa quatro superficies com responsabilidades diferentes:

- logs JSON rotativos para evidencia tecnica continua;
- reports locais para snapshots sanitizados de disponibilidade;
- OTel/Aspire somente durante investigacoes;
- auditoria persistente da aplicacao para eventos de negocio.

OTel nao substitui auditoria, Wazuh, backup ou healthcheck e nunca executa `restart`, `stop` ou
`kill`. A aplicacao continua funcional quando Collector/Aspire estao parados.

## Logs estruturados

O NGINX gera ou valida `X-Request-ID`, propaga W3C `traceparent`, descarta `tracestate` e registra:

- metodo e template de rota; segmentos dinamicos conhecidos viram `{...}` e
  paths desconhecidos viram `<unmatched>`;
- status NGINX e upstream;
- duracao total e upstream;
- bytes enviados;
- request ID, `CF-Ray`, release e ambiente.

`traceparent` aceita somente W3C v00 com trace/span IDs nao nulos. `tracestate` e descartado
porque seu valor opaco pode carregar texto controlado pelo cliente. `CF-Ray` tambem passa por
allowlist de formato antes do log.

FastAPI registra a rota normalizada e os mesmos identificadores de correlacao, mais status,
duracao e classe tecnica de erro. Quando OTel esta ativo, `trace_id` e `span_id` permitem ligar o
log ao trace.

Nenhuma dessas superficies registra corpo, query string, cookie, JWT, `Authorization`, IP
completo, nome de jogador ou parametro SQL. IDs recebidos precisam ser UUID/32-hex; valores livres
sao substituidos. Probes 2xx nao sao armazenados, mas probes com erro continuam visiveis.
Excecoes nao tratadas de requests retornam um `500` generico no middleware e registram somente a
classe tecnica; a mensagem e o traceback nao chegam ao logger padrao do Uvicorn, evitando que
statements/parametros de drivers sejam persistidos.
O `error_log` de request do NGINX fica em nivel `crit`, pois mensagens de upstream em nivel
`error` incluem IP e request line bruta. Diagnostico de 5xx usa o access log sanitizado
(`status`, `upstream_status`, duracao e request ID); falhas criticas de processo/configuracao
continuam no stderr.

Containers usam o driver Docker `local`, `max-size=10m` e `max-file=3`. A configuracao vale na
proxima recriacao controlada; editar o Compose nao altera containers existentes.

Em desenvolvimento, o arquivo do NGINX e um bind mount de arquivo unico. Como editores podem
substitui-lo por outro inode de forma atomica, um simples `nginx -s reload` pode continuar lendo
o inode antigo. Antes de considerar a politica aplicada, compare o SHA-256 do arquivo no host e
no container; se divergirem, a recriacao controlada do `nginx-dev` e obrigatoria.

## Liveness e readiness

- `/health` e `/api/health`: liveness FastAPI sem banco;
- `/api/ready`: PostgreSQL mais revisao Alembic, em uma unica consulta;
- `/nginx-health`: liveness estatico e container-local do NGINX.

Healthchecks de API/NGINX rodam a cada 30 segundos. Assim o NGINX nao duplica a readiness e a carga
de probes gravada cai em mais de 95% sem remover deteccao de falha.

## Report operacional

Execute a partir do checkout:

```bash
ops/jubileu-report.sh --quick
ops/jubileu-report.sh --full
```

Defaults atuais:

| Variavel | Default |
|---|---|
| `PROJECT_DIR` | `/srv/ops/stacks/jubileu-v03` |
| `SOURCE_DIR` | `/srv/apps/jubileu-dev` |
| `REPORT_DIR` | `/srv/ops/runs/jubileu` |
| `PUBLIC_BASE_URL` | `https://app.jubileuweb.com` |
| `SINCE` | `24h` |
| `MASK_PII` | `1` |
| `REPORT_RETENTION_DAYS` | `30` |

O report cria o diretorio com `0700`, arquivos com `0600`, corrige permissoes anteriores e elimina
reports datados depois da retencao. Ele nao despeja logs brutos nem linhas de tabelas funcionais:
guarda somente checks e agregados tecnicos, incluindo as metricas essenciais do Cloudflare em
`127.0.0.1:20241`.
Metadados Git ficam limitados a branch, commit curto e contagem de arquivos alterados; nomes de
arquivos e assuntos de commits nao sao persistidos. Status detalhado do VS Code Tunnel e journal
bruto do Cloudflare tambem nao entram no report.

## Piloto OTel sob demanda

As dependencias Python estao fixadas em `requirements.txt`; o build usa
`requirements.lock --require-hashes`. A instrumentacao inclui FastAPI/ASGI, SQLAlchemy e Psycopg,
exportando somente traces via OTLP/HTTP. O navegador React fica fora desta fase.
O lock registra o comando reproduzivel no proprio cabecalho:

```bash
cd backend/jubileu-api-fastapi
pip-compile --generate-hashes --output-file=requirements.lock requirements.txt
```

Qualquer mudanca em `requirements.txt` exige regenerar o lock e comprovar o build por hashes.
O overlay fixa `OTEL_SEMCONV_STABILITY_OPT_IN=http,database` para que a versao
travada `0.65b0` emita os nomes estaveis que a allowlist do Collector aceita;
os nomes legados continuam sendo removidos por seguranca.

Recursos:

```text
service.namespace=jubileu
service.name=jubileu-api
service.version=<release>
deployment.environment.name=development|production
host.name=app-host
```

Para uma investigacao em desenvolvimento:

1. confirme que a stack neutra em `/srv/ops` criou a rede externa `app_host_telemetry`;
2. inicie Collector/Aspire pela operacao de `/srv/ops`;
3. valide o overlay sem alterar o runtime:

   ```bash
   docker compose --env-file .env.dev \
     -f compose.dev.yml -f compose.otel.yml config
   ```

4. em janela controlada, recrie somente o backend dev com o overlay;
5. gere uma request real e confira HTTP -> FastAPI -> SQLAlchemy/Psycopg no Aspire;
6. pare Collector/Aspire e confirme que o Jubileu continua respondendo; o SDK ainda estara ativo
   no backend e podera registrar avisos de exportacao enquanto o Collector estiver parado;
7. ao encerrar a investigacao, em uma proxima janela controlada, recrie somente o backend com o
   Compose base, sem `compose.otel.yml`, e confirme `OTEL_SDK_DISABLED=true`:

   ```bash
   docker compose --project-name jubileu-dev --env-file .env.dev \
     -f compose.dev.yml up -d --no-deps --force-recreate backend
   docker compose --project-name jubileu-dev --env-file .env.dev \
     -f compose.dev.yml exec -T backend \
     sh -lc 'test "$OTEL_SDK_DISABLED" = true'
   ```

O ambiente base preserva `OTEL_SDK_DISABLED=true`; a inclusao deliberada de
`compose.otel.yml` sobrescreve esse valor com `false`, mesmo quando `.env.dev` mantem o default
seguro. O overlay usa 100% dos requests reais em desenvolvimento e exclui health/readiness da
instrumentacao HTTP. A stack central aplica filtro/redaction novamente. Habilitar producao exige
canary separado, sampler reduzido, regressao p95 inferior a 5% e sete dias de observacao. O
Compose/example de release mantem `OTEL_SEMCONV_STABILITY_OPT_IN=http,database`; qualquer
procedimento de canary de producao deve preservar esse valor ao habilitar o SDK.
O SDK limita sua fila a 512 spans e cada lote a 128; indisponibilidade prolongada descarta
telemetria excedente em vez de aumentar memoria sem limite.

## Criterios de seguranca

- `4318` e a UI ficam em loopback/rede Docker; `4317` permanece desativada.
- O endpoint configurado aceita somente uma origem HTTP(S), sem path, userinfo, query ou
  fragmento; o piloto nao usa credencial embutida na URL.
- Headers/corpos nao sao capturados pela instrumentacao.
- Collector indisponivel pode produzir aviso do exportador, nunca falha da request.
- A stack neutra Collector/Aspire nunca recria nem altera aplicacoes; ativacao e teardown do SDK
  no backend sao operacoes separadas e controladas pelo Compose do Jubileu.
- **Pendencia explicita pos-canary:** spans manuais para auth/refresh, ciclo de evento,
  RSVP/check-in, partida e rotacao nao foram adicionados neste piloto automatico. Eles somente
  serao considerados depois do canary aprovado e permanecerao sem payloads funcionais.
- Auditoria de negocio pode referenciar `trace_id`, mas tem persistencia e retencao proprias.
