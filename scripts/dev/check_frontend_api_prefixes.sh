#!/usr/bin/env bash
set -euo pipefail

SERVICES_DIR="frontend/jubileu-web/src/services"

if [ ! -d "$SERVICES_DIR" ]; then
  echo "FAIL: services directory not found: $SERVICES_DIR" >&2
  exit 1
fi

PATTERN='(fetch[[:space:]]*\([[:space:]]*url|fetch[[:space:]]*\([[:space:]]*buildUrl|buildUrl|requestJson|url|getJson|postJson|putJson|patchJson|deleteJson)[[:space:]]*\([[:space:]]*['\''"`]/(dias|jogadores|turmas|dashboards|auth|usuarios|eventos|partidas)(/|['\''"`?])'

if rg -n "$PATTERN" "$SERVICES_DIR"; then
  echo "FAIL: frontend services contain probable backend calls without /api prefix." >&2
  echo "Fix only services; do not change React routes/pages." >&2
  exit 1
fi

echo "OK: frontend services use /api for probable backend HTTP paths."
