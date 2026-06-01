#!/usr/bin/env bash
set -euo pipefail

LOCAL_BASE_URL="${LOCAL_BASE_URL:-http://127.0.0.1}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-}"

curl -f "$LOCAL_BASE_URL/health"
curl -f "$LOCAL_BASE_URL/api/health"
curl -f "$LOCAL_BASE_URL/api/dias/" > /dev/null
curl -f "$LOCAL_BASE_URL/api/dias" > /dev/null
curl -f "$LOCAL_BASE_URL/" > /dev/null

if [ -n "$PUBLIC_BASE_URL" ]; then
  curl -f "$PUBLIC_BASE_URL/health"
  curl -f "$PUBLIC_BASE_URL/api/health"
  curl -f "$PUBLIC_BASE_URL/api/dias/" > /dev/null
  curl -f "$PUBLIC_BASE_URL/api/dias" > /dev/null
fi

echo "Smoke OK: NGINX + Frontend + FastAPI respondendo."
