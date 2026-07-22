#!/usr/bin/env bash
set -euo pipefail
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_FILE="${1:?usage: restore_release.sh <backup.dump>}"
RELEASE_ENV_FILE="${RELEASE_ENV_FILE:-$ROOT_DIR/.env.release}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:?COMPOSE_PROJECT_NAME is required}"
POSTGRES_VOLUME_NAME="${POSTGRES_VOLUME_NAME:?POSTGRES_VOLUME_NAME is required}"

case "$COMPOSE_PROJECT_NAME:$POSTGRES_VOLUME_NAME" in
  *prod*)
    echo "Restore is restricted to explicitly isolated rehearsal targets." >&2
    exit 1
    ;;
esac

if [[ ! "$COMPOSE_PROJECT_NAME" =~ ^jubileu-rehearsal-[A-Za-z0-9_.-]+$ ]] ||
  [[ ! "$POSTGRES_VOLUME_NAME" =~ ^jubileu-rehearsal-[A-Za-z0-9_.-]+$ ]]; then
  echo "Project and volume names must start with jubileu-rehearsal-." >&2
  exit 1
fi
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup not found: $BACKUP_FILE" >&2
  exit 1
fi
if [ -f "$BACKUP_FILE.sha256" ]; then
  (cd "$(dirname "$BACKUP_FILE")" && sha256sum --check "$(basename "$BACKUP_FILE").sha256")
fi
docker run --rm -i postgres:16 pg_restore --list <"$BACKUP_FILE" >/dev/null

docker volume inspect "$POSTGRES_VOLUME_NAME" >/dev/null 2>&1 || docker volume create "$POSTGRES_VOLUME_NAME" >/dev/null
docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
  -f "$ROOT_DIR/compose.release.yml" up -d --wait jubileu-db

db_name="$(docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
  -f "$ROOT_DIR/compose.release.yml" exec -T jubileu-db printenv POSTGRES_DB)"
db_user="$(docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
  -f "$ROOT_DIR/compose.release.yml" exec -T jubileu-db printenv POSTGRES_USER)"
if [[ ! "$db_name" =~ ^[A-Za-z0-9_]+$ ]] || [[ ! "$db_user" =~ ^[A-Za-z0-9_]+$ ]]; then
  echo "PostgreSQL user/database identifiers contain unsupported characters." >&2
  exit 1
fi

docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
  -f "$ROOT_DIR/compose.release.yml" exec -T jubileu-db \
  dropdb --if-exists --force -U "$db_user" "$db_name"
docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
  -f "$ROOT_DIR/compose.release.yml" exec -T jubileu-db \
  createdb -U "$db_user" "$db_name"
docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$RELEASE_ENV_FILE" \
  -f "$ROOT_DIR/compose.release.yml" exec -T jubileu-db \
  pg_restore --exit-on-error --no-owner --no-acl -U "$db_user" -d "$db_name" <"$BACKUP_FILE"

echo "Validated backup restored into isolated project $COMPOSE_PROJECT_NAME."
