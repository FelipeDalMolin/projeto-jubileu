#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> Building frontend"

cd "$ROOT_DIR/frontend/jubileu-web"

if command -v npm >/dev/null 2>&1; then
  npm ci
  npm run build
else
  NODE_IMAGE="${FRONTEND_NODE_IMAGE:-node:22-alpine}"
  NODE_MODULES_VOLUME="${FRONTEND_NODE_MODULES_VOLUME:-jubileu_prod_frontend_node_modules}"

  docker run --rm \
    -v "$PWD:/app" \
    -v "$NODE_MODULES_VOLUME:/app/node_modules" \
    -w /app \
    "$NODE_IMAGE" \
    sh -lc "npm ci --no-audit --no-fund && npm run build"
fi

echo "Frontend build generated at frontend/jubileu-web/dist"
