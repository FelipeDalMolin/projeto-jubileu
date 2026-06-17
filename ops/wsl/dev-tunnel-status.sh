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
CLI_DATA_DIR="$STATE_DIR/cli-data"

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

process_command() {
  local pid="$1"
  ps -p "$pid" -o args= 2>/dev/null || true
}

pgid_for_pid() {
  local pid="$1"
  ps -o pgid= -p "$pid" 2>/dev/null | tr -d '[:space:]' || true
}

is_tunnel_command() {
  local cmd="$1"
  [[ "$cmd" == *" tunnel"* && "$cmd" == *"--name $TUNNEL_NAME"* ]]
}

systemd_unit_active() {
  command -v systemctl >/dev/null 2>&1 || return 1
  systemctl --user is-active --quiet "$UNIT_NAME" 2>/dev/null
}

systemd_main_pid() {
  command -v systemctl >/dev/null 2>&1 || return 0
  systemctl --user show "$UNIT_NAME" -p MainPID --value 2>/dev/null || true
}

cli_status() {
  if [[ ! -x "$CODE_CLI" ]]; then
    return 0
  fi

  if [[ -d "$CLI_DATA_DIR" ]]; then
    VSCODE_CLI_DATA_DIR="$CLI_DATA_DIR" "$CODE_CLI" tunnel status 2>&1 || true
  else
    "$CODE_CLI" tunnel status 2>&1 || true
  fi
}

detect_unmanaged_tunnel() {
  local managed_pid="$1"
  local ps_output status_output

  ps_output="$(
    ps -eo pid=,args= 2>/dev/null |
      awk -v managed_pid="${managed_pid:-}" '
        managed_pid != "" && $1 == managed_pid { next }
        $0 ~ /\/code[[:space:]]+tunnel/ &&
        $0 !~ /[[:space:]]tunnel[[:space:]]+status/ &&
        $0 !~ /[[:space:]]tunnel[[:space:]]+--help/ {
          print
        }
      '
  )"

  if [[ -n "${ps_output//[[:space:]]/}" ]]; then
    return 0
  fi

  status_output="$(cli_status)"
  if [[ "$status_output" == *'"tunnel":null'* ]]; then
    return 1
  fi

  if [[ "$status_output" == *"authentication"* || "$status_output" == *"login"* || "$status_output" == *"not logged"* ]]; then
    return 1
  fi

  [[ "$status_output" == *"tunnel"* && "$status_output" != *'"tunnel":null'* ]]
}

detect_auth_required() {
  local status_output="$1"
  [[ "$status_output" == *"authentication"* || "$status_output" == *"login"* || "$status_output" == *"not logged"* ]]
}

print_status() {
  local state="$1"
  local mode="${2:-}"
  local pid="${3:-}"
  local pgid="${4:-}"
  local unit="${5:-}"
  local detail="${6:-}"
  local mem_kib

  mem_kib="$(mem_available_kib)"

  printf 'state=%s\n' "$state"
  printf 'MemAvailable=%s KiB (%s)\n' "${mem_kib:-unknown}" "$(format_mem "$mem_kib")"
  printf 'CODE_CLI=%s\n' "$CODE_CLI"
  printf 'STATE_DIR=%s\n' "$STATE_DIR"

  if [[ -n "$mode" ]]; then
    printf 'mode=%s\n' "$mode"
  fi
  if [[ -n "$unit" ]]; then
    printf 'unit=%s\n' "$unit"
  fi
  if [[ -n "$pid" ]]; then
    printf 'pid=%s\n' "$pid"
  fi
  if [[ -n "$pgid" ]]; then
    printf 'pgid=%s\n' "$pgid"
  fi
  if [[ -n "$detail" ]]; then
    printf 'detail=%s\n' "$detail"
  fi
}

main() {
  if [[ ! -x "$CODE_CLI" ]]; then
    print_status "code CLI missing"
    return 2
  fi

  local mode pid pgid unit cmd status_output main_pid
  mode="$(read_first_line "$MODE_FILE")"
  pid="$(read_first_line "$PID_FILE")"
  pgid="$(read_first_line "$PGID_FILE")"
  unit="$(read_first_line "$UNIT_FILE")"
  status_output="$(cli_status)"

  if [[ "$mode" == "systemd-transient" || "$unit" == "$UNIT_NAME" ]]; then
    if systemd_unit_active; then
      main_pid="$(systemd_main_pid)"
      print_status "active managed $TUNNEL_NAME" "systemd-transient" "$main_pid" "" "$UNIT_NAME"
      return 0
    fi

    print_status "stale pid" "systemd-transient" "" "" "${unit:-$UNIT_NAME}" "managed unit metadata exists, but unit is not active"
    return 1
  fi

  if [[ "$mode" == "setsid" || -n "$pid" || -n "$pgid" ]]; then
    if process_alive "$pid"; then
      cmd="$(process_command "$pid")"
      local actual_pgid
      actual_pgid="$(pgid_for_pid "$pid")"
      if is_tunnel_command "$cmd"; then
        print_status "active managed $TUNNEL_NAME" "setsid" "$pid" "${pgid:-$actual_pgid}" ""
        return 0
      fi
    fi

    print_status "stale pid" "setsid" "$pid" "$pgid" "" "managed pid metadata exists, but process is absent or not the expected tunnel"
    return 1
  fi

  if detect_auth_required "$status_output"; then
    print_status "auth required" "" "" "" "" "run the VS Code CLI login flow before starting the tunnel"
    return 3
  fi

  if detect_unmanaged_tunnel ""; then
    print_status "active unmanaged tunnel" "" "" "" "" "a VS Code tunnel exists outside the managed $TUNNEL_NAME metadata"
    return 1
  fi

  print_status "inactive"
}

main "$@"
