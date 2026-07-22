# Cloudflare Tunnel — Projeto Jubileu

Este runbook descreve a publicação externa do Projeto Jubileu via Cloudflare Named Tunnel.

## Hostname público

- App pública: https://app.jubileuweb.com
- API pública: https://app.jubileuweb.com/api/...

## Arquitetura

```text
Usuário
↓
Cloudflare DNS / Edge
↓
Named Tunnel cloudflared
↓
127.0.0.1:${NGINX_PORT}
↓
jubileu-nginx
↓
React/Vite estático + FastAPI /api
↓
jubileu-db
```

O NGINX é o ponto de entrada local publicado apenas em loopback. FastAPI e PostgreSQL não devem ser expostos diretamente.

O runtime promovivel usa `compose.release.yml` em `/srv/ops/stacks/jubileu-v03`, imagens por digest
e volume PostgreSQL externo explicitamente identificado. O tunnel deve apontar para a porta
loopback definida em `NGINX_PORT` (normalmente `80` em producao).

## Requisitos locais

- Stack Docker saudável.
- NGINX publicado apenas em loopback: `127.0.0.1:${NGINX_PORT}:80`.
- `cloudflared` instalado.
- Tunnel nomeado criado na Cloudflare.
- Arquivo local `~/.cloudflared/config.yml` apontando para `http://127.0.0.1:80`.

## Validação local

```bash
curl -i http://127.0.0.1/health
curl -i http://127.0.0.1/api/health
```

## Validação pública

```bash
curl -i https://app.jubileuweb.com/health
curl -i https://app.jubileuweb.com/api/health
```

## Smoke test público

```bash
SMOKE_USERNAME="$JUBILEU_SMOKE_USERNAME" SMOKE_PASSWORD="$JUBILEU_SMOKE_PASSWORD" \
  RELEASE_BASE_URL=https://app.jubileuweb.com scripts/release/smoke_release.sh
```

## Arquivos sensíveis

Nunca commitar:

- `~/.cloudflared/cert.pem`
- `~/.cloudflared/<TUNNEL_UUID>.json`
- `~/.cloudflared/config.yml`
