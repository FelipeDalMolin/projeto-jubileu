#!/usr/bin/env bash
set -euo pipefail
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RELEASE_ENV_FILE="${RELEASE_ENV_FILE:-$ROOT_DIR/.env.release}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-jubileu-rc}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/release}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$BACKUP_DIR/${COMPOSE_PROJECT_NAME}_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"
cd "$ROOT_DIR"

docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
  -f compose.release.yml exec -T jubileu-db \
  sh -c 'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >"$BACKUP_FILE"

docker run --rm -i postgres:16 pg_restore --list <"$BACKUP_FILE" >/dev/null
sha256sum "$BACKUP_FILE" >"$BACKUP_FILE.sha256"
echo "Validated backup: $BACKUP_FILE"
