#!/usr/bin/env bash
set -euo pipefail

LOCAL_BASE_URL="${LOCAL_BASE_URL:-http://127.0.0.1}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-}"
SMOKE_USERNAME="${SMOKE_USERNAME:-}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if [ -z "$SMOKE_USERNAME" ] || [ -z "$SMOKE_PASSWORD" ]; then
  echo "SMOKE_USERNAME e SMOKE_PASSWORD sao obrigatorios para validar rotas autenticadas." >&2
  exit 1
fi

authenticated_smoke() {
  local base_url="$1"
  local name="$2"
  local cookie_jar="$TMP_DIR/${name}.cookies"
  local login_payload

  login_payload="$(jq -cn --arg username "$SMOKE_USERNAME" --arg password "$SMOKE_PASSWORD" \
    '{username:$username,password:$password}')"
  curl --fail --silent --show-error \
    --cookie-jar "$cookie_jar" \
    --header "Content-Type: application/json" \
    --data "$login_payload" \
    "$base_url/api/auth/login" >/dev/null
  curl --fail --silent --show-error --cookie "$cookie_jar" "$base_url/api/dias" >/dev/null
}

curl -f "$LOCAL_BASE_URL/health"
curl -f "$LOCAL_BASE_URL/api/health"
authenticated_smoke "$LOCAL_BASE_URL" "local"
curl -f "$LOCAL_BASE_URL/" > /dev/null

if [ -n "$PUBLIC_BASE_URL" ]; then
  curl -f "$PUBLIC_BASE_URL/health"
  curl -f "$PUBLIC_BASE_URL/api/health"
  authenticated_smoke "$PUBLIC_BASE_URL" "public"
fi

echo "Smoke OK: NGINX + Frontend + FastAPI respondendo."
