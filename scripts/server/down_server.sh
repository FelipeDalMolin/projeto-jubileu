#!/usr/bin/env bash
set -euo pipefail

docker compose --env-file .env.server -f compose.server.yml down

echo "Jubileu server DOWN"
