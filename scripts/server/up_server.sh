#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> Build frontend"

"$ROOT_DIR/scripts/server/build_frontend.sh"

cd "$ROOT_DIR"

echo "==> Starting containers"

if ! docker compose --env-file .env.server -f compose.server.yml up -d --build; then
  echo "==> Compose build failed; trying classic Docker API build"
  DOCKER_BUILDKIT=0 docker build -t jubileu-prod-jubileu-api ./backend/jubileu-api-fastapi
  docker compose --env-file .env.server -f compose.server.yml up -d
fi

echo "==> Waiting API through NGINX"

for i in {1..30}; do
  if curl -fsS http://127.0.0.1/health; then
    echo ""
    echo "Jubileu server UP"
    exit 0
  fi

  echo "Waiting... ($i/30)"
  sleep 3
done

echo "Server did not become healthy in time"

docker compose --env-file .env.server -f compose.server.yml logs --tail=80

exit 1
