#!/usr/bin/env bash
set -euo pipefail

TUNNEL_NAME="jubileu-wsl"
UNIT_NAME="jubileu-wsl-tunnel"
MEM_MIN_KIB=$((1536 * 1024))
SETSID_MEM_MIN_KIB=$((2048 * 1024))
CODE_CLI="${CODE_CLI:-$HOME/.local/bin/vscode-cli/code}"
STATE_DIR="${STATE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/jubileu/dev-tunnel}"
CLI_DATA_DIR="$STATE_DIR/cli-data"
PID_FILE="$STATE_DIR/tunnel.pid"
PGID_FILE="$STATE_DIR/tunnel.pgid"
MODE_FILE="$STATE_DIR/mode"
UNIT_FILE="$STATE_DIR/unit"
LOG_FILE="$STATE_DIR/tunnel.log"
LOCK_FILE="$STATE_DIR/start.lock"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
STATUS_SCRIPT="$SCRIPT_DIR/dev-tunnel-status.sh"

FORCE=0
ALLOW_UNBOUNDED=0
DRY_RUN=0

usage() {
  cat <<'USAGE'
Uso: ops/wsl/start-dev-tunnel.sh [--dry-run] [--force] [--allow-unbounded]

Inicia o VS Code Tunnel de desenvolvimento jubileu-wsl dentro do WSL.
Nao inicia Docker, Cloudflare Tunnel, NGINX, API, banco ou migrations.

Opcoes:
  --dry-run           Mostra a decisao sem iniciar o tunnel.
  --force             Permite iniciar com MemAvailable abaixo de 1.5 GiB.
  --allow-unbounded   Permite fallback setsid sem limite cgroup quando systemd-run falhar.
USAGE
}

while (($#)); do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      ;;
    --force)
      FORCE=1
      ;;
    --allow-unbounded)
      ALLOW_UNBOUNDED=1
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

mem_available_kib() {
  awk '/^MemAvailable:/ {print $2; exit}' /proc/meminfo 2>/dev/null || true
}

format_mem() {
  local kib="$1"
  if [[ -z "$kib" ]]; then
    printf 'unknown'
    return
  fi

  awk -v kib="$kib" 'BEGIN { printf "%.2f GiB", kib / 1024 / 1024 }'
}

timestamp() {
  date -Iseconds
}

log_event() {
  mkdir -p "$STATE_DIR"
  printf '%s %s\n' "$(timestamp)" "$*" >> "$LOG_FILE"
}

write_metadata_systemd() {
  mkdir -p "$STATE_DIR"
  printf 'systemd-transient\n' > "$MODE_FILE"
  printf '%s\n' "$UNIT_NAME" > "$UNIT_FILE"
  : > "$PID_FILE"
  : > "$PGID_FILE"
}

write_metadata_setsid() {
  local pid="$1"
  local pgid="$2"
  mkdir -p "$STATE_DIR"
  printf 'setsid\n' > "$MODE_FILE"
  printf '%s\n' "$pid" > "$PID_FILE"
  printf '%s\n' "$pgid" > "$PGID_FILE"
  : > "$UNIT_FILE"
}

status_output() {
  if [[ ! -x "$STATUS_SCRIPT" ]]; then
    echo "STATUS_SCRIPT nao encontrado ou nao executavel: $STATUS_SCRIPT" >&2
    exit 2
  fi

  "$STATUS_SCRIPT" 2>&1 || true
}

state_from_status() {
  awk -F= '/^state=/ {print $2; exit}'
}

systemd_run_available() {
  command -v systemd-run >/dev/null 2>&1
}

systemd_unit_active() {
  command -v systemctl >/dev/null 2>&1 || return 1
  systemctl --user is-active --quiet "$UNIT_NAME" 2>/dev/null
}

systemd_start() {
  local -a cmd=(
    systemd-run --user
    --unit "$UNIT_NAME"
    "--setenv=VSCODE_CLI_DATA_DIR=$CLI_DATA_DIR"
    -p MemoryHigh=512M
    -p MemoryMax=768M
    -p CPUQuota=80%
    "$CODE_CLI" tunnel
    --name "$TUNNEL_NAME"
    --accept-server-license-terms
    --reconnection-grace-time 300
  )

  if (( DRY_RUN )); then
    printf 'dry-run: '
    printf '%q ' "${cmd[@]}"
    printf '\n'
    return 0
  fi

  VSCODE_CLI_DATA_DIR="$CLI_DATA_DIR" "${cmd[@]}"
}

setsid_start() {
  local -a cmd=(
    "$CODE_CLI" tunnel
    --name "$TUNNEL_NAME"
    --accept-server-license-terms
    --reconnection-grace-time 300
  )

  if (( DRY_RUN )); then
    printf 'dry-run: VSCODE_CLI_DATA_DIR=%q setsid ' "$CLI_DATA_DIR"
    printf '%q ' "${cmd[@]}"
    printf '\n'
    return 0
  fi

  nohup env VSCODE_CLI_DATA_DIR="$CLI_DATA_DIR" setsid "${cmd[@]}" >> "$LOG_FILE" 2>&1 &
  printf '%s' "$!"
}

pgid_for_pid() {
  local pid="$1"
  for _ in {1..20}; do
    local pgid
    pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d '[:space:]' || true)"
    if [[ -n "$pgid" ]]; then
      printf '%s' "$pgid"
      return 0
    fi
    sleep 0.1
  done
  return 1
}

main() {
  if (( ! DRY_RUN )); then
    mkdir -p "$STATE_DIR"

    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then
      echo "Outro start-dev-tunnel.sh ja esta em andamento." >&2
      exit 1
    fi
  fi

  local mem_kib mem_text status state tunnel_cmd systemd_cmd pid pgid
  mem_kib="$(mem_available_kib)"
  mem_text="$(format_mem "$mem_kib")"

  echo "MemAvailable=${mem_kib:-unknown} KiB ($mem_text)"

  if [[ ! -x "$CODE_CLI" ]]; then
    echo "CODE_CLI nao encontrado ou nao executavel: $CODE_CLI" >&2
    exit 2
  fi

  if [[ -z "$mem_kib" ]]; then
    echo "Nao foi possivel ler MemAvailable em /proc/meminfo." >&2
    exit 1
  fi

  if (( mem_kib < MEM_MIN_KIB && ! FORCE )); then
    echo "MemAvailable abaixo de 1.5 GiB; recusando iniciar por padrao." >&2
    echo "Use --force apenas se aceitar risco operacional de memoria." >&2
    exit 1
  fi

  if (( mem_kib < MEM_MIN_KIB && FORCE )); then
    echo "AVISO: iniciando com MemAvailable abaixo de 1.5 GiB por --force." >&2
  fi

  status="$(status_output)"
  state="$(printf '%s\n' "$status" | state_from_status)"

  case "$state" in
    "active managed $TUNNEL_NAME")
      printf '%s\n' "$status"
      echo "Tunnel gerenciado ja esta ativo; nada a fazer."
      exit 0
      ;;
    "active unmanaged tunnel")
      printf '%s\n' "$status"
      echo "Ha um tunnel ativo fora do controle deste script; recusando iniciar duplicado." >&2
      exit 1
      ;;
    "auth required")
      printf '%s\n' "$status"
      echo "Autenticacao do VS Code CLI requerida antes de iniciar o tunnel." >&2
      exit 1
      ;;
  esac

  tunnel_cmd="$CODE_CLI tunnel --name $TUNNEL_NAME --accept-server-license-terms --reconnection-grace-time 300"
  systemd_cmd="systemd-run --user --unit $UNIT_NAME --setenv=VSCODE_CLI_DATA_DIR=$CLI_DATA_DIR -p MemoryHigh=512M -p MemoryMax=768M -p CPUQuota=80% $tunnel_cmd"

  if (( DRY_RUN )); then
    echo "dry-run: preflight aprovado; nenhum processo sera iniciado."
    if systemd_run_available; then
      systemd_start
    elif (( mem_kib >= SETSID_MEM_MIN_KIB || ALLOW_UNBOUNDED )); then
      echo "sem limite cgroup aplicado; usando setsid" >&2
      setsid_start
    else
      echo "dry-run: systemd-run indisponivel e fallback setsid seria recusado sem 2 GiB ou --allow-unbounded." >&2
      exit 1
    fi
    exit 0
  fi

  log_event "start-request mode=preflight MemAvailable=${mem_kib}KiB CODE_CLI=$CODE_CLI STATE_DIR=$STATE_DIR command=$tunnel_cmd"

  if systemd_run_available; then
    if systemd_start; then
      write_metadata_systemd
      log_event "started mode=systemd-transient MemAvailable=${mem_kib}KiB CODE_CLI=$CODE_CLI STATE_DIR=$STATE_DIR unit=$UNIT_NAME command=$systemd_cmd fallback_without_cgroup=no"
      echo "Tunnel iniciado como unidade transitoria de usuario: $UNIT_NAME"
      exit 0
    fi
  fi

  if (( mem_kib < SETSID_MEM_MIN_KIB && ! ALLOW_UNBOUNDED )); then
    echo "systemd-run --user nao funcionou e MemAvailable esta abaixo de 2 GiB; recusando fallback setsid." >&2
    echo "Use --allow-unbounded apenas se aceitar iniciar sem limite cgroup aplicado." >&2
    log_event "refused mode=setsid MemAvailable=${mem_kib}KiB CODE_CLI=$CODE_CLI STATE_DIR=$STATE_DIR reason=low-memory-for-unbounded-fallback fallback_without_cgroup=yes"
    exit 1
  fi

  echo "sem limite cgroup aplicado; usando setsid" >&2

  pid="$(setsid_start)"
  pgid="$(pgid_for_pid "$pid" || true)"
  if [[ -z "$pgid" ]]; then
    echo "Tunnel iniciado, mas nao foi possivel identificar PGID do PID $pid." >&2
    exit 1
  fi

  write_metadata_setsid "$pid" "$pgid"
  log_event "started mode=setsid MemAvailable=${mem_kib}KiB CODE_CLI=$CODE_CLI STATE_DIR=$STATE_DIR pid=$pid pgid=$pgid command=$tunnel_cmd fallback_without_cgroup=yes"
  echo "Tunnel iniciado via setsid: pid=$pid pgid=$pgid"
}

main "$@"
