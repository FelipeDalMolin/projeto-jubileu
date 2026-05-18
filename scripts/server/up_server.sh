#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> Build frontend"

cd "$ROOT_DIR/frontend/jubileu-web"
npm ci
npm run build

cd "$ROOT_DIR"

echo "==> Starting containers"

docker compose --env-file .env.server -f compose.server.yml up -d --build

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
