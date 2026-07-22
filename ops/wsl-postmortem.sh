#!/usr/bin/env bash

set -u

PROJECT_DIR="${PROJECT_DIR:-/srv/ops/stacks/jubileu-v03}"
RELEASE_ENV_FILE="${RELEASE_ENV_FILE:-$PROJECT_DIR/.env.release}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-jubileu-v03}"
NGINX_PORT="${NGINX_PORT:-80}"
REPORT_DIR="${REPORT_DIR:-$PROJECT_DIR/reports/incidents}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://app.jubileuweb.com}"
SINCE="${SINCE:-3 hours ago}"

mkdir -p "$REPORT_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$REPORT_DIR/wsl-postmortem-$STAMP.txt"

sanitize() {
  sed -E \
    -e 's/(--connection-token=)[^ ]+/\1<hidden>/g' \
    -e 's/(--agent-host-bridge-connection-token=)[^ ]+/\1<hidden>/g' \
    -e 's#(credentials-file:).*#\1 <hidden>#g' \
    -e 's#(cred-file:).*#\1 <hidden>#g' \
    -e 's#(DATABASE_URL=)[^[:space:]]+#\1<hidden>#g' \
    -e 's#(POSTGRES_PASSWORD=)[^[:space:]]+#\1<hidden>#g' \
    -e 's#([A-Za-z0-9_]*(SECRET|TOKEN|KEY)[A-Za-z0-9_]*=)[^[:space:]]+#\1<hidden>#g'
}

{
  echo "===== WSL POSTMORTEM - PROJETO JUBILEU ====="
  echo "Gerado em: $(date)"
  echo "Host: $(hostname)"
  echo "Usuario: $(whoami)"
  echo "Diretorio esperado do projeto: $PROJECT_DIR"
  echo "Public URL: $PUBLIC_BASE_URL"
  echo "Janela de logs: $SINCE"
  echo

  echo "===== SISTEMA / UPTIME ====="
  uptime || true
  uname -a || true
  echo

  echo "===== SYSTEMD DO SISTEMA ====="
  systemctl is-system-running || true
  echo
  systemctl status docker cloudflared --no-pager -l || true
  echo

  echo "===== USER SYSTEMD / BUS / VS CODE TUNNEL ====="
  USER_ID="$(id -u)"
  export XDG_RUNTIME_DIR="/run/user/$USER_ID"
  export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$USER_ID/bus"

  echo "XDG_RUNTIME_DIR=$XDG_RUNTIME_DIR"
  echo "DBUS_SESSION_BUS_ADDRESS=$DBUS_SESSION_BUS_ADDRESS"

  if test -S "/run/user/$USER_ID/bus"; then
    echo "user bus: OK"
  else
    echo "user bus: AUSENTE"
  fi

  echo
  systemctl --user is-system-running || true
  echo
  systemctl --user status code-tunnel.service --no-pager -l || true
  echo

  if test -x "$HOME/.local/bin/vscode-cli/code"; then
    if cd "$HOME/.local/bin/vscode-cli"; then
      ./code tunnel status || true
    fi
  else
    echo "VS Code CLI nao encontrado em ~/.local/bin/vscode-cli/code"
  fi
  echo

  echo "===== DOCKER JUBILEU ====="
  if test -d "$PROJECT_DIR"; then
    cd "$PROJECT_DIR" || exit
    docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
      -f compose.release.yml ps || true
    echo
    mapfile -t container_ids < <(docker compose --project-name "$COMPOSE_PROJECT_NAME" \
      --env-file "$RELEASE_ENV_FILE" -f compose.release.yml ps -q)
    docker inspect "${container_ids[@]}" \
      --format '{{.Name}} RestartCount={{.RestartCount}} Status={{.State.Status}} StartedAt={{.State.StartedAt}} FinishedAt={{.State.FinishedAt}} ExitCode={{.State.ExitCode}} OOMKilled={{.State.OOMKilled}} Health={{if .State.Health}}{{.State.Health.Status}}{{end}}' || true
  else
    echo "Projeto nao encontrado em $PROJECT_DIR"
  fi
  echo

  echo "===== HEALTH LOCAL E PUBLICO ====="
  curl -sS -o /dev/null -w "local /health HTTP=%{http_code} tempo=%{time_total}s\n" "http://127.0.0.1:$NGINX_PORT/health" || true
  curl -sS -o /dev/null -w "local /api/ready HTTP=%{http_code} tempo=%{time_total}s\n" "http://127.0.0.1:$NGINX_PORT/api/ready" || true
  curl -sS -o /dev/null -w "public /health HTTP=%{http_code} tempo=%{time_total}s\n" "$PUBLIC_BASE_URL/health" || true
  curl -sS -o /dev/null -w "public /api/ready HTTP=%{http_code} tempo=%{time_total}s\n" "$PUBLIC_BASE_URL/api/ready" || true
  echo

  echo "===== CLOUDFLARED CONFIG / INGRESS ====="
  if command -v cloudflared >/dev/null 2>&1; then
    cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate || true
    echo
    cloudflared tunnel --config /etc/cloudflared/config.yml ingress rule "$PUBLIC_BASE_URL/health" || true
    echo
    cloudflared tunnel list || true
  else
    echo "cloudflared nao encontrado"
  fi
  echo

  echo "===== BOOTS DO JOURNAL ====="
  journalctl --list-boots || true
  echo

  echo "===== WARNINGS DO BOOT ATUAL ====="
  journalctl -b -p warning --no-pager -n 200 || true
  echo

  echo "===== DOCKER / CLOUDFLARED DESDE $SINCE ====="
  journalctl -u docker -u cloudflared --since "$SINCE" --no-pager -l || true
  echo

  echo "===== USER SERVICE / CODE TUNNEL DESDE $SINCE ====="
  journalctl --user -u code-tunnel.service --since "$SINCE" --no-pager -l || true
  echo

  echo "===== PROCESSOS RELEVANTES ====="
  pgrep -af 'code|vscode|server-main|extensionHost|agent host|codex|openai|cloudflared|dockerd|postgres|nginx|uvicorn' || true
  echo

  echo "===== PROCESSOS TOP CPU/MEM ====="
  ps -eo pid,ppid,stat,pcpu,pmem,etime,cmd --sort=-pcpu | head -30 || true
  echo

  echo "===== RECURSOS ====="
  free -h || true
  echo
  df -h / || true
  echo

  echo "===== CONCLUSAO MANUAL ====="
  echo "Classifique depois da leitura:"
  echo "- WSL/systemd"
  echo "- Docker/containers"
  echo "- Cloudflared/Cloudflare"
  echo "- VS Code Tunnel/user systemd"
  echo "- Recursos: memoria/disco/cpu"

} | sanitize | tee "$OUT"

echo
echo "Arquivo gerado:"
echo "$OUT"
