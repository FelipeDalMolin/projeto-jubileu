# Cloudflare Tunnel — Projeto Jubileu

Este runbook descreve a publicação externa do Projeto Jubileu via Cloudflare Named Tunnel.

## Hostname público

- https://app.jubileuweb.com

## Arquitetura

```text
Usuário
↓
Cloudflare DNS / Edge
↓
Named Tunnel cloudflared
↓
127.0.0.1:80
↓
jubileu-nginx
↓
jubileu-api
↓
jubileu-db

## Requisitos locais

Stack Docker saudável
NGINX publicado apenas em loopback:
127.0.0.1:80:80
cloudflared instalado
Tunnel nomeado criado na Cloudflare
Arquivo local ~/.cloudflared/config.yml

curl -i http://127.0.0.1/health
curl -i http://127.0.0.1/api/dias/

Validação pública

curl -i https://app.jubileuweb.com/health
curl -i https://app.jubileuweb.com/api/dias/

Smoke test público

PUBLIC_BASE_URL=https://app.jubileuweb.com scripts/server/smoke_server.sh

Arquivos sensíveis

Nunca commitar:

~/.cloudflared/cert.pem
~/.cloudflared/<TUNNEL_UUID>.json
~/.cloudflared/config.yml

