#!/usr/bin/env bash
set -euo pipefail

docker compose -f compose.server.yml down

echo "Jubileu server DOWN"
