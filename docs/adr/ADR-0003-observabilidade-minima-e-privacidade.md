# ADR-0003 - Observabilidade Minima E Privacidade

## Status

Aceita para o ciclo `v0.3.1 Stabilization`. Ativacao em producao continua condicionada a canary
aprovado; esta decisao nao autoriza deploy nem habilitacao automatica do SDK.

## Contexto

O runtime precisa correlacionar falhas entre Cloudflare, NGINX, FastAPI e PostgreSQL sem
transformar logs, reports ou traces em uma segunda base de dados de negocio. Paths livres,
queries, corpos, cookies, tokens, IPs completos, nomes e parametros SQL nao sao evidencias
operacionais aceitaveis.

Collector e dashboard pertencem ao plano neutro do app-host em `/srv/ops`. O Jubileu deve
continuar funcional quando esse plano estiver parado.

## Decisao

- NGINX e FastAPI produzem logs JSON com campos tecnicos allowlisted e template de rota.
- `X-Request-ID`, W3C `traceparent` v00 e `CF-Ray` somente sao preservados quando passam por
  validacao de formato; `tracestate` e outros valores livres sao descartados ou substituidos.
- Probes 2xx de liveness/readiness nao sao persistidos em access logs. Falhas continuam
  observaveis.
- Containers usam o driver Docker `local`, com rotacao `10m x 3`.
- OTel exporta somente traces por OTLP/HTTP em rede Docker privada. O SDK fica desligado por
  default e o overlay `compose.otel.yml` e uma acao explicita de investigacao em desenvolvimento.
- O endpoint OTLP exige uma origem HTTP(S), sem path, credencial embutida, query ou fragmento;
  segredos de exportacao nao entram neste piloto.
- O Collector aplica allowlist e redacao fail-closed antes do Aspire. Logs, metricas, browser
  tracing e spans manuais de negocio ficam fora deste primeiro slice.
- Reports operacionais usam `0700` no diretorio, `0600` nos arquivos, retencao limitada e somente
  agregados tecnicos. Nao armazenam logs brutos, linhas funcionais, nomes de arquivos ou assuntos
  de commits.

## Consequencias

- A ausencia do Collector nao pode falhar requests; no maximo o exportador descarta telemetria e
  registra aviso tecnico.
- O overlay nao publica `4317`, `4318` nem a UI e nao torna FastAPI/PostgreSQL publicos.
- Mudancas de configuracao Compose/NGINX so entram em vigor apos recriacao controlada dos
  containers afetados.
- Canary de producao exige sampler reduzido, regressao p95 inferior a 5%, sete dias de observacao
  e rollback para `OTEL_SDK_DISABLED=true`.
- Auditoria persistente de negocio permanece uma capacidade separada.

## Validacao

- testes de contrato do middleware e do formatter JSON;
- testes de privacidade dos templates NGINX e do report operacional;
- `nginx -t` para dev e release;
- Compose base, overlay OTel e release renderizados sem drift;
- build backend com `requirements.lock --require-hashes`;
- request com SDK ativo e Collector indisponivel continua respondendo.
