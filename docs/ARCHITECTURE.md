# ARQUITETURA (Slice 00 - Baseline)

## Topologia de execução

Formato oficial de implantação:

`Cloudflare -> NGINX -> FastAPI -> PostgreSQL`

### Restrições não negociáveis da plataforma

- O **NGINX** é o único ponto de entrada público.
- O **FastAPI** não deve ser exposto publicamente.
- O **PostgreSQL** não deve ser exposto publicamente.
- O prefixo `/api` permanece como gateway padrão de exposição do backend.
- 

## Arquitetura atual do backend

A organização atual do backend ainda segue majoritariamente o padrão **por tipo de camada**:

- `app/routers/`
- `app/models/`
- `app/schemas/`
- `app/services/`

### Detalhes de entrada e infraestrutura

- `app/main.py` instancia a aplicação FastAPI e registra os routers diretamente.
- `app/database.py` concentra:
  - carregamento de variáveis de ambiente
  - criação do engine
  - factory de sessões
  - definição da base ORM
- `app/deps_auth.py` ainda utiliza autenticação baseada em headers (fase atual).

---

## Direção da arquitetura alvo

Objetivo do refactor (incremental e com compatibilidade preservada):

```text
app/
  core/
    config.py
    security.py
  db/
    base.py
    session.py
  modules/
    auth/
    usuarios/
    jogadores/
    dias/
    eventos/
    partidas/
    estatisticas/
```

Execution order is fixed by baseline:

1. Slice 00 - Stabilization
2. Slice 01 - App Shell Modularization
3. Slice 02 - Domain Reorganization and Service Extraction
4. Slice 03 - API Standardization
5. Slice 04 - JWT + RBAC
6. Slice 05 - Linux/NGINX deployment assets

## Compromissos de compatibilidade — Slice 00

- A nomenclatura de persistência permanece inalterada (`Aula` continua sendo persistido).
- O fluxo de autenticação permanece inalterado (comportamento via header preservado).
- Os contratos públicos existentes permanecem inalterados, com exceção da adição de `/health`.
- A semântica dos payloads de negócio permanece inalterada.

---

## Validação de viabilidade do Alembic (base limpa)

Validação executada em **22/03/2026** contra uma instância limpa do PostgreSQL:

- Comando executado:

- `alembic upgrade head`
- success up to head `0011_evento_participantes_lances`

## Nota de risco — Drift de migrations

Apesar da execução bem-sucedida em base limpa, o risco de migrations ainda é **relevante**:

- O histórico de migrations contém **pontos de merge entre múltiplas branches**  
(ex: branches `0003_*` posteriormente unificadas), aumentando a complexidade operacional.

- Existem migrations com caráter **corretivo/idempotente**, indicando pressão histórica de drift entre modelo e schema.

- A cobertura de testes com SQLite **não valida completamente** comportamentos específicos do PostgreSQL, como:
- enums
- valores default
- DDL transacional
- lógica condicional em migrations

- Atualizações em produção exigem:
- validação em ambiente com snapshot de dados PostgreSQL
- runbooks com estratégia de rollback

---

## Pontos críticos legados remanescentes

- `app/models/dia_aula.py` atua como um ponto de concentração de múltiplos agregados.
- Lógica de domínio excessiva nos routers, especialmente nos fluxos de:
- dia
- partida
- Sobreposição conceitual transitória entre:
- `JogadorAula`
- `EventoParticipante`
