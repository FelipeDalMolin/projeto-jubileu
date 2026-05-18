#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

echo "==> Checking working tree"

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit, stash, or discard local changes before deploy."
  git status
  exit 1
fi

echo "==> Fetching latest changes"

git fetch --all --prune

CURRENT_BRANCH="$(git branch --show-current)"

echo "==> Current branch: $CURRENT_BRANCH"
echo "==> Pulling latest"

git pull --ff-only origin "$CURRENT_BRANCH"

echo "==> Starting server"

scripts/server/up_server.sh

echo "==> Final status"

docker compose --env-file .env.server -f compose.server.yml ps

echo "==> Health"

curl -f http://127.0.0.1/health

echo ""
echo "Deploy completed successfully."
