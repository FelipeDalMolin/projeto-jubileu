#!/usr/bin/env bash
set -euo pipefail

sed -E \
  -e 's/(Authorization:[[:space:]]*Bearer[[:space:]]+)[A-Za-z0-9._~-]+/\1[REDACTED]/Ig' \
  -e 's/(jubileu_(access|refresh|csrf)=)[^;[:space:]]+/\1[REDACTED]/g' \
  -e 's/((JWT_SECRET|REFRESH_TOKEN_HMAC_SECRET|POSTGRES_PASSWORD)=)[^[:space:]]+/\1[REDACTED]/g' \
  -e 's#(postgresql(\+psycopg)?://[^:/[:space:]]+:)[^@/[:space:]]+@#\1[REDACTED]@#g'
