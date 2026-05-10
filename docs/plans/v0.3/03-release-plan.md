# 03 - Release Plan v0.3.x

## Tags

| Tag | Conteudo |
|---|---|
| `v0.3.0-dev.1` | Reconciliacao e ADR Evento. |
| `v0.3.0-dev.2` | PostgreSQL migration gate. |
| `v0.3.0-dev.3` | Backend Evento-only. |
| `v0.3.0-dev.4` | Frontend Evento-only. |
| `v0.3.0-dev.5` | Usuario persistido e pagina Usuario. |
| `v0.3.0-dev.6` | Tailwind-only cleanup. |
| `v0.3.0-dev.7` | Auth hardening. |
| `v0.3.0-dev.8` | Polling/auth hardening. |
| `v0.3.0-rc.1` | CI e release candidate. |
| `v0.3.0` | Release final. |

## Politica

- Nao abrir `v0.4` neste plano.
- Cada tag dev deve ter entrada em `docs/current/RELEASES.md`.
- `rc.1` exige CI verde e smoke manual documentado.
- `v0.3.0` exige smoke via NGINX e rollback documentado.

## Gate Final

- migrations PostgreSQL validadas;
- backend e frontend verdes;
- auth hardening aplicado;
- polling sem fan-out/401 loop;
- UI sem Bootstrap-like em telas principais;
- release notes completas.
