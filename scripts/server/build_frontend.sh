#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR/frontend/jubileu-web"

npm ci
npm run build

sudo mkdir -p /var/www/jubileu-web
sudo rm -rf /var/www/jubileu-web/*
sudo cp -r dist/* /var/www/jubileu-web/

sudo systemctl reload nginx
