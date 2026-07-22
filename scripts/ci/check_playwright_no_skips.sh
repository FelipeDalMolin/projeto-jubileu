#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
E2E_DIR="$ROOT_DIR/frontend/jubileu-web/e2e"

if grep -R -n -E 'test\.skip|describe\.skip|\.skip\(' "$E2E_DIR" --include='*.ts'; then
  echo "Playwright specs must fail on unavailable prerequisites instead of skipping." >&2
  exit 1
fi

echo "Playwright source gate OK: no skip declarations."
