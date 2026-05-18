#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> Building frontend"

cd "$ROOT_DIR/frontend/jubileu-web"

npm ci
npm run build

echo "Frontend build generated at frontend/jubileu-web/dist"
