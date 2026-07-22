#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASE_URL="${RELEASE_BASE_URL:-http://127.0.0.1:18080}"
MANIFEST="${RELEASE_MANIFEST:-$ROOT_DIR/release-manifest.json}"
RELEASE_ENV_FILE="${RELEASE_ENV_FILE:-$ROOT_DIR/.env.release}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-jubileu-rc}"
SMOKE_USERNAME="${SMOKE_USERNAME:-admin}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-admin123}"

COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

READY_JSON="$(curl --fail --silent --show-error "$BASE_URL/api/ready")"
curl --fail --silent --show-error "$BASE_URL/health" >/dev/null
curl --fail --silent --show-error "$BASE_URL/" >/dev/null

LOGIN_PAYLOAD="$(jq -cn --arg username "$SMOKE_USERNAME" --arg password "$SMOKE_PASSWORD" \
  '{username:$username,password:$password}')"
curl --fail --silent --show-error \
  --cookie-jar "$COOKIE_JAR" \
  --header "Content-Type: application/json" \
  --data "$LOGIN_PAYLOAD" \
  "$BASE_URL/api/auth/login" >/dev/null
VERSION_JSON="$(curl --fail --silent --show-error --cookie "$COOKIE_JAR" "$BASE_URL/api/version")"

jq -e '.status == "ready"' <<<"$READY_JSON" >/dev/null
jq -e --arg expected "$(jq -r .git_sha "$MANIFEST")" '.git_sha == $expected' <<<"$VERSION_JSON" >/dev/null
jq -e --arg expected "$(jq -r .alembic_head "$MANIFEST")" '.schema_revision == $expected' <<<"$VERSION_JSON" >/dev/null

for service in jubileu-db jubileu-api; do
  container_id="$(docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
    -f "$ROOT_DIR/compose.release.yml" ps -q "$service")"
  if docker inspect "$container_id" | jq -e \
    '.[0].NetworkSettings.Ports | to_entries | any(.value != null)' >/dev/null; then
    echo "$service must not publish a host port." >&2
    exit 1
  fi
done

echo "Release smoke OK: identity, readiness, frontend and private service ports verified."
