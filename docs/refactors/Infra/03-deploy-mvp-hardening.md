# Slice 03 - Deploy MVP Hardening

## Contexto

O projeto precisa de um caminho operacional minimo para MVP sem comprometer seguranca basica.

## Objetivo

Preparar checklist de deploy MVP com secrets, processos e validacao.

## Escopo

- Variaveis obrigatorias.
- `JWT_SECRET` seguro.
- PostgreSQL production behavior.
- systemd ou processo equivalente.
- HTTPS/Certbot checklist quando aplicavel.
- Rollback operacional.

## Fora de Escopo

- Infra altamente disponivel.
- Observabilidade completa.
- CI/CD completo.

## Arquivos Provaveis

- `docs/SETUP_LINUX.md`
- `docs/QUICK_START.md`
- novos docs de deploy se necessario
- exemplos de systemd/NGINX

## Riscos

- Secrets default em producao.
- Deploy sem rollback.
- Backend direto na internet.

## Criterios de Aceite

- Checklist MVP completo.
- Secrets default explicitamente proibidos.
- Rollback documentado.
- Gateway NGINX preservado.

## Validacao

- Revisao documental.
- Smoke de backend e frontend no fluxo gateway.

## Linear

- CORE: `CORE-1`
- DEV sugerida: `DEV-27`
- Branch sugerida: `dev-27-infra-runtime-gateway-deploy-mvp`
