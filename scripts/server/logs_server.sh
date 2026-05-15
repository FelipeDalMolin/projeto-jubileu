#!/usr/bin/env bash
set -euo pipefail

docker compose -f compose.server.yml logs -f
