#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASE_URL="${RELEASE_BASE_URL:-http://127.0.0.1:18080}"
MANIFEST="${RELEASE_MANIFEST:-$ROOT_DIR/release-manifest.json}"
RELEASE_ENV_FILE="${RELEASE_ENV_FILE:-$ROOT_DIR/.env.release}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-jubileu-rc}"

READY_JSON="$(curl --fail --silent --show-error "$BASE_URL/api/ready")"
VERSION_JSON="$(curl --fail --silent --show-error "$BASE_URL/api/version")"
curl --fail --silent --show-error "$BASE_URL/health" >/dev/null
curl --fail --silent --show-error "$BASE_URL/" >/dev/null

jq -e '.status == "ready"' <<<"$READY_JSON" >/dev/null
jq -e --arg expected "$(jq -r .git_sha "$MANIFEST")" '.git_sha == $expected' <<<"$VERSION_JSON" >/dev/null
jq -e --arg expected "$(jq -r .alembic_head "$MANIFEST")" '.schema_revision == $expected' <<<"$VERSION_JSON" >/dev/null

if docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
  -f "$ROOT_DIR/compose.release.yml" port jubileu-db 5432 | grep -q .; then
  echo "PostgreSQL must not publish a host port." >&2
  exit 1
fi
if docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
  -f "$ROOT_DIR/compose.release.yml" port jubileu-api 8000 | grep -q .; then
  echo "FastAPI must not publish a host port." >&2
  exit 1
fi

echo "Release smoke OK: identity, readiness, frontend and private service ports verified."
