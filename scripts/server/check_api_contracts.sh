#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1}"
BASE_URL="${BASE_URL%/}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

fetch_path() {
  local path="$1"
  local name="$2"
  local headers="$TMP_DIR/${name}.headers"
  local body="$TMP_DIR/${name}.body"
  local status

  if ! status="$(curl --max-time 10 -sS -o "$body" -D "$headers" -w "%{http_code}" "$BASE_URL$path")"; then
    fail "$path nao respondeu em ate 10s"
  fi

  printf '%s\n' "$status"
}

content_type_for() {
  local name="$1"
  awk 'BEGIN{IGNORECASE=1} /^content-type:/ {sub(/\r$/, ""); print $0; exit}' "$TMP_DIR/${name}.headers"
}

body_looks_html() {
  local name="$1"
  grep -Eiq '<!doctype[[:space:]]+html|<html[[:space:]>]' "$TMP_DIR/${name}.body"
}

assert_health() {
  local status
  status="$(fetch_path "/health" "health")"
  [ "$status" = "200" ] || fail "/health esperado HTTP 200, recebeu $status"
  echo "OK: /health retornou HTTP 200"
}

assert_spa_html() {
  local path="$1"
  local name="$2"
  local status content_type

  status="$(fetch_path "$path" "$name")"
  content_type="$(content_type_for "$name")"

  [ "$status" = "200" ] || fail "$path esperado HTTP 200 da SPA, recebeu $status"
  if [[ "$content_type" != *"text/html"* ]] && ! body_looks_html "$name"; then
    fail "$path deveria retornar HTML da SPA, mas Content-Type foi: ${content_type:-ausente}"
  fi

  echo "OK: $path retorna HTML da SPA"
}

assert_api_json_or_auth() {
  local path="$1"
  local name="$2"
  local status content_type

  status="$(fetch_path "$path" "$name")"
  content_type="$(content_type_for "$name")"

  if [[ "$content_type" == *"text/html"* ]] || body_looks_html "$name"; then
    fail "$path retornou HTML; chamadas de API devem responder JSON ou erro JSON"
  fi

  if [[ "$status" = "200" && "$content_type" == *"application/json"* ]]; then
    echo "OK: $path retorna JSON HTTP 200"
    return
  fi

  if [[ "$status" = "401" && "$content_type" == *"application/json"* ]]; then
    echo "OK: $path retornou 401 JSON; contrato API valido para endpoint protegido por auth"
    return
  fi

  fail "$path esperado HTTP 200 JSON no estado atual, ou 401 JSON se protegido por auth; recebeu HTTP $status com ${content_type:-Content-Type ausente}"
}

echo "Checking API contracts at $BASE_URL"
assert_health
assert_spa_html "/dias" "spa_dias"
assert_spa_html "/jogadores" "spa_jogadores"
assert_spa_html "/turmas" "spa_turmas"
assert_api_json_or_auth "/api/dias" "api_dias"
assert_api_json_or_auth "/api/jogadores" "api_jogadores"
assert_api_json_or_auth "/api/turmas" "api_turmas"
echo "API contract OK: SPA routes return HTML; API routes return JSON or auth JSON."
