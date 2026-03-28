from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.deps_auth import AuthUser, require_roles
from app.models.dia_aula import (
    Aula as AulaModel,
    EventoParticipante as EventoParticipanteModel,
    EventoParticipanteStatusEnum,
    JogadorAula as JogadorAulaModel,
    Lance as LanceModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusAulaEnum,
    StatusPresencaEnum,
    TimeAula as TimeAulaModel,
    TipoEventoAulaEnum,
)
from app.schemas.eventos import (
    EventoActionOut,
    EventoOut,
    EventoParticipanteOut,
    EventoParticipantesListOut,
    LanceCreateIn,
    LanceCreateOut,
    LanceOut,
    PartidaSeedOut,
    SeedPartidaIn,
    SeedPartidaOut,
    TimeSeedOut,
)


def evento_tipo_canonical(aula: AulaModel) -> str:
    if aula.tipo == TipoEventoAulaEnum.JOGO:
        return "JOGO_LIVRE"
    return "AULA"


def evento_out(aula: AulaModel) -> EventoOut:
    if aula.status == StatusAulaEnum.PLANEJADA:
        canonical_status = "PLANEJADO"
    elif aula.status == StatusAulaEnum.EM_ANDAMENTO:
        canonical_status = "EM_ANDAMENTO"
    elif aula.status == StatusAulaEnum.CONCLUIDA:
        canonical_status = "ENCERRADO"
    else:
        canonical_status = "CANCELADO"

    return EventoOut(
        id=aula.id,
        dia_id=aula.dia_id,
        tipo=evento_tipo_canonical(aula),
        status=canonical_status,
        horario_inicio=aula.horario_inicio,
        horario_fim=aula.horario_fim,
        inicio_at=None,
        fim_at=None,
    )


def participante_out(p: EventoParticipanteModel) -> EventoParticipanteOut:
    return EventoParticipanteOut(
        id=p.id,
        evento_id=p.aula_id,
        jogador_id=p.jogador_id,
        status=p.status,
        rsvp_at=p.rsvp_at,
        checkin_at=p.checkin_at,
        checkout_at=p.checkout_at,
        arrival_seq=p.arrival_seq,
    )


def get_evento_or_404(db: Session, evento_id: int) -> AulaModel:
    evento = db.query(AulaModel).filter(AulaModel.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado")
    return evento


def assert_evento_tipo_jogo_livre(evento: AulaModel) -> None:
    if evento_tipo_canonical(evento) != "JOGO_LIVRE":
        raise HTTPException(
            status_code=409,
            detail="RSVP/check-in self so e permitido para JOGO_LIVRE",
        )


def assert_evento_em_andamento(evento: AulaModel) -> None:
    if evento.status != StatusAulaEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Evento nao esta EM_ANDAMENTO")


def assert_jogador_na_aula(db: Session, evento_id: int, jogador_id: int) -> None:
    found = (
        db.query(JogadorAulaModel.id)
        .filter(
            JogadorAulaModel.aula_id == evento_id,
            JogadorAulaModel.jogador_id == jogador_id,
        )
        .first()
    )
    if not found:
        raise HTTPException(status_code=404, detail="Jogador nao pertence ao evento")


def get_or_create_participante(
    db: Session,
    evento_id: int,
    jogador_id: int,
    user_id: str,
) -> EventoParticipanteModel:
    participante = (
        db.query(EventoParticipanteModel)
        .filter(
            EventoParticipanteModel.aula_id == evento_id,
            EventoParticipanteModel.jogador_id == jogador_id,
        )
        .first()
    )
    if participante:
        return participante

    participante = EventoParticipanteModel(
        aula_id=evento_id,
        jogador_id=jogador_id,
        status=EventoParticipanteStatusEnum.RSVP,
        created_by_user_id=user_id,
        updated_by_user_id=user_id,
        rsvp_at=datetime.now(timezone.utc),
    )
    db.add(participante)
    db.flush()
    return participante


def next_arrival_seq(db: Session, evento_id: int) -> int:
    max_seq = (
        db.query(func.max(EventoParticipanteModel.arrival_seq))
        .filter(EventoParticipanteModel.aula_id == evento_id)
        .with_for_update()
        .scalar()
    )
    return int(max_seq or 0) + 1


def rsvp_self_flow(db: Session, evento_id: int, user: AuthUser) -> dict[str, EventoParticipanteOut]:
    evento = get_evento_or_404(db, evento_id)
    assert_evento_tipo_jogo_livre(evento)
    if evento.status not in {StatusAulaEnum.PLANEJADA, StatusAulaEnum.EM_ANDAMENTO}:
        raise HTTPException(status_code=409, detail="RSVP nao permitido para este status")
    if user.jogador_id is None:
        raise HTTPException(status_code=403, detail="User sem jogador associado")

    assert_jogador_na_aula(db, evento.id, user.jogador_id)
    participante = get_or_create_participante(db, evento.id, user.jogador_id, user.user_id)
    if participante.status == EventoParticipanteStatusEnum.CHECKED_IN:
        db.commit()
        return {"participante": participante_out(participante)}

    participante.status = EventoParticipanteStatusEnum.RSVP
    participante.rsvp_at = participante.rsvp_at or datetime.now(timezone.utc)
    participante.updated_by_user_id = user.user_id
    db.commit()
    db.refresh(participante)
    return {"participante": participante_out(participante)}


def checkin_self_flow(db: Session, evento_id: int, user: AuthUser) -> dict[str, EventoParticipanteOut]:
    evento = get_evento_or_404(db, evento_id)
    assert_evento_em_andamento(evento)
    if user.jogador_id is None:
        raise HTTPException(status_code=403, detail="User sem jogador associado")

    assert_jogador_na_aula(db, evento.id, user.jogador_id)
    participante = get_or_create_participante(db, evento.id, user.jogador_id, user.user_id)
    if participante.status != EventoParticipanteStatusEnum.CHECKED_IN:
        participante.status = EventoParticipanteStatusEnum.CHECKED_IN
        participante.checkin_at = participante.checkin_at or datetime.now(timezone.utc)
        if participante.arrival_seq is None:
            participante.arrival_seq = next_arrival_seq(db, evento.id)
        participante.updated_by_user_id = user.user_id
    db.commit()
    db.refresh(participante)
    return {"participante": participante_out(participante)}


def checkin_manual_flow(
    db: Session,
    evento_id: int,
    jogador_id: int,
    user: AuthUser,
) -> dict[str, EventoParticipanteOut]:
    require_roles(user, "admin", "treinador")
    evento = get_evento_or_404(db, evento_id)
    assert_evento_em_andamento(evento)
    assert_jogador_na_aula(db, evento.id, jogador_id)

    participante = get_or_create_participante(db, evento.id, jogador_id, user.user_id)
    if participante.status != EventoParticipanteStatusEnum.CHECKED_IN:
        participante.status = EventoParticipanteStatusEnum.CHECKED_IN
        participante.checkin_at = participante.checkin_at or datetime.now(timezone.utc)
        if participante.arrival_seq is None:
            participante.arrival_seq = next_arrival_seq(db, evento.id)
        participante.updated_by_user_id = user.user_id
    db.commit()
    db.refresh(participante)
    return {"participante": participante_out(participante)}


def start_evento_flow(db: Session, evento_id: int, user: AuthUser) -> EventoActionOut:
    require_roles(user, "admin", "treinador")
    evento = get_evento_or_404(db, evento_id)
    if evento.status != StatusAulaEnum.PLANEJADA:
        raise HTTPException(status_code=409, detail="Evento nao pode iniciar neste status")

    presentes_count = (
        db.query(JogadorAulaModel)
        .filter(JogadorAulaModel.aula_id == evento.id)
        .filter(JogadorAulaModel.status == StatusPresencaEnum.presente)
        .count()
    )
    if presentes_count == 0:
        raise HTTPException(status_code=400, detail="Evento nao pode ser iniciado sem jogadores presentes")

    db.query(JogadorAulaModel).filter(
        JogadorAulaModel.aula_id == evento.id,
        JogadorAulaModel.status != StatusPresencaEnum.presente,
    ).update({JogadorAulaModel.status: StatusPresencaEnum.faltou})

    evento.status = StatusAulaEnum.EM_ANDAMENTO
    db.commit()
    db.refresh(evento)
    return EventoActionOut(evento=evento_out(evento))


def end_evento_flow(db: Session, evento_id: int, user: AuthUser) -> EventoActionOut:
    require_roles(user, "admin", "treinador")
    evento = get_evento_or_404(db, evento_id)
    if evento.status != StatusAulaEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Evento nao pode ser encerrado neste status")

    evento.status = StatusAulaEnum.CONCLUIDA
    no_show_updated = (
        db.query(EventoParticipanteModel)
        .filter(EventoParticipanteModel.aula_id == evento.id)
        .filter(EventoParticipanteModel.status == EventoParticipanteStatusEnum.RSVP)
        .update({EventoParticipanteModel.status: EventoParticipanteStatusEnum.NO_SHOW})
    )
    db.commit()
    db.refresh(evento)
    return EventoActionOut(evento=evento_out(evento), summary={"no_show_updated": int(no_show_updated or 0)})


def cancel_evento_flow(db: Session, evento_id: int, user: AuthUser) -> EventoActionOut:
    require_roles(user, "admin", "treinador")
    evento = get_evento_or_404(db, evento_id)
    if evento.status != StatusAulaEnum.PLANEJADA:
        raise HTTPException(status_code=409, detail="Cancelamento permitido apenas em PLANEJADA")
    evento.status = StatusAulaEnum.CANCELADA
    db.commit()
    db.refresh(evento)
    return EventoActionOut(evento=evento_out(evento))


def seed_primeira_partida_flow(
    db: Session,
    evento_id: int,
    payload: SeedPartidaIn,
    user: AuthUser,
) -> SeedPartidaOut:
    require_roles(user, "admin", "treinador")
    if payload.players_count != payload.team_size * 2:
        raise HTTPException(status_code=422, detail="players_count deve ser team_size*2")

    evento = get_evento_or_404(db, evento_id)
    assert_evento_em_andamento(evento)

    participantes = (
        db.query(EventoParticipanteModel)
        .filter(EventoParticipanteModel.aula_id == evento.id)
        .filter(EventoParticipanteModel.status == EventoParticipanteStatusEnum.CHECKED_IN)
        .order_by(EventoParticipanteModel.arrival_seq.asc(), EventoParticipanteModel.id.asc())
        .limit(payload.players_count)
        .all()
    )
    if len(participantes) < payload.players_count:
        raise HTTPException(status_code=400, detail="Nao ha jogadores CHECKED_IN suficientes")

    jogador_ids = [p.jogador_id for p in participantes]
    jogadores_aula = (
        db.query(JogadorAulaModel)
        .filter(JogadorAulaModel.aula_id == evento.id, JogadorAulaModel.jogador_id.in_(jogador_ids))
        .all()
    )
    ja_por_jogador = {ja.jogador_id: ja for ja in jogadores_aula if ja.jogador_id is not None}
    if len(ja_por_jogador) < payload.players_count:
        raise HTTPException(status_code=400, detail="Nem todos jogadores possuem snapshot no evento")

    times = (
        db.query(TimeAulaModel)
        .filter(TimeAulaModel.aula_id == evento.id)
        .order_by(TimeAulaModel.id.asc())
        .all()
    )
    while len(times) < 2:
        idx = len(times) + 1
        t = TimeAulaModel(aula_id=evento.id, nome=f"Time {idx}")
        db.add(t)
        db.flush()
        times.append(t)

    time_a, time_b = times[0], times[1]
    team_a_players: list[int] = []
    team_b_players: list[int] = []
    for idx, participante in enumerate(participantes):
        ja = ja_por_jogador.get(participante.jogador_id)
        if not ja:
            continue
        if idx % 2 == 0:
            ja.time_id = time_a.id
            team_a_players.append(participante.jogador_id)
        else:
            ja.time_id = time_b.id
            team_b_players.append(participante.jogador_id)

    next_ordem = (
        db.query(func.max(PartidaModel.ordem))
        .filter(PartidaModel.aula_id == evento.id)
        .scalar()
    ) or 0
    partida = PartidaModel(
        aula_id=evento.id,
        ordem=int(next_ordem) + 1,
        time_a_id=time_a.id,
        time_b_id=time_b.id,
        status=PartidaStatusEnum.EM_ANDAMENTO,
        inicio_at=datetime.now(timezone.utc),
    )
    db.add(partida)
    db.commit()
    db.refresh(partida)
    return SeedPartidaOut(
        partida=PartidaSeedOut(
            id=partida.id,
            evento_id=evento.id,
            ordem=partida.ordem,
            status=partida.status,
            time_a_id=partida.time_a_id,
            time_b_id=partida.time_b_id,
        ),
        teams=[
            TimeSeedOut(id=time_a.id, nome=time_a.nome, jogadores_ids=team_a_players),
            TimeSeedOut(id=time_b.id, nome=time_b.nome, jogadores_ids=team_b_players),
        ],
    )


def list_participants_flow(db: Session, evento_id: int) -> EventoParticipantesListOut:
    get_evento_or_404(db, evento_id)
    items = (
        db.query(EventoParticipanteModel)
        .filter(EventoParticipanteModel.aula_id == evento_id)
        .order_by(EventoParticipanteModel.id.asc())
        .all()
    )
    return EventoParticipantesListOut(items=[participante_out(i) for i in items])


def list_presentes_flow(db: Session, evento_id: int, order: str) -> EventoParticipantesListOut:
    get_evento_or_404(db, evento_id)
    query = db.query(EventoParticipanteModel).filter(
        EventoParticipanteModel.aula_id == evento_id,
        EventoParticipanteModel.status == EventoParticipanteStatusEnum.CHECKED_IN,
    )
    if order == "arrival":
        query = query.order_by(EventoParticipanteModel.arrival_seq.asc(), EventoParticipanteModel.id.asc())
    else:
        query = query.order_by(EventoParticipanteModel.id.asc())

    items = query.all()
    return EventoParticipantesListOut(items=[participante_out(i) for i in items])


def create_lance_flow(
    db: Session,
    partida_id: int,
    payload: LanceCreateIn,
    user: AuthUser,
) -> LanceCreateOut:
    partida = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.aula))
        .filter(PartidaModel.id == partida_id)
        .first()
    )
    if not partida:
        raise HTTPException(status_code=404, detail="Partida nao encontrada")
    if partida.aula.status != StatusAulaEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Evento nao esta EM_ANDAMENTO")
    if partida.status != PartidaStatusEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Partida nao esta EM_ANDAMENTO")

    if payload.client_event_id:
        existing = (
            db.query(LanceModel)
            .filter(
                LanceModel.partida_id == partida.id,
                LanceModel.client_event_id == payload.client_event_id,
                LanceModel.is_deleted.is_(False),
            )
            .first()
        )
        if existing:
            return LanceCreateOut(
                lance=LanceOut.model_validate(
                    {
                        "id": existing.id,
                        "partida_id": existing.partida_id,
                        "evento_id": existing.aula_id,
                        "jogador_id": existing.jogador_id,
                        "tipo": existing.tipo,
                        "payload": existing.payload,
                        "client_event_id": existing.client_event_id,
                        "created_by_user_id": existing.created_by_user_id,
                        "created_at": existing.created_at,
                    }
                )
            )

    lance = LanceModel(
        partida_id=partida.id,
        aula_id=partida.aula_id,
        jogador_id=payload.jogador_id,
        tipo=payload.tipo,
        payload=payload.payload,
        client_event_id=payload.client_event_id,
        created_by_user_id=user.user_id,
    )
    db.add(lance)
    db.commit()
    db.refresh(lance)
    return LanceCreateOut(
        lance=LanceOut.model_validate(
            {
                "id": lance.id,
                "partida_id": lance.partida_id,
                "evento_id": lance.aula_id,
                "jogador_id": lance.jogador_id,
                "tipo": lance.tipo,
                "payload": lance.payload,
                "client_event_id": lance.client_event_id,
                "created_by_user_id": lance.created_by_user_id,
                "created_at": lance.created_at,
            }
        )
    )
