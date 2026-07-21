# Command Safety

Este documento define o padrao vivo para comandos mutaveis no Projeto Jubileu.
Ele deve ser lido antes de criar ou alterar qualquer fluxo que escreva no backend.

## Regra Principal

Toda feature mutavel deve declarar como lida com:

- duplo clique ou submit repetido;
- retry de rede;
- dois usuarios operando o mesmo evento;
- conflito entre estado local e estado persistido;
- constraints, locks ou idempotencia no backend.

Protecao apenas no frontend, como debounce ou botao desabilitado, e melhoria de UX.
Ela nao conta como integridade de dominio.

## Classes De Comando

| Classe | Exemplos | Protecao esperada |
|---|---|---|
| `create` | criar time, partida ou evento | constraint de unicidade ou lock; retorno claro em duplicidade |
| `append/event-log` | registrar lance | `client_event_id` ou `Idempotency-Key` com constraint de banco |
| `snapshot update` | salvar equipes, fila ou rotacao | `expected_version` e `409 version_conflict` |
| `status transition` | iniciar/encerrar evento ou partida | gate de status no backend; lock quando houver corrida relevante |
| `delete` | remover time, partida ou vinculo | validar ownership/status; repetir delete deve ter comportamento documentado |

## Contrato De API

Use um dos mecanismos abaixo em comandos novos ou alterados:

- `Idempotency-Key` header ou `client_command_id`/`client_event_id` no payload para creates/appends;
- `expected_version` no payload para read-modify-write e snapshots;
- `409` com `detail.code = "version_conflict"` quando a versao esperada estiver stale;
- constraint de banco para invariantes que nao podem depender de timing da aplicacao.

Quando houver retry idempotente, retornar o recurso ja criado e preferir `200`/resposta normal
ao inves de criar duplicata.

## Checklist De Implementacao

- Identificar o aggregate dono: normalmente `Evento`.
- Validar ownership do recurso filho na rota.
- Definir se o comando precisa lock, constraint, idempotency key ou `expected_version`.
- Atualizar SQLAlchemy, Alembic, schemas, services e testes juntos quando houver persistencia.
- Adicionar teste de repeticao: duplo POST, retry com mesmo id, versao stale ou duas escritas concorrentes simuladas.
- Atualizar `docs/current/API.md`, `docs/current/TEST_PLAN.md` e code-map quando contrato ou superficie mudar.

## Estado Atual

- Times no evento usam nome unico por `evento_id`.
- Lances usam `client_event_id` por partida para retry idempotente.
- Partidas usam ordem unica por evento.
- Estatisticas usam uma linha por jogador em cada partida.
- `estado-equipes` e rotacao aceitam `expected_version` e retornam `409 version_conflict`.
