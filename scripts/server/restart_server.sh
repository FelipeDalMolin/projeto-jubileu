#!/usr/bin/env bash
set -euo pipefail

sudo systemctl restart nginx

echo "NGINX reiniciado."
echo "Se a API estiver rodando manualmente via uvicorn, mantenha o terminal aberto."
