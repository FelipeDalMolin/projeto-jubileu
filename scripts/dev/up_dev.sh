#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

if [ ! -f .env.dev ]; then
  cp .env.dev.example .env.dev
  chmod 600 .env.dev
  echo "Created .env.dev from .env.dev.example"
fi

if ! docker compose --env-file .env.dev -f compose.dev.yml up -d --build; then
  echo "==> Compose build failed; trying classic Docker API build"
  DOCKER_BUILDKIT=0 docker build -t jubileu-dev-backend ./backend/jubileu-api-fastapi
  docker compose --env-file .env.dev -f compose.dev.yml up -d
fi

for i in {1..40}; do
  if curl -fsS http://127.0.0.1:${DEV_HTTP_PORT:-8080}/health; then
    echo ""
    echo "Jubileu dev UP: http://127.0.0.1:${DEV_HTTP_PORT:-8080}"
    exit 0
  fi

  echo "Waiting dev stack... ($i/40)"
  sleep 3
done

echo "Dev stack did not become healthy in time"
docker compose --env-file .env.dev -f compose.dev.yml logs --tail=80
exit 1
