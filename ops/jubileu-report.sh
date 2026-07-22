#!/usr/bin/env bash

set -u

MODE="full"
PROJECT_DIR="${PROJECT_DIR:-/srv/ops/stacks/jubileu-v03}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://app.jubileuweb.com}"
LOCAL_BASE_URL="${LOCAL_BASE_URL:-http://127.0.0.1:80}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-jubileu-v03}"
SINCE="${SINCE:-24h}"
MASK_PII="${MASK_PII:-0}"
LOCK_DIR="${JUBILEU_REPORT_LOCK:-/tmp/jubileu-report.lock}"

usage() {
  cat <<'USAGE'
Uso: ops/jubileu-report.sh [--quick|--full]

Gera reports operacionais Markdown e JSON para o Projeto Jubileu.

Modos:
  --quick  checks leves: containers, health, Postgres, zumbis, tunel remoto
  --full   checks completos, logs resumidos e dados funcionais (padrao)

Variaveis:
  PROJECT_DIR       default: /srv/ops/stacks/jubileu-v03
  PUBLIC_BASE_URL   default: https://app.jubileuweb.com
  SINCE             default: 24h
  REPORT_DIR        default: $PROJECT_DIR/reports/ops
  MASK_PII          default: 0; use 1 para mascarar nomes em blocos funcionais
USAGE
}

while (($#)); do
  case "$1" in
    --quick)
      MODE="quick"
      ;;
    --full)
      MODE="full"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Argumento invalido: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

REPORT_DIR="${REPORT_DIR:-$PROJECT_DIR/reports/ops}"
COMPOSE_FILE="$PROJECT_DIR/compose.release.yml"
ENV_FILE="${RELEASE_ENV_FILE:-$PROJECT_DIR/.env.release}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
GENERATED_AT="$(date -Iseconds)"
HOST="$(hostname 2>/dev/null || echo unknown)"
USER_NAME="$(whoami 2>/dev/null || echo unknown)"
MD_FILE="$REPORT_DIR/jubileu-report-$TIMESTAMP.md"
JSON_FILE="$REPORT_DIR/jubileu-report-$TIMESTAMP.json"
LATEST_MD="$REPORT_DIR/latest.md"
LATEST_JSON="$REPORT_DIR/latest.json"
TMP_DIR=""

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "Outra execucao do report parece ativa: $LOCK_DIR" >&2
  exit 3
fi

cleanup() {
  rm -rf "$LOCK_DIR"
  if [[ -n "$TMP_DIR" ]]; then
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT

mkdir -p "$REPORT_DIR"
TMP_DIR="$(mktemp -d)"
RAW_MD="$TMP_DIR/report.raw.md"
ALERTS_FILE="$TMP_DIR/alerts.txt"
ACTIONS_FILE="$TMP_DIR/actions.txt"
CHECKS_FILE="$TMP_DIR/checks.tsv"
: > "$ALERTS_FILE"
: > "$ACTIONS_FILE"
: > "$CHECKS_FILE"

cd "$PROJECT_DIR" 2>/dev/null || {
  echo "Nao foi possivel acessar PROJECT_DIR=$PROJECT_DIR" >&2
  exit 1
}

COMPOSE=(docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
DB_CONTAINER="$("${COMPOSE[@]}" ps -q jubileu-db 2>/dev/null || true)"
API_CONTAINER="$("${COMPOSE[@]}" ps -q jubileu-api 2>/dev/null || true)"
NGINX_CONTAINER="$("${COMPOSE[@]}" ps -q nginx 2>/dev/null || true)"

BRANCH="$(git branch --show-current 2>/dev/null || echo unknown)"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

STATUS_RANK=0
FAIL_COUNT=0
WARN_COUNT=0
OK_COUNT=0

status_rank() {
  case "$1" in
    OK) echo 0 ;;
    WARN) echo 1 ;;
    FAIL) echo 2 ;;
    *) echo 1 ;;
  esac
}

overall_status() {
  case "$STATUS_RANK" in
    0) echo "OK" ;;
    1) echo "WARN" ;;
    *) echo "FAIL" ;;
  esac
}

record_check() {
  local key="$1"
  local status="$2"
  local http_code="${3:-}"
  local latency="${4:-}"
  local detail="${5:-}"
  local in_recovery="${6:-}"
  local rank

  rank="$(status_rank "$status")"
  if (( rank > STATUS_RANK )); then
    STATUS_RANK="$rank"
  fi

  case "$status" in
    OK) OK_COUNT=$((OK_COUNT + 1)) ;;
    WARN) WARN_COUNT=$((WARN_COUNT + 1)) ;;
    FAIL) FAIL_COUNT=$((FAIL_COUNT + 1)) ;;
  esac

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$key" "$status" "$http_code" "$latency" "$detail" "$in_recovery" >> "$CHECKS_FILE"
}

add_alert() {
  local status="$1"
  local message="$2"
  printf '[%s] %s\n' "$status" "$message" >> "$ALERTS_FILE"
}

add_action() {
  local message="$1"
  printf '%s\n' "$message" >> "$ACTIONS_FILE"
}

sanitize() {
  sed -E \
    -e 's/(--connection-token=)[^ ]+/\1<hidden>/g' \
    -e 's/(--agent-host-bridge-connection-token=)[^ ]+/\1<hidden>/g' \
    -e 's/(connection-token[=:])[A-Za-z0-9._~+\/=-]+/\1<hidden>/Ig' \
    -e 's/(agent-host-bridge-connection-token[=:])[A-Za-z0-9._~+\/=-]+/\1<hidden>/Ig' \
    -e 's#(DATABASE_URL[=:][[:space:]]*)[^[:space:]]+#\1<hidden>#Ig' \
    -e 's/(POSTGRES_PASSWORD[=:][[:space:]]*)[^[:space:]]+/\1<hidden>/Ig' \
    -e 's/([A-Za-z0-9_]*(SECRET|TOKEN|KEY)[A-Za-z0-9_]*[=:][[:space:]]*)[^[:space:]]+/\1<hidden>/Ig'
}

mask_pii() {
  if [[ "$MASK_PII" == "1" ]]; then
    sed -E \
      -e 's/(^nome[[:space:]]*\|[[:space:]]*).+/\1<MASKED>/I' \
      -e 's/(^turma_nome[[:space:]]*\|[[:space:]]*).+/\1<MASKED>/I' \
      -e 's/("nome"[[:space:]]*:[[:space:]]*")[^"]+/\1<MASKED>/g'
  else
    cat
  fi
}

capture() {
  local cmd="$1"
  local limit="${2:-120}"
  bash -lc "$cmd" 2>&1 | sanitize | tail -n "$limit" || true
}

capture_functional() {
  local cmd="$1"
  local limit="${2:-120}"
  bash -lc "$cmd" 2>&1 | sanitize | mask_pii | tail -n "$limit" || true
}

journal_since() {
  case "$SINCE" in
    *h)
      printf '%s hours ago' "${SINCE%h}"
      ;;
    *d)
      printf '%s days ago' "${SINCE%d}"
      ;;
    *)
      printf '%s' "$SINCE"
      ;;
  esac
}

latency_warn() {
  local latency="$1"
  local threshold="$2"
  python3 - "$latency" "$threshold" <<'PY'
import sys
try:
    latency = float(sys.argv[1])
    threshold = float(sys.argv[2])
except Exception:
    sys.exit(1)
sys.exit(0 if latency > threshold else 1)
PY
}

curl_get_check() {
  local key="$1"
  local label="$2"
  local url="$3"
  local threshold="$4"
  local tmp_err metrics rc http_code latency status detail

  tmp_err="$TMP_DIR/$key.err"
  metrics="$(curl -sS -o /dev/null -w '%{http_code} %{time_total}' --max-time 20 "$url" 2>"$tmp_err")"
  rc=$?
  http_code="${metrics%% *}"
  latency="${metrics#* }"
  [[ "$http_code" == "$latency" ]] && latency=""

  if [[ "$rc" -ne 0 || "$http_code" != "200" ]]; then
    status="FAIL"
    detail="$label falhou em $url"
    [[ -s "$tmp_err" ]] && detail="$detail: $(tr '\n' ' ' < "$tmp_err" | sanitize)"
    add_alert "FAIL" "$detail"
    add_action "Investigar conectividade de $label e validar $url com GET."
  elif latency_warn "$latency" "$threshold"; then
    status="WARN"
    detail="$label respondeu 200 com latencia alta (${latency}s)"
    add_alert "WARN" "$detail"
    add_action "Acompanhar latencia de $label; repetir o report e verificar NGINX/API se persistir."
  else
    status="OK"
    detail="$label respondeu 200"
  fi

  record_check "$key" "$status" "$http_code" "$latency" "$detail" ""
}

docker_status_check() {
  local expected missing=0 unhealthy=0 warn=0 output name status
  output="$("${COMPOSE[@]}" ps --format '{{.Service}}|{{.Status}}' 2>&1 || true)"
  for expected in jubileu-api jubileu-db nginx; do
    if ! grep -q "^$expected|" <<<"$output"; then
      missing=$((missing + 1))
    fi
  done
  while IFS='|' read -r name status; do
    [[ -z "$name" ]] && continue
    if grep -qi 'unhealthy\|exited\|dead\|restarting' <<<"$status"; then
      unhealthy=$((unhealthy + 1))
    elif ! grep -qi 'healthy' <<<"$status"; then
      warn=$((warn + 1))
    fi
  done <<<"$output"

  if (( missing > 0 || unhealthy > 0 )); then
    record_check "docker" "FAIL" "" "" "containers ausentes=$missing unhealthy=$unhealthy" ""
    add_alert "FAIL" "Containers Jubileu ausentes ou unhealthy."
    add_action "Rodar docker compose ps/logs e restaurar containers unhealthy antes de validar runtime."
  elif (( warn > 0 )); then
    record_check "docker" "WARN" "" "" "containers sem healthcheck explicito=$warn" ""
    add_alert "WARN" "Algum container Jubileu esta sem status healthy explicito."
  else
    record_check "docker" "OK" "" "" "containers Jubileu esperados estao healthy" ""
  fi
}

postgres_check() {
  local ready recovery status detail
  ready="$(docker exec "$DB_CONTAINER" sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' 2>&1 || true)"
  recovery="$(docker exec "$DB_CONTAINER" sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "SELECT pg_is_in_recovery();"' 2>/dev/null | tr -d '[:space:]' || true)"

  if ! grep -qi 'accepting connections' <<<"$ready"; then
    status="FAIL"
    detail="Postgres nao esta aceitando conexoes"
    add_alert "FAIL" "$detail"
    add_action "Verificar logs do jubileu-db e restaurar disponibilidade do PostgreSQL."
  elif [[ "$recovery" == "t" ]]; then
    status="FAIL"
    detail="Postgres esta em recovery"
    add_alert "FAIL" "$detail"
    add_action "Aguardar ou investigar recovery do PostgreSQL antes de operacao funcional."
  elif [[ "$recovery" == "f" ]]; then
    status="OK"
    detail="Postgres aceitando conexoes e fora de recovery"
  else
    status="WARN"
    detail="Nao foi possivel confirmar pg_is_in_recovery"
    add_alert "WARN" "$detail"
  fi

  record_check "postgres" "$status" "" "" "$detail" "$([[ "$recovery" == "t" ]] && echo true || echo false)"
}

zombie_check() {
  local zombies
  zombies="$(ps -eo stat= 2>/dev/null | awk '$1 ~ /Z/ {count++} END {print count+0}')"
  if [[ "$zombies" -gt 0 ]]; then
    record_check "zombies" "FAIL" "" "" "processos zumbis encontrados=$zombies" ""
    add_alert "FAIL" "Ha $zombies processo(s) zumbi(s) no host."
    add_action "Inspecionar processos zumbis e processo pai responsavel."
  else
    record_check "zombies" "OK" "" "" "nenhum processo zumbi encontrado" ""
  fi
}

cloudflared_check() {
  local active logs status detail
  active="$(systemctl is-active cloudflared 2>/dev/null || true)"
  logs="$(journalctl -u cloudflared --since "$(journal_since)" --no-pager -n 200 2>/dev/null || true)"

  if [[ "$active" != "active" ]]; then
    status="FAIL"
    detail="cloudflared nao esta active"
    add_alert "FAIL" "$detail"
    add_action "Verificar systemctl status cloudflared e restaurar o tunnel publico."
  elif grep -Eqi 'timeout|reconnect|Retrying connection|Connection terminated|outdated' <<<"$logs"; then
    status="WARN"
    detail="cloudflared ativo com timeouts/reconexoes ou versao desatualizada em $SINCE"
    add_alert "WARN" "$detail"
    add_action "Planejar upgrade do cloudflared e monitorar recorrencia de timeouts QUIC."
  else
    status="OK"
    detail="cloudflared ativo sem alertas recentes relevantes"
  fi

  record_check "cloudflared" "$status" "" "" "$detail" ""
}

vscode_tunnel_check() {
  local active connected status detail cpu_rows
  active="$(systemctl --user is-active code-tunnel.service 2>/dev/null || true)"
  if cd "$HOME/.local/bin/vscode-cli" 2>/dev/null; then
    connected="$(./code tunnel status 2>/dev/null | head -c 2000 || true)"
    cd "$PROJECT_DIR" || exit 1
  else
    connected=""
  fi
  # CPU snapshots require the process list because the percentage is not exposed by pgrep.
  # shellcheck disable=SC2009
  cpu_rows="$(ps -eo pcpu=,cmd= --sort=-pcpu 2>/dev/null \
    | grep -Ei 'code|vscode|codex|server-main|extensionHost|fileWatcher' \
    | grep -v grep \
    | awk '$1+0 > 50 {print}' \
    | head -5)"

  if [[ -n "$cpu_rows" ]]; then
    status="WARN"
    detail="processos VS Code/Codex acima de 50% CPU no snapshot"
    add_alert "WARN" "$detail"
    add_action "Observar consumo de VS Code/Codex se houver lentidao no host."
  elif [[ "$active" == "active" || "$connected" == *"Connected"* ]]; then
    status="OK"
    detail="VS Code Tunnel/Codex remoto ativo"
  else
    status="WARN"
    detail="VS Code Tunnel nao confirmou estado ativo"
    add_alert "WARN" "$detail"
  fi

  record_check "vscode_tunnel" "$status" "" "" "$detail" ""
}

nginx_error_check() {
  local count
  count="$(docker logs --since="$SINCE" "$NGINX_CONTAINER" 2>&1 \
    | grep -Ec '"[^"]+" 50[234] | 50[234] |upstream.*(failed|error)' || true)"
  if [[ "$count" -gt 0 ]]; then
    record_check "nginx_5xx" "FAIL" "" "" "NGINX 502/503/504 recentes=$count" ""
    add_alert "FAIL" "NGINX registrou $count ocorrencia(s) 502/503/504 ou upstream error em $SINCE."
    add_action "Inspecionar logs NGINX/API para erros 502/503/504 antes de considerar runtime saudavel."
  else
    record_check "nginx_5xx" "OK" "" "" "sem NGINX 502/503/504 recentes" ""
  fi
}

public_head_diagnostic() {
  local key="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /dev/null -I -L -w '%{http_code}' --max-time 15 "$url" 2>/dev/null || echo 000)"
  if [[ "$code" == "405" ]]; then
    record_check "$key" "OK" "$code" "" "HEAD retornou 405 em $url; informativo apenas, GET e o criterio principal" ""
  fi
}

functional_evidence_check() {
  local participantes_count
  participantes_count="$(docker exec "$DB_CONTAINER" sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "SELECT COUNT(*) FROM evento_participantes;"' 2>/dev/null | tr -d '[:space:]' || true)"
  if [[ "$participantes_count" == "0" ]]; then
    record_check "participantes" "WARN" "" "" "evento_participantes vazio; sem evidencia operacional de RSVP/check-in" ""
    add_alert "WARN" "evento_participantes esta vazio; RSVP/check-in ainda sem evidencia operacional."
    add_action "Executar validacao manual/auditavel de RSVP/check-in antes de marcar UC06 como evidenciada."
  elif [[ "$participantes_count" =~ ^[0-9]+$ ]]; then
    record_check "participantes" "OK" "" "" "evento_participantes possui $participantes_count registro(s)" ""
  else
    record_check "participantes" "WARN" "" "" "nao foi possivel contar evento_participantes" ""
    add_alert "WARN" "Nao foi possivel contar evento_participantes."
  fi
}

run_checks() {
  docker_status_check
  curl_get_check "local_health" "Health local /health" "$LOCAL_BASE_URL/health" "2"
  curl_get_check "local_ready" "Readiness local /api/ready" "$LOCAL_BASE_URL/api/ready" "2"
  curl_get_check "public_health" "Health publico /health" "$PUBLIC_BASE_URL/health" "5"
  curl_get_check "api_ready" "Readiness publica /api/ready" "$PUBLIC_BASE_URL/api/ready" "5"
  postgres_check
  zombie_check
  cloudflared_check
  vscode_tunnel_check
  public_head_diagnostic "head_public_health" "$PUBLIC_BASE_URL/health"
  public_head_diagnostic "head_api_ready" "$PUBLIC_BASE_URL/api/ready"

  if [[ "$MODE" == "full" ]]; then
    nginx_error_check
    functional_evidence_check
  fi
}

checks_markdown_table() {
  awk -F '\t' '
    BEGIN {
      print "| Check | Status | HTTP | Latencia | Detalhe |"
      print "|---|---|---:|---:|---|"
    }
    {
      http=$3 == "" ? "-" : $3
      lat=$4 == "" ? "-" : $4 "s"
      gsub(/\|/, "\\|", $5)
      print "| `" $1 "` | " $2 " | " http " | " lat " | " $5 " |"
    }
  ' "$CHECKS_FILE"
}

list_file_as_bullets() {
  local file="$1"
  if [[ -s "$file" ]]; then
    sed 's/^/- /' "$file"
  else
    echo "- Nenhum."
  fi
}

emit_section_cmd() {
  local title="$1"
  local cmd="$2"
  local limit="${3:-120}"
  {
    echo "## $title"
    echo '```'
    capture "$cmd" "$limit"
    echo '```'
    echo
  } >> "$RAW_MD"
}

emit_section_functional() {
  local title="$1"
  local cmd="$2"
  local limit="${3:-80}"
  {
    echo "$title"
    echo '```'
    capture_functional "$cmd" "$limit"
    echo '```'
    echo
  } >> "$RAW_MD"
}

write_markdown() {
  local status
  status="$(overall_status)"

  {
    echo "# Report Operacional - Projeto Jubileu"
    echo
    echo "Gerado em: $GENERATED_AT"
    echo "Host: $HOST"
    echo "Usuario: $USER_NAME"
    echo "Diretorio: $PROJECT_DIR"
    echo "Modo: --$MODE"
    echo "Branch/commit: $BRANCH / $COMMIT"
    echo "Status geral: $status"
    echo
    echo "## Resumo executivo"
    echo
    echo "- OK: $OK_COUNT"
    echo "- WARN: $WARN_COUNT"
    echo "- FAIL: $FAIL_COUNT"
    echo
    echo "## Acoes sugeridas"
    echo
    list_file_as_bullets "$ACTIONS_FILE"
    echo
    echo "## Checks classificados"
    echo
    checks_markdown_table
    echo
    echo "## Alertas rapidos"
    echo
    list_file_as_bullets "$ALERTS_FILE"
    echo
  } > "$RAW_MD"

  emit_section_cmd "Git" "git branch --show-current; git status -sb; git log --oneline --decorate -5" 40
  emit_section_cmd "Maquina" "uptime; free -h; df -h /; echo; ps -eo pid,ppid,stat,pcpu,pmem,etime,cmd --sort=-pcpu | head -25" 80
  emit_section_cmd "Docker Compose" "docker compose --project-name '$COMPOSE_PROJECT_NAME' --env-file '$ENV_FILE' -f '$COMPOSE_FILE' ps" 80

  {
    echo "## Health local"
    echo '```'
    capture "curl -sS -o /dev/null -w 'GET /health HTTP=%{http_code} tempo=%{time_total}s\n' --max-time 20 '$LOCAL_BASE_URL/health'; curl -sS -o /dev/null -w 'GET /api/ready HTTP=%{http_code} tempo=%{time_total}s\n' --max-time 20 '$LOCAL_BASE_URL/api/ready'" 20
    echo '```'
    echo
    echo "## Health publico"
    echo '```'
    capture "curl -sS -o /dev/null -w 'GET /health HTTP=%{http_code} tempo=%{time_total}s\n' --max-time 20 '$PUBLIC_BASE_URL/health'; curl -sS -o /dev/null -w 'GET /api/ready HTTP=%{http_code} tempo=%{time_total}s\n' --max-time 20 '$PUBLIC_BASE_URL/api/ready'" 20
    echo
    echo "HEAD diagnostico informativo, nao usado como criterio principal:"
    capture "curl -sS -I -L --max-time 15 '$PUBLIC_BASE_URL/health' | sed -n '1,8p'; echo; curl -sS -I -L --max-time 15 '$PUBLIC_BASE_URL/api/ready' | sed -n '1,8p'" 30
    echo '```'
    echo
  } >> "$RAW_MD"

  emit_section_cmd "Cloudflared" "ps aux | grep -Ei 'cloudflared' | grep -v grep || true; echo; systemctl status cloudflared --no-pager 2>/dev/null || true; echo; journalctl -u cloudflared --since '$(journal_since)' --no-pager -n 80 2>/dev/null || true" 140

  if [[ "$MODE" == "full" ]]; then
    emit_section_cmd "NGINX acessos recentes" "docker logs --since='$SINCE' --tail=120 '$NGINX_CONTAINER' 2>&1" 140
    emit_section_cmd "NGINX contagem por status" "docker logs --since='$SINCE' '$NGINX_CONTAINER' 2>&1 | awk '{print \$9}' | grep -E '^[0-9]{3}$' | sort | uniq -c | sort -nr" 40
    emit_section_cmd "NGINX rotas mais acessadas" "docker logs --since='$SINCE' '$NGINX_CONTAINER' 2>&1 | awk '{print \$7}' | grep '^/' | sort | uniq -c | sort -nr | head -30" 50
    emit_section_cmd "API logs recentes" "docker logs --since='$SINCE' --tail=160 '$API_CONTAINER' 2>&1" 180
    emit_section_cmd "Banco logs recentes" "docker logs --since='$SINCE' --tail=120 '$DB_CONTAINER' 2>&1" 140
  else
    {
      echo "## NGINX acessos recentes"
      echo
      echo "Omitido em modo --quick. Use --full para logs e agregacoes."
      echo
      echo "## NGINX contagem por status"
      echo
      echo "Omitido em modo --quick."
      echo
      echo "## NGINX rotas mais acessadas"
      echo
      echo "Omitido em modo --quick."
      echo
      echo "## API logs recentes"
      echo
      echo "Omitido em modo --quick."
      echo
      echo "## Banco logs recentes"
      echo
      echo "Omitido em modo --quick."
      echo
    } >> "$RAW_MD"
  fi

  emit_section_cmd "Banco estado atual" "docker exec '$DB_CONTAINER' sh -lc 'pg_isready -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\"' || true; docker exec '$DB_CONTAINER' sh -lc 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"SELECT now() AS agora, pg_is_in_recovery() AS em_recovery;\"' || true; echo; docker exec '$DB_CONTAINER' sh -lc 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"\\dt\"' || true" 120

  {
    echo "## Eventos funcionais"
    echo
  } >> "$RAW_MD"

  if [[ "$MODE" == "full" ]]; then
    emit_section_functional "### Eventos" "docker exec '$DB_CONTAINER' sh -lc 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -x -c \"SELECT * FROM eventos ORDER BY id DESC LIMIT 20;\"' 2>/dev/null || true" 90
    emit_section_functional "### Participantes/RSVP/check-in" "docker exec '$DB_CONTAINER' sh -lc 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -x -c \"SELECT * FROM evento_participantes ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 30;\"' 2>/dev/null || true" 90
    emit_section_functional "### Lances" "docker exec '$DB_CONTAINER' sh -lc 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -x -c \"SELECT * FROM lances ORDER BY created_at DESC LIMIT 30;\"' 2>/dev/null || true" 90
    emit_section_functional "### Partidas" "docker exec '$DB_CONTAINER' sh -lc 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -x -c \"SELECT * FROM partidas ORDER BY id DESC LIMIT 30;\"' 2>/dev/null || true" 90
    emit_section_functional "### Team configs" "docker exec '$DB_CONTAINER' sh -lc 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -x -c \"SELECT id, evento_id, version, created_at, is_active, estado FROM team_configs ORDER BY created_at DESC LIMIT 20;\"' 2>/dev/null || true" 120
  else
    {
      echo "### Eventos"
      echo
      echo "Omitido em modo --quick."
      echo
      echo "### Participantes/RSVP/check-in"
      echo
      echo "Omitido em modo --quick."
      echo
      echo "### Lances"
      echo
      echo "Omitido em modo --quick."
      echo
      echo "### Partidas"
      echo
      echo "Omitido em modo --quick."
      echo
      echo "### Team configs"
      echo
      echo "Omitido em modo --quick."
      echo
    } >> "$RAW_MD"
  fi

  emit_section_cmd "VS Code Tunnel/Codex remoto" "cd '$HOME/.local/bin/vscode-cli' 2>/dev/null && ./code tunnel status || true; echo; systemctl --user is-active code-tunnel.service || true; echo; ps -eo pid,ppid,stat,pcpu,pmem,etime,cmd --sort=-pcpu | grep -Ei 'code|vscode|agent host|code-server|server-main|extensionHost|fileWatcher|remote-containers|devContainers|vscode-remote-containers|codex' | grep -v grep | head -25 || true" 80

  sanitize < "$RAW_MD" > "$MD_FILE"
  cp "$MD_FILE" "$LATEST_MD"
}

write_json() {
  export GENERATED_AT HOST BRANCH COMMIT MODE PUBLIC_BASE_URL PROJECT_DIR SINCE MASK_PII
  export OVERALL_STATUS
  export CHECKS_FILE ALERTS_FILE ACTIONS_FILE MD_FILE JSON_FILE LATEST_MD LATEST_JSON
  OVERALL_STATUS="$(overall_status)"
  python3 <<'PY'
import json
import os

checks = {}
checks_file = os.environ["CHECKS_FILE"]
with open(checks_file, encoding="utf-8") as fh:
    for line in fh:
        key, status, http_code, latency, detail, in_recovery = line.rstrip("\n").split("\t")
        item = {"status": status}
        if http_code:
            try:
                item["http_code"] = int(http_code)
            except ValueError:
                item["http_code"] = http_code
        if latency:
            try:
                item["latency_seconds"] = float(latency)
            except ValueError:
                item["latency_seconds"] = latency
        if detail:
            item["detail"] = detail
        if in_recovery:
            item["in_recovery"] = in_recovery.lower() == "true"
        checks[key] = item

def read_lines(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as fh:
        return [line.rstrip("\n") for line in fh if line.strip()]

payload = {
    "generated_at": os.environ["GENERATED_AT"],
    "host": os.environ["HOST"],
    "branch": os.environ["BRANCH"],
    "commit": os.environ["COMMIT"],
    "mode": os.environ["MODE"],
    "project_dir": os.environ["PROJECT_DIR"],
    "public_base_url": os.environ["PUBLIC_BASE_URL"],
    "since": os.environ["SINCE"],
    "mask_pii": os.environ["MASK_PII"] == "1",
    "overall_status": os.environ["OVERALL_STATUS"],
    "checks": checks,
    "alerts": read_lines(os.environ["ALERTS_FILE"]),
    "suggested_actions": read_lines(os.environ["ACTIONS_FILE"]),
    "report_files": {
        "markdown": os.environ["MD_FILE"],
        "json": os.environ["JSON_FILE"],
        "latest_markdown": os.environ["LATEST_MD"],
        "latest_json": os.environ["LATEST_JSON"],
    },
}

with open(os.environ["JSON_FILE"], "w", encoding="utf-8") as fh:
    json.dump(payload, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
PY
  cp "$JSON_FILE" "$LATEST_JSON"
}

run_checks
write_markdown
write_json

echo "Reports gerados:"
echo "$MD_FILE"
echo "$JSON_FILE"
echo "Latest:"
echo "$LATEST_MD"
echo "$LATEST_JSON"
