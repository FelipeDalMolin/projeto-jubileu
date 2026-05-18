#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups/postgres"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/jubileu_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

cd "$ROOT_DIR"

docker compose --env-file .env.server -f compose.server.yml exec -T jubileu-db \
  pg_dump -U "${POSTGRES_USER:-jubileu_app}" -d "${POSTGRES_DB:-jubileu}" \
  > "$BACKUP_FILE"

echo "Backup criado em: $BACKUP_FILE"
