import os
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.dia_evento import (
    Dia,
    Evento,
    EventoRotacaoEstado,
    JogadorEvento,
    Partida,
    PartidaStatusEnum,
    StatusEventoEnum,
    StatusPresencaEnum,
    TimeEvento,
    TipoEventoEnum,
)
from app.modules.auth.service import AuthUser
from app.modules.eventos.rotation import criar_proxima_partida_flow
from app.schemas.eventos import ProximaPartidaIn


@pytest.mark.postgresql
def test_comandos_concorrentes_criam_so_uma_partida_ativa():
    database_url = os.getenv("DATABASE_URL_TEST")
    if not database_url or not database_url.startswith("postgresql"):
        pytest.skip("DATABASE_URL_TEST PostgreSQL nao configurada")

    engine = create_engine(database_url, future=True)
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)
    marker = uuid4().hex[:10]
    with SessionLocal() as setup:
        dia = Dia(data_iso=f"pg-{marker}")
        setup.add(dia)
        setup.flush()
        evento = Evento(
            dia_id=dia.id,
            turma_id=None,
            turma_nome=None,
            numero_evento_na_turma=None,
            tipo=TipoEventoEnum.JOGO_LIVRE,
            horario_inicio="19:00",
            horario_fim="20:00",
            status=StatusEventoEnum.EM_ANDAMENTO,
        )
        setup.add(evento)
        setup.flush()
        times = [TimeEvento(evento_id=evento.id, nome=f"PG {marker} {idx}") for idx in range(3)]
        setup.add_all(times)
        setup.flush()
        jogadores = [
            JogadorEvento(
                evento_id=evento.id,
                jogador_id=None,
                nome=f"PG Jogador {idx}",
                status=StatusPresencaEnum.presente,
                time_id=times[idx].id,
            )
            for idx in range(3)
        ]
        setup.add_all(jogadores)
        setup.flush()
        origem = Partida(
            evento_id=evento.id,
            ordem=1,
            status=PartidaStatusEnum.ENCERRADA,
            time_a_id=times[0].id,
            time_b_id=times[1].id,
        )
        setup.add(origem)
        setup.add(
            EventoRotacaoEstado(
                evento_id=evento.id,
                team_size_ref=1,
                duracao_partida_segundos=600,
                fila_jogadores_ids=[item.id for item in jogadores],
                proximos_times=[
                    {"grupo_id": f"time:{time.id}", "jogadores_ids": [jogadores[idx].id]}
                    for idx, time in enumerate(times)
                ],
                version=1,
            )
        )
        setup.commit()
        evento_id = evento.id
        origem_id = origem.id
        time_ids = [time.id for time in times]

    user = AuthUser(user_id="pg-test", role="treinador", jogador_id=None)

    def execute(command_id: str, opponent_id: int) -> tuple[str, int | str]:
        with SessionLocal() as session:
            try:
                result = criar_proxima_partida_flow(
                    session,
                    evento_id,
                    ProximaPartidaIn(
                        partida_origem_id=origem_id,
                        time_a_id=time_ids[0],
                        time_b_id=opponent_id,
                        expected_rotation_version=1,
                        client_command_id=command_id,
                    ),
                    user,
                )
                return "ok", result.partida.id
            except Exception as exc:  # assertion below verifies the stable conflict
                detail = getattr(exc, "detail", str(exc))
                code = detail.get("code") if isinstance(detail, dict) else str(detail)
                return "error", code

    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(
                pool.map(
                    lambda args: execute(*args),
                    [("pg-command-a", time_ids[1]), ("pg-command-b", time_ids[2])],
                )
            )
        assert sum(result[0] == "ok" for result in results) == 1
        assert ("error", "active_match_conflict") in results or ("error", "version_conflict") in results
        with SessionLocal() as verify:
            active_count = verify.query(Partida).filter(
                Partida.evento_id == evento_id,
                Partida.status == PartidaStatusEnum.EM_ANDAMENTO,
            ).count()
            assert active_count == 1
    finally:
        with SessionLocal() as cleanup:
            cleanup.query(Partida).filter(Partida.evento_id == evento_id).update(
                {Partida.partida_origem_id: None},
                synchronize_session=False,
            )
            evento = cleanup.get(Evento, evento_id)
            if evento is not None:
                cleanup.delete(evento)
                cleanup.commit()
        engine.dispose()
