# Plano v0.3.x

## Objetivo

Fechar o ciclo `v0.3.x` com a base operacional pronta para release: `Evento` canonico, `Usuario` persistido, migrations validadas em PostgreSQL, UI/UX operacional consistente, auth/polling endurecidos, CI/release gate e smoke integrado.

## Escopo

- Reconciliar Linear/GitHub com o estado real do repositorio.
- Formalizar ADRs de Evento canonico e runtime gateway.
- Validar migrations `Evento + Usuario` em PostgreSQL.
- Fechar contratos backend/frontend `Evento-only`.
- Consolidar `/usuario`, dashboards e sessoes operacionais.
- Corrigir riscos de auth, segredos, polling e release gate.

## Fora De Escopo

- Abrir `v0.4`.
- Reintroduzir `Aula` como entidade publica.
- Introduzir dependencia de UI sem justificativa explicita de custo, consistencia,
  acessibilidade, manutencao e risco.
- Migrar para WebSocket/MQTT como caminho principal.

## Ordem De Execucao

1. PR documental: reorganizacao de `/docs`, planos e tracker map.
2. Reconcilicao Linear/GitHub.
3. Slice 02: PostgreSQL migration gate.
4. Slices backend/frontend/usuario.
5. Slices UI/auth/polling/CI.
6. Infra MVP e release smoke.

## Criterios Para Publicar v0.3.0

- `Evento` canonico validado em API, frontend e docs.
- `Usuario` persistido e `/usuario` validados.
- `alembic upgrade head` verde em PostgreSQL limpo e migrado.
- `python -m pytest`, `npm run lint` e `npm run build` verdes.
- `/api` protegido por padrao, com excecoes formalizadas.
- NGINX validado como unico entrypoint publico.
- `docs/current/RELEASES.md` atualizado.
