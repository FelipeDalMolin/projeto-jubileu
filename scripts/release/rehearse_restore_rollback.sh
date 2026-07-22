#!/usr/bin/env bash
set -euo pipefail
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PREVIOUS_MANIFEST="${1:?usage: rehearse_restore_rollback.sh <previous-manifest> <current-manifest> <backup.dump>}"
CURRENT_MANIFEST="${2:?current manifest is required}"
BACKUP_FILE="${3:?backup dump is required}"
RELEASE_ENV_FILE="${RELEASE_ENV_FILE:-$ROOT_DIR/.env.release}"
REHEARSAL_ID="${REHEARSAL_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVIDENCE_DIR="${EVIDENCE_DIR:-$ROOT_DIR/reports/release-rehearsal/$REHEARSAL_ID}"
REHEARSAL_OPERATOR="${REHEARSAL_OPERATOR:-${USER:-unknown}}"
COMPOSE_PROJECT_NAME="jubileu-rehearsal-$REHEARSAL_ID"
POSTGRES_VOLUME_NAME="jubileu-rehearsal-$REHEARSAL_ID-postgres"
NGINX_PORT="${NGINX_PORT:-18081}"
EVENTS_FILE="$(mktemp)"
PREVIOUS_CONTAINER="$COMPOSE_PROJECT_NAME-previous-api"

export COMPOSE_PROJECT_NAME POSTGRES_VOLUME_NAME NGINX_PORT RELEASE_ENV_FILE

for file in "$PREVIOUS_MANIFEST" "$CURRENT_MANIFEST" "$BACKUP_FILE" "$RELEASE_ENV_FILE"; do
  if [ ! -f "$file" ]; then
    echo "Required rehearsal input not found: $file" >&2
    exit 1
  fi
done

previous_backend="$(jq -er .backend_image "$PREVIOUS_MANIFEST")"
previous_frontend="$(jq -er .frontend_image "$PREVIOUS_MANIFEST")"
current_backend="$(jq -er .backend_image "$CURRENT_MANIFEST")"
current_frontend="$(jq -er .frontend_image "$CURRENT_MANIFEST")"
expected_head="$(jq -er .alembic_head "$CURRENT_MANIFEST")"
previous_ref="$(jq -er .release_ref "$PREVIOUS_MANIFEST")"
previous_sha="$(jq -er .git_sha "$PREVIOUS_MANIFEST")"
current_ref="$(jq -er .release_ref "$CURRENT_MANIFEST")"
current_sha="$(jq -er .git_sha "$CURRENT_MANIFEST")"
started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

for image in "$previous_backend" "$previous_frontend" "$current_backend" "$current_frontend"; do
  if [[ "$image" != *@sha256:* ]] && [ "${ALLOW_LOCAL_TAGS:-0}" != "1" ]; then
    echo "Rehearsal images must be immutable digests; local tags require ALLOW_LOCAL_TAGS=1." >&2
    exit 1
  fi
done

compose() {
  docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
    -f "$ROOT_DIR/compose.release.yml" "$@"
}

record() {
  local phase="$1"
  local result="$2"
  jq -cn --arg phase "$phase" --arg result "$result" --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{phase:$phase,result:$result,timestamp_utc:$at}' >>"$EVENTS_FILE"
}

cleanup() {
  docker rm -f "$PREVIOUS_CONTAINER" >/dev/null 2>&1 || true
  if [ "${KEEP_REHEARSAL:-0}" != "1" ]; then
    compose down --remove-orphans >/dev/null 2>&1 || true
    docker volume rm "$POSTGRES_VOLUME_NAME" >/dev/null 2>&1 || true
  fi
  rm -f "$EVENTS_FILE"
}
trap cleanup EXIT

run_previous_api_smoke() {
  local phase="$1"
  docker rm -f "$PREVIOUS_CONTAINER" >/dev/null 2>&1 || true
  BACKEND_IMAGE="$previous_backend" FRONTEND_IMAGE="$previous_frontend" \
    compose run -d --name "$PREVIOUS_CONTAINER" --no-deps jubileu-api >/dev/null
  for _attempt in $(seq 1 60); do
    if docker exec "$PREVIOUS_CONTAINER" python -c \
      "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)" \
      >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  docker exec "$PREVIOUS_CONTAINER" python -c \
    "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=5)" \
    >/dev/null
  docker exec "$PREVIOUS_CONTAINER" alembic current >/dev/null
  docker rm -f "$PREVIOUS_CONTAINER" >/dev/null
  record "$phase" "passed"
}

mkdir -p "$EVIDENCE_DIR"
backup_checksum="$(sha256sum "$BACKUP_FILE" | awk '{print $1}')"
for image in "$previous_backend" "$previous_frontend" "$current_backend" "$current_frontend"; do
  docker image inspect "$image" >/dev/null 2>&1 || docker pull "$image" >/dev/null
done

"$ROOT_DIR/scripts/release/restore_release.sh" "$BACKUP_FILE"
# Variables in this command are intentionally expanded inside the database container.
# shellcheck disable=SC2016
initial_revision="$(compose exec -T jubileu-db sh -c \
  'psql -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select version_num from alembic_version"')"
record "restore_validated_backup" "passed"

run_previous_api_smoke "previous_runtime_on_restored_schema"

BACKEND_IMAGE="$current_backend" FRONTEND_IMAGE="$current_frontend" compose run --rm migration >/dev/null
# Variables in this command are intentionally expanded inside the database container.
# shellcheck disable=SC2016
migrated_revision="$(compose exec -T jubileu-db sh -c \
  'psql -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select version_num from alembic_version"')"
if [ "$migrated_revision" != "$expected_head" ]; then
  echo "Migration ended at $migrated_revision; expected $expected_head." >&2
  exit 1
fi
record "migration_to_rc_head" "passed"

BACKEND_IMAGE="$current_backend" FRONTEND_IMAGE="$current_frontend" compose up -d --wait jubileu-api nginx
compose exec -T jubileu-api python -m app.modules.auth.seed >/dev/null
COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME" RELEASE_BASE_URL="http://127.0.0.1:$NGINX_PORT" \
  RELEASE_MANIFEST="$CURRENT_MANIFEST" "$ROOT_DIR/scripts/release/smoke_release.sh" >/dev/null
record "current_runtime_after_migration" "passed"

compose stop nginx jubileu-api >/dev/null
run_previous_api_smoke "previous_runtime_on_migrated_schema"

BACKEND_IMAGE="$current_backend" FRONTEND_IMAGE="$current_frontend" compose up -d --wait jubileu-api nginx
COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME" RELEASE_BASE_URL="http://127.0.0.1:$NGINX_PORT" \
  RELEASE_MANIFEST="$CURRENT_MANIFEST" "$ROOT_DIR/scripts/release/smoke_release.sh" >/dev/null
record "return_to_current_runtime" "passed"

finished_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
jq -s \
  --arg rehearsal_id "$REHEARSAL_ID" \
  --arg operator "$REHEARSAL_OPERATOR" \
  --arg started_at "$started_at" \
  --arg finished_at "$finished_at" \
  --arg backup_sha256 "$backup_checksum" \
  --arg initial_revision "$initial_revision" \
  --arg final_revision "$migrated_revision" \
  --arg previous_backend "$previous_backend" \
  --arg previous_frontend "$previous_frontend" \
  --arg previous_ref "$previous_ref" \
  --arg previous_sha "$previous_sha" \
  --arg current_backend "$current_backend" \
  --arg current_frontend "$current_frontend" \
  --arg current_ref "$current_ref" \
  --arg current_sha "$current_sha" \
  --argjson local_tag_override "${ALLOW_LOCAL_TAGS:-0}" \
  '{
    rehearsal_id:$rehearsal_id,
    operator:$operator,
    started_at_utc:$started_at,
    finished_at_utc:$finished_at,
    backup_sha256:$backup_sha256,
    initial_schema_revision:$initial_revision,
    final_schema_revision:$final_revision,
    previous_release:{release_ref:$previous_ref,git_sha:$previous_sha,backend:$previous_backend,frontend:$previous_frontend},
    current_release:{release_ref:$current_ref,git_sha:$current_sha,backend:$current_backend,frontend:$current_frontend},
    local_tag_override:($local_tag_override == 1),
    secrets_redacted:true,
    production_mutated:false,
    events:.
  }' "$EVENTS_FILE" >"$EVIDENCE_DIR/rehearsal.json"

{
  echo "# Release restore and rollback rehearsal"
  echo
  echo "- Rehearsal: \`$REHEARSAL_ID\`"
  echo "- Operator: \`$REHEARSAL_OPERATOR\`"
  echo "- Started (UTC): \`$started_at\`"
  echo "- Finished (UTC): \`$finished_at\`"
  echo "- Backup SHA-256: \`$backup_checksum\`"
  echo "- Schema: \`$initial_revision\` -> \`$migrated_revision\`"
  echo "- Production mutated: **no**"
  echo "- Secrets included: **no**"
  echo
  echo "All restore, migration, previous-runtime, rollback-schema and return-to-RC phases passed."
} >"$EVIDENCE_DIR/rehearsal.md"

sha256sum "$EVIDENCE_DIR/rehearsal.json" "$EVIDENCE_DIR/rehearsal.md" >"$EVIDENCE_DIR/SHA256SUMS"
echo "Rehearsal evidence: $EVIDENCE_DIR"
