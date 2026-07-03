#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

docker compose --env-file .env.dev -f compose.dev.yml ps

cat <<'EOF'

Dev entrypoints:
  Main:    http://127.0.0.1:8080
  Vite:    http://127.0.0.1:5173
  FastAPI: http://127.0.0.1:8000
EOF
