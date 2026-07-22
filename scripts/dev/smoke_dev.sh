#!/usr/bin/env bash
set -euo pipefail

DEV_BASE_URL="${DEV_BASE_URL:-http://127.0.0.1:8080}"

curl -f "$DEV_BASE_URL/health"
curl -f "$DEV_BASE_URL/api/health"
curl -f -H "X-User-Id: smoke-admin" -H "X-Role: admin" "$DEV_BASE_URL/api/dias" > /dev/null
curl -f "$DEV_BASE_URL/" > /dev/null

echo "Dev smoke OK: NGINX dev + Frontend + FastAPI respondendo."
