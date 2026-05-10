# 02 - Propostas De Novas Issues

Criar apenas se a reconciliacao confirmar lacuna real.

| Titulo | Tipo | Descricao | Aceite | Branch | Dependencias | Substitui |
|---|---|---|---|---|---|---|
| Tailwind-only UI cleanup | DEV | Remover classes Bootstrap-like e consolidar componentes proprios Tailwind. | Grep sem classes Bootstrap-like; lint/build verdes; telas principais revisadas. | `dev-NN-tailwind-only-ui-cleanup` | DEV-40 | parte de DEV-40 se ficar amplo demais |
| Auth hardening v0.3 | DEV | Endurecer segredo, hashing, storage de token e fallback legado. | Sem segredo inseguro em prod; hash robusto; sessao segura; testes auth. | `dev-NN-auth-hardening-v03` | Usuario persistido | nova |
| CI release gate v0.3 | DEV | Criar CI com pytest, Alembic em PostgreSQL, lint e build. | Workflow verde em PR; docs de gate atualizadas. | `dev-NN-ci-release-gate-v03` | migrations estaveis | parte de DEV-41 |
| Release smoke v0.3.0 | DEV | Executar smoke integrado via NGINX e fechar tag. | Smoke login/usuario/AULA/JOGO_LIVRE/dashboard; release notes. | `dev-NN-v030-release-smoke` | DEV-27, CI gate | parte de DEV-41 |
| ADR Evento canonico | CORE | Formalizar Evento como raiz publica e Aula como modo. | ADR aceita; Linear DEV-34 referenciado. | `core-NN-adr-evento-canonico` | nenhuma | CORE-3/4 em nome antigo |
| Auth security baseline | CORE | Definir politica minima de segredo, senha, token e sessao. | Decisao aceita; DEV auth hardening criado. | `core-NN-auth-security-baseline` | Usuario persistido | nova |
| Release policy v0.3 | CORE | Definir criterio para tags dev/rc/final e release gate. | Politica aceita; PR template e checklist alinhados. | `core-NN-release-policy-v03` | CI gate | nova |
