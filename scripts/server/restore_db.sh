#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Uso: scripts/server/restore_db.sh caminho/do/backup.sql"
  exit 1
fi

BACKUP_FILE="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Arquivo não encontrado: $BACKUP_FILE"
  exit 1
fi

cd "$ROOT_DIR"

echo "Restaurando backup: $BACKUP_FILE"

docker compose --env-file .env.server -f compose.server.yml exec -T jubileu-db \
  psql -U "${POSTGRES_USER:-jubileu_app}" -d "${POSTGRES_DB:-jubileu}" < "$BACKUP_FILE"

echo "Restore concluído."
