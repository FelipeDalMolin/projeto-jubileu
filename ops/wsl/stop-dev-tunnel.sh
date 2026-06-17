#!/usr/bin/env bash
set -euo pipefail

TUNNEL_NAME="jubileu-wsl"
UNIT_NAME="jubileu-wsl-tunnel"
CODE_CLI="${CODE_CLI:-$HOME/.local/bin/vscode-cli/code}"
STATE_DIR="${STATE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/jubileu/dev-tunnel}"
PID_FILE="$STATE_DIR/tunnel.pid"
PGID_FILE="$STATE_DIR/tunnel.pgid"
MODE_FILE="$STATE_DIR/mode"
UNIT_FILE="$STATE_DIR/unit"
LOG_FILE="$STATE_DIR/tunnel.log"

DRY_RUN=0
FORCE=0

usage() {
  cat <<'USAGE'
Uso: ops/wsl/stop-dev-tunnel.sh [--dry-run] [--force]

Para somente o VS Code Tunnel jubileu-wsl gerenciado por estes scripts.
Nao para VS Code Server, Docker, Cloudflare Tunnel, NGINX, API ou banco.
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

timestamp() {
  date -Iseconds
}

log_event() {
  mkdir -p "$STATE_DIR"
  printf '%s %s\n' "$(timestamp)" "$*" >> "$LOG_FILE"
}

clear_metadata() {
  mkdir -p "$STATE_DIR"
  : > "$MODE_FILE"
  : > "$PID_FILE"
  : > "$PGID_FILE"
  : > "$UNIT_FILE"
}

read_first_line() {
  local path="$1"
  if [[ -f "$path" ]]; then
    sed -n '1p' "$path"
  fi
}

process_alive() {
  local pid="$1"
  [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null
}

pgid_for_pid() {
  local pid="$1"
  ps -o pgid= -p "$pid" 2>/dev/null | tr -d '[:space:]' || true
}

process_command() {
  local pid="$1"
  ps -p "$pid" -o args= 2>/dev/null || true
}

is_tunnel_command() {
  local cmd="$1"
  [[ "$cmd" == *" tunnel"* && "$cmd" == *"--name $TUNNEL_NAME"* ]]
}

systemd_unit_active() {
  command -v systemctl >/dev/null 2>&1 || return 1
  systemctl --user is-active --quiet "$UNIT_NAME" 2>/dev/null
}

stop_systemd_unit() {
  if (( DRY_RUN )); then
    echo "dry-run: systemctl --user stop $UNIT_NAME"
    return 0
  fi

  systemctl --user stop "$UNIT_NAME"
}

stop_setsid_group() {
  local pid="$1"
  local expected_pgid="$2"
  local actual_pgid cmd

  if ! process_alive "$pid"; then
    echo "PID gerenciado nao esta ativo: $pid"
    return 0
  fi

  actual_pgid="$(pgid_for_pid "$pid")"
  cmd="$(process_command "$pid")"

  if [[ -z "$actual_pgid" || "$actual_pgid" != "$expected_pgid" ]]; then
    echo "PGID nao confere para PID gerenciado; recusando parar." >&2
    exit 1
  fi

  if ! is_tunnel_command "$cmd"; then
    echo "PID gerenciado nao parece ser o tunnel $TUNNEL_NAME; recusando parar." >&2
    exit 1
  fi

  if (( DRY_RUN )); then
    echo "dry-run: kill -TERM -$actual_pgid"
    if (( FORCE )); then
      echo "dry-run: --force permitiria kill -KILL -$actual_pgid apos timeout"
    fi
    return 0
  fi

  kill -TERM "-$actual_pgid"

  for _ in {1..30}; do
    if ! process_alive "$pid"; then
      return 0
    fi
    sleep 0.2
  done

  if (( FORCE )); then
    kill -KILL "-$actual_pgid"
    return 0
  fi

  echo "Tunnel ainda ativo apos TERM; use --force para encerrar o PGID gerenciado." >&2
  exit 1
}

main() {
  local mode pid pgid unit

  mode="$(read_first_line "$MODE_FILE")"
  pid="$(read_first_line "$PID_FILE")"
  pgid="$(read_first_line "$PGID_FILE")"
  unit="$(read_first_line "$UNIT_FILE")"

  case "$mode" in
    systemd-transient)
      if [[ "${unit:-$UNIT_NAME}" != "$UNIT_NAME" ]]; then
        echo "Unit metadata inesperada: ${unit:-<vazia>}" >&2
        exit 1
      fi

      if ! systemd_unit_active; then
        echo "Unidade gerenciada nao esta ativa: $UNIT_NAME"
        if (( ! DRY_RUN )); then
          log_event "stop-noop mode=systemd-transient unit=$UNIT_NAME reason=inactive"
          clear_metadata
        fi
        exit 0
      fi

      stop_systemd_unit
      if (( ! DRY_RUN )); then
        log_event "stopped mode=systemd-transient unit=$UNIT_NAME dry_run=$DRY_RUN"
        clear_metadata
      fi
      echo "Stop solicitado somente para unidade gerenciada: $UNIT_NAME"
      ;;
    setsid)
      if [[ -z "$pid" || -z "$pgid" ]]; then
        echo "Metadata setsid incompleta; recusando parar." >&2
        exit 1
      fi

      stop_setsid_group "$pid" "$pgid"
      if (( ! DRY_RUN )); then
        log_event "stopped mode=setsid pid=$pid pgid=$pgid dry_run=$DRY_RUN force=$FORCE"
        clear_metadata
      fi
      echo "Stop solicitado somente para PGID gerenciado: $pgid"
      ;;
    "")
      echo "Nenhum tunnel gerenciado registrado em $STATE_DIR."
      ;;
    *)
      echo "Modo gerenciado desconhecido: $mode" >&2
      exit 1
      ;;
  esac
}

main "$@"
