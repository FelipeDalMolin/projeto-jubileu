# Runbook de Incidentes WSL - Projeto Jubileu

Este runbook descreve como diagnosticar incidentes em que o Projeto Jubileu fica indisponível por falha no WSL, Docker, Cloudflared, VS Code Tunnel ou serviços relacionados.

A cadeia operacional principal é:

Cloudflare -> cloudflared -> NGINX -> FastAPI -> PostgreSQL

O VS Code Tunnel é uma camada de desenvolvimento. Ele não é necessário para a aplicação pública funcionar.

## Objetivo

Padronizar o processo de:

1. Coletar evidências antes de reiniciar serviços.
2. Identificar qual camada falhou.
3. Recuperar WSL, Docker, Cloudflared e aplicação com o menor impacto possível.
4. Gerar postmortem depois da recuperação.
5. Evitar ações destrutivas.

## Matriz rápida de diagnóstico

### wsl --status falha

Provável camada afetada:

Windows, WSLService, LxssManager ou vmcompute.

Sintomas comuns:

- Wsl/0x80080005
- WSLService em STOP_PENDING
- LxssManager parado
- wsl -l -v falhando

Ação recomendada:

1. Rodar `ops/wsl-incident-collect.ps1` pelo PowerShell Admin.
2. Verificar `WSLService`, `WslInstaller`, `LxssManager`, `vmcompute` e `hns`.
3. Se `WSLService` estiver em STOP_PENDING, coletar o PID com `sc.exe queryex WSLService`.
4. Só depois considerar `taskkill /PID <PID> /F`.
5. Reiniciar `WSLService`.
6. Testar `wsl -l -v`.

### WSL abre, mas Docker falha

Provável camada afetada:

Docker, containerd ou systemd.

Comandos úteis:

- `systemctl status docker --no-pager -l`
- `journalctl -u docker --since "1 hour ago" --no-pager -l`
- `docker ps`

### Docker está OK, mas local /health falha

Provável camada afetada:

NGINX, FastAPI ou PostgreSQL.

Comandos úteis:

- `docker compose --env-file .env.server -f compose.server.yml ps`
- `docker logs --tail=120 jubileu-nginx`
- `docker logs --tail=120 jubileu-api`
- `docker logs --tail=120 jubileu-db`
- `curl -i http://127.0.0.1/health`

### Local /health retorna 200, mas público falha

Provável camada afetada:

Cloudflared, Cloudflare, DNS ou Public Hostname.

Comandos úteis:

- `systemctl status cloudflared --no-pager -l`
- `journalctl -u cloudflared --since "1 hour ago" --no-pager -l`
- `cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate`
- `cloudflared tunnel --config /etc/cloudflared/config.yml ingress rule https://app.jubileuweb.com/health`
- `cloudflared tunnel list`
- `cloudflared tunnel info jubileu-prod`

Se aparecer HTTP 530 com error code 1033, investigar o vínculo do hostname público com o tunnel no painel da Cloudflare.

### Aplicação pública OK, mas VS Code Tunnel falha

Provável camada afetada:

systemd de usuário, user bus, code-tunnel.service ou VS Code Server.

Comandos úteis:

- `export XDG_RUNTIME_DIR=/run/user/1000`
- `export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus`
- `systemctl --user is-system-running`
- `systemctl --user status code-tunnel.service --no-pager -l`
- `cd ~/.local/bin/vscode-cli && ./code tunnel status`
- `journalctl --user -u code-tunnel.service -n 120 --no-pager -l`

Se o user bus estiver ausente:

- `sudo loginctl enable-linger aluno`
- `sudo systemctl restart user@1000.service`

## Scripts disponíveis

### ops/wsl-incident-collect.ps1

Executar no PowerShell, preferencialmente como Administrador.

Uso:

`powershell -ExecutionPolicy Bypass -File .\ops\wsl-incident-collect.ps1`

Coleta evidências do lado Windows antes de recuperar o WSL:

- teste público Cloudflare;
- wsl --status;
- wsl --version;
- wsl -l -v;
- serviços WSLService, WslInstaller, LxssManager, vmcompute e hns;
- eventos recentes do Windows;
- processos relevantes;
- memória e disco.

### ops/wsl-postmortem.sh

Executar dentro do WSL após a recuperação.

Uso:

`./ops/wsl-postmortem.sh`

Coleta evidências do lado Linux/WSL:

- systemd;
- Docker;
- Cloudflared;
- VS Code Tunnel;
- containers Jubileu;
- health local e público;
- journal;
- processos relevantes;
- memória e disco.

Os arquivos gerados ficam em `reports/incidents/` e não devem ser versionados.

## Sinais importantes

### WSLService STOP_PENDING

Indica que o serviço moderno do WSL ficou preso tentando parar. Coletar evidências antes de finalizar o PID.

### WaitForBootProcess: /sbin/init failed to start within 10000ms

Indica que o systemd da distro demorou demais no boot. Pode afetar Docker, Cloudflared e VS Code Tunnel.

### CreateLoginSession timed out waiting for user session

Indica falha na sessão de usuário do WSL. Pode afetar `systemctl --user` e `code-tunnel.service`.

### cloudflared connect 127.0.0.1:80 refused

Indica que o Cloudflared está ativo, mas o NGINX local ainda não está pronto. Se ocorrer só no boot, é warning transitório.

### journal corrupted or uncleanly shut down

Indica parada não limpa do journal do systemd. Não significa, sozinho, corrupção do PostgreSQL.

## Ações proibidas no fluxo normal

Não executar:

`wsl --unregister`

Esse comando remove a distribuição e apaga os dados.

Também evitar reinicializações repetidas sem coleta de evidência.

## Recomendações futuras

- Aumentar TimeoutStartSec do cloudflared.
- Fazer Cloudflared aguardar a origem local quando possível.
- Manter `loginctl enable-linger aluno`.
- Adicionar checks de WSL/systemd/user bus ao report operacional.
- Criar alerta quando público falhar, mas local estiver OK.
- Criar painel `/admin/ops` consumindo `reports/ops/latest.json`.
