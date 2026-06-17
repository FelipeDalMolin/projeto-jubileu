# Acesso remoto operacional

Este documento separa os canais remotos do Projeto Jubileu para evitar confundir
o tunnel de producao da aplicacao com o tunnel de desenvolvimento do VS Code.

## Camadas

Cloudflare Tunnel e producao. Ele roda como `cloudflared.service`, deve ficar
sempre ativo e publica a aplicacao em `https://app.jubileuweb.com` apontando
para o NGINX local em `127.0.0.1:80`.

VS Code Tunnel `jubileu-wsl` e desenvolvimento. Ele existe apenas para abrir o
WSL e o repositorio `/opt/projeto-jubileu` a partir do VS Code remoto. Ele nao
mantem a aplicacao UP, nao substitui Docker, NGINX ou Cloudflare Tunnel, e deve
ficar sob demanda.

Se o WSL cair, o `jubileu-wsl` cai junto. A unidade transitoria criada por
`systemd-run --user` limita o processo enquanto o WSL esta vivo, mas nao e um
canal de recuperacao do Windows.

## Uso local no WSL

```bash
ops/wsl/dev-tunnel-status.sh
ops/wsl/start-dev-tunnel.sh
ops/wsl/stop-dev-tunnel.sh
```

O `start-dev-tunnel.sh` so consegue iniciar o tunnel quando ja existe acesso ao
WSL, seja por terminal local, por PowerShell no Windows host ou por um canal
administrativo futuro. De outro PC, se o tunnel estiver desligado, sera
necessario um canal separado para o Windows host.

## Uso via PowerShell no Windows host

```powershell
wsl -d Jubileu-Sandbox --cd /opt/projeto-jubileu -- ./ops/wsl/dev-tunnel-status.sh
wsl -d Jubileu-Sandbox --cd /opt/projeto-jubileu -- ./ops/wsl/start-dev-tunnel.sh
wsl -d Jubileu-Sandbox --cd /opt/projeto-jubileu -- ./ops/wsl/stop-dev-tunnel.sh
```

Esse fluxo ainda pressupoe acesso ao Windows host. OpenSSH Server nativo do
Windows e o proximo estudo recomendado para recuperar ou iniciar o
`jubileu-wsl` remotamente quando ele estiver desligado.

## Memoria e limites

Antes de iniciar, o script le `MemAvailable` em `/proc/meminfo`.

- Abaixo de 1.5 GiB, o inicio e recusado por padrao.
- `--force` permite ignorar esse preflight com aviso explicito.
- O modo preferido usa unidade transitoria `jubileu-wsl-tunnel` com
  `MemoryHigh=512M`, `MemoryMax=768M` e `CPUQuota=80%`.
- Se a unidade transitoria nao funcionar, o fallback `setsid` so e permitido
  com pelo menos 2 GiB disponiveis ou com `--allow-unbounded`.

Esse preflight reduz risco de OOM, mas nao garante ausencia de OOM. O consumo
final depende do VS Code Server, extensoes, quantidade de janelas e carga do
WSL.

## Estados do status

`ops/wsl/dev-tunnel-status.sh` mostra `MemAvailable`, o caminho do `CODE_CLI`,
o `STATE_DIR` e um destes estados:

- `inactive`
- `active managed jubileu-wsl`
- `active unmanaged tunnel`
- `stale pid`
- `code CLI missing`
- `auth required`

Quando aplicavel, tambem mostra `mode=systemd-transient`, `unit=...`,
`mode=setsid`, `pid=...` e `pgid=...`.

## Comandos proibidos para este canal

Estes scripts nao devem iniciar, parar ou reiniciar a aplicacao:

- Docker Compose;
- migrations ou alteracoes no banco;
- Cloudflare Tunnel da aplicacao;
- NGINX;
- API FastAPI;
- PostgreSQL;
- VS Code Server geral.

O `stop-dev-tunnel.sh` para somente a unidade transitoria gerenciada ou o
PID/PGID gerenciado pelo script. Ele nao usa parada generica de VS Code.

## Fora deste PR

- Service permanente `systemd --user` para `jubileu-wsl`;
- OpenSSH Server no Windows;
- VS Code Tunnel no Windows;
- VPN ou Tailscale;
- mudancas no Cloudflare Tunnel da aplicacao;
- Docker Compose, deploy, banco, migrations ou restart de servicos;
- reabilitar Copilot Chat.
