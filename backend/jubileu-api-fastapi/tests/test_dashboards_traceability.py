from fastapi.testclient import TestClient

from app.models.dia_evento import (
    Dia,
    EstatisticaJogadorPartida,
    Evento,
    JogadorEvento,
    Partida,
    PartidaStatusEnum,
    StatusEventoEnum,
    StatusPresencaEnum,
    TimeEvento,
    TipoEventoEnum,
)
from app.models.jogador_turma import Jogador, Turma


def _seed_traceability(db_session):
    jogador = Jogador(nome="Jogador rastreavel", status="ativo", ativo=True)
    turma = Turma(nome="Turma rastreavel")
    dias = [Dia(data_iso="2026-07-19"), Dia(data_iso="2026-07-20")]
    db_session.add_all([jogador, turma, *dias])
    db_session.flush()

    eventos = [
        Evento(
            dia_id=dias[0].id,
            turma_id=turma.id,
            turma_nome=turma.nome,
            numero_evento_na_turma=1,
            tipo=TipoEventoEnum.AULA,
            horario_inicio="19:00",
            horario_fim="20:00",
            status=StatusEventoEnum.ENCERRADO,
        ),
        Evento(
            dia_id=dias[1].id,
            turma_id=None,
            turma_nome=None,
            numero_evento_na_turma=None,
            tipo=TipoEventoEnum.JOGO_LIVRE,
            horario_inicio="20:00",
            horario_fim="21:00",
            status=StatusEventoEnum.ENCERRADO,
        ),
    ]
    db_session.add_all(eventos)
    db_session.flush()

    snapshots = [
        JogadorEvento(
            evento_id=evento.id,
            jogador_id=jogador.id,
            nome=jogador.nome,
            status=StatusPresencaEnum.presente,
        )
        for evento in eventos
    ]
    db_session.add_all(snapshots)
    db_session.flush()

    partidas = []
    for index, evento in enumerate(eventos):
        times = [
            TimeEvento(evento_id=evento.id, nome=f"Time {index}A"),
            TimeEvento(evento_id=evento.id, nome=f"Time {index}B"),
        ]
        db_session.add_all(times)
        db_session.flush()
        partida = Partida(
            evento_id=evento.id,
            ordem=1,
            status=PartidaStatusEnum.ENCERRADA,
            time_a_id=times[0].id,
            time_b_id=times[1].id,
            gols_time_a=index + 1,
            gols_time_b=index,
        )
        db_session.add(partida)
        db_session.flush()
        db_session.add(
            EstatisticaJogadorPartida(
                partida_id=partida.id,
                jogador_evento_id=snapshots[index].id,
                gols=index + 1,
                assistencias=index,
            )
        )
        partidas.append(partida)
    db_session.commit()
    return jogador, turma, eventos, partidas


def test_ranking_expoe_contextos_de_cada_evento(client: TestClient, db_session):
    jogador, _, eventos, _ = _seed_traceability(db_session)

    response = client.get("/api/dashboards/jogadores/ranking?periodo=30")

    assert response.status_code == 200, response.text
    item = response.json()["items"][0]
    assert item["jogadorId"] == jogador.id
    assert item["gols"] == 3
    assert item["assistencias"] == 1
    assert [contexto["eventoId"] for contexto in item["eventos"]] == [eventos[1].id, eventos[0].id]
    assert item["eventos"][0]["tipo"] == "JOGO_LIVRE"
    assert item["eventos"][1]["turmaNome"] == "Turma rastreavel"


def test_lista_partidas_expoe_origem_e_filtra_turma(client: TestClient, db_session):
    _, turma, eventos, partidas = _seed_traceability(db_session)

    completa = client.get("/api/dashboards/partidas/lista?periodo=30")
    filtrada = client.get(f"/api/dashboards/partidas/lista?periodo=30&turma={turma.id}")

    assert completa.status_code == 200, completa.text
    assert filtrada.status_code == 200, filtrada.text
    items = completa.json()["items"]
    assert [item["partidaId"] for item in items] == [partidas[1].id, partidas[0].id]
    assert items[0]["eventoId"] == eventos[1].id
    assert items[0]["eventoTipo"] == "JOGO_LIVRE"
    assert items[0]["timeANome"] == "Time 1A"
    assert items[0]["golsTimeA"] == 2
    assert [item["eventoId"] for item in filtrada.json()["items"]] == [eventos[0].id]


def test_lista_partidas_preserva_validacao_de_periodo(client: TestClient):
    response = client.get("/api/dashboards/partidas/lista?periodo=7")

    assert response.status_code == 400
    assert response.json()["detail"] == "periodo deve ser 30, 90 ou 365"
