#!/usr/bin/env bash
set -euo pipefail

curl -f http://127.0.0.1/health
curl -f http://127.0.0.1/ > /dev/null

echo "Smoke OK: NGINX + Frontend + FastAPI respondendo."
