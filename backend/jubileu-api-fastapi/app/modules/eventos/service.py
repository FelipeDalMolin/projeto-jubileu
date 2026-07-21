from __future__ import annotations

from datetime import datetime, timezone
from datetime import timedelta
import hashlib
import json
import random
import uuid

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.deps_auth import AuthUser, require_roles
from app.models.dia_evento import (
    Evento as EventoModel,
    EventoParticipante as EventoParticipanteModel,
    EventoParticipanteStatusEnum,
    JogadorEvento as JogadorEventoModel,
    Lance as LanceModel,
    EventoRotacaoEstado as EventoRotacaoEstadoModel,
    EventoRotacaoSorteio as EventoRotacaoSorteioModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    RotacaoSorteioStatusEnum,
    StatusEventoEnum,
    StatusPresencaEnum,
    TimeEvento as TimeEventoModel,
    TipoEventoEnum,
)
from app.schemas.eventos import (
    EventoActionOut,
    EventoOut,
    EventoParticipanteOut,
    EventoParticipantesListOut,
    LanceCreateIn,
    LanceCreateOut,
    LanceOut,
    LanceListOut,
    ProximaPartidaIn,
    ProximaPartidaOut,
    RotacaoAuditRecordOut,
    RotacaoConfirmOut,
    RotacaoEstadoOut,
    RotacaoEstadoUpdateIn,
    RotacaoGrupoOut,
    RotacaoIndicadoresOut,
    RotacaoPreviewIn,
    RotacaoPreviewOut,
    PartidaSeedOut,
    SeedPartidaIn,
    SeedPartidaOut,
    TimeSeedOut,
)


def evento_tipo_canonical(evento: EventoModel) -> str:
    if evento.tipo == TipoEventoEnum.JOGO_LIVRE:
        return "JOGO_LIVRE"
    return "AULA"


def evento_out(evento: EventoModel) -> EventoOut:
    if evento.status == StatusEventoEnum.PLANEJADO:
        canonical_status = "PLANEJADO"
    elif evento.status == StatusEventoEnum.EM_ANDAMENTO:
        canonical_status = "EM_ANDAMENTO"
    elif evento.status == StatusEventoEnum.ENCERRADO:
        canonical_status = "ENCERRADO"
    else:
        canonical_status = "CANCELADO"

    return EventoOut(
        id=evento.id,
        dia_id=evento.dia_id,
        tipo=evento_tipo_canonical(evento),
        status=canonical_status,
        horario_inicio=evento.horario_inicio,
        horario_fim=evento.horario_fim,
        inicio_at=None,
        fim_at=None,
    )


def participante_out(p: EventoParticipanteModel) -> EventoParticipanteOut:
    return EventoParticipanteOut(
        id=p.id,
        evento_id=p.evento_id,
        jogador_id=p.jogador_id,
        status=p.status,
        rsvp_at=p.rsvp_at,
        checkin_at=p.checkin_at,
        checkout_at=p.checkout_at,
        arrival_seq=p.arrival_seq,
    )


def lance_out(db: Session, lance: LanceModel) -> LanceOut:
    jogador_nome: str | None = None
    time_id: int | None = None
    time_nome: str | None = None

    if lance.jogador_id is not None:
        jogador_evento = (
            db.query(JogadorEventoModel)
            .filter(
                JogadorEventoModel.evento_id == lance.evento_id,
                JogadorEventoModel.jogador_id == lance.jogador_id,
            )
            .first()
        )
        if jogador_evento:
            jogador_nome = jogador_evento.nome
            time_id = jogador_evento.time_id
            if time_id is not None:
                time = db.query(TimeEventoModel).filter(TimeEventoModel.id == time_id).first()
                time_nome = time.nome if time else None

    return LanceOut.model_validate(
        {
            "id": lance.id,
            "partida_id": lance.partida_id,
            "evento_id": lance.evento_id,
            "jogador_id": lance.jogador_id,
            "tipo": lance.tipo,
            "payload": lance.payload,
            "client_event_id": lance.client_event_id,
            "created_by_user_id": lance.created_by_user_id,
            "created_at": lance.created_at,
            "jogador_nome": jogador_nome,
            "time_id": time_id,
            "time_nome": time_nome,
        }
    )


def get_evento_or_404(db: Session, evento_id: int) -> EventoModel:
    evento = db.query(EventoModel).filter(EventoModel.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado")
    return evento


def assert_evento_tipo_jogo_livre(evento: EventoModel) -> None:
    if evento_tipo_canonical(evento) != "JOGO_LIVRE":
        raise HTTPException(
            status_code=409,
            detail="RSVP/check-in self so e permitido para JOGO_LIVRE",
        )


def assert_evento_em_andamento(evento: EventoModel) -> None:
    if evento.status != StatusEventoEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Evento nao esta EM_ANDAMENTO")


def assert_jogador_na_evento(db: Session, evento_id: int, jogador_id: int) -> None:
    found = (
        db.query(JogadorEventoModel.id)
        .filter(
            JogadorEventoModel.evento_id == evento_id,
            JogadorEventoModel.jogador_id == jogador_id,
        )
        .first()
    )
    if not found:
        raise HTTPException(status_code=404, detail="Jogador nao pertence ao evento")


def _lock_evento_for_command(db: Session, evento_id: int) -> None:
    db.query(EventoModel.id).filter(EventoModel.id == evento_id).with_for_update().one()


def _version_conflict(resource: str, expected: int | None, current: int | None) -> HTTPException:
    return HTTPException(
        status_code=409,
        detail={
            "code": "version_conflict",
            "resource": resource,
            "expected_version": expected,
            "current_version": current,
            "message": "Estado alterado no servidor. Recarregue antes de salvar novamente.",
        },
    )


def get_or_create_participante(
    db: Session,
    evento_id: int,
    jogador_id: int,
    user_id: str,
) -> EventoParticipanteModel:
    participante = (
        db.query(EventoParticipanteModel)
        .filter(
            EventoParticipanteModel.evento_id == evento_id,
            EventoParticipanteModel.jogador_id == jogador_id,
        )
        .first()
    )
    if participante:
        return participante

    participante = EventoParticipanteModel(
        evento_id=evento_id,
        jogador_id=jogador_id,
        status=EventoParticipanteStatusEnum.RSVP,
        created_by_user_id=user_id,
        updated_by_user_id=user_id,
        rsvp_at=datetime.now(timezone.utc),
    )
    db.add(participante)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        participante = (
            db.query(EventoParticipanteModel)
            .filter(
                EventoParticipanteModel.evento_id == evento_id,
                EventoParticipanteModel.jogador_id == jogador_id,
            )
            .first()
        )
        if participante:
            return participante
        raise
    return participante


def next_arrival_seq(db: Session, evento_id: int) -> int:
    db.query(EventoModel.id).filter(EventoModel.id == evento_id).with_for_update().one()
    max_seq = (
        db.query(func.max(EventoParticipanteModel.arrival_seq))
        .filter(EventoParticipanteModel.evento_id == evento_id)
        .scalar()
    )
    return int(max_seq or 0) + 1


def rsvp_self_flow(db: Session, evento_id: int, user: AuthUser) -> dict[str, EventoParticipanteOut]:
    evento = get_evento_or_404(db, evento_id)
    assert_evento_tipo_jogo_livre(evento)
    if evento.status not in {StatusEventoEnum.PLANEJADO, StatusEventoEnum.EM_ANDAMENTO}:
        raise HTTPException(status_code=409, detail="RSVP nao permitido para este status")
    if user.jogador_id is None:
        raise HTTPException(status_code=403, detail="User sem jogador associado")

    assert_jogador_na_evento(db, evento.id, user.jogador_id)
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


def rsvp_self_cancel_flow(db: Session, evento_id: int, user: AuthUser) -> dict[str, EventoParticipanteOut]:
    evento = get_evento_or_404(db, evento_id)
    assert_evento_tipo_jogo_livre(evento)
    if user.jogador_id is None:
        raise HTTPException(status_code=403, detail="User sem jogador associado")

    participante = (
        db.query(EventoParticipanteModel)
        .filter(
            EventoParticipanteModel.evento_id == evento.id,
            EventoParticipanteModel.jogador_id == user.jogador_id,
        )
        .first()
    )
    if not participante:
        raise HTTPException(status_code=404, detail="Participacao nao encontrada")
    if participante.status == EventoParticipanteStatusEnum.CHECKED_IN:
        raise HTTPException(status_code=409, detail="Use desfazer check-in antes de cancelar RSVP")

    participante.status = EventoParticipanteStatusEnum.CANCELED
    participante.updated_by_user_id = user.user_id
    db.commit()
    db.refresh(participante)
    return {"participante": participante_out(participante)}


def checkin_self_flow(db: Session, evento_id: int, user: AuthUser) -> dict[str, EventoParticipanteOut]:
    evento = get_evento_or_404(db, evento_id)
    assert_evento_em_andamento(evento)
    if user.jogador_id is None:
        raise HTTPException(status_code=403, detail="User sem jogador associado")

    assert_jogador_na_evento(db, evento.id, user.jogador_id)
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


def checkin_self_cancel_flow(db: Session, evento_id: int, user: AuthUser) -> dict[str, EventoParticipanteOut]:
    evento = get_evento_or_404(db, evento_id)
    assert_evento_em_andamento(evento)
    if user.jogador_id is None:
        raise HTTPException(status_code=403, detail="User sem jogador associado")

    participante = (
        db.query(EventoParticipanteModel)
        .filter(
            EventoParticipanteModel.evento_id == evento.id,
            EventoParticipanteModel.jogador_id == user.jogador_id,
        )
        .first()
    )
    if not participante:
        raise HTTPException(status_code=404, detail="Participacao nao encontrada")
    if participante.status != EventoParticipanteStatusEnum.CHECKED_IN:
        raise HTTPException(status_code=409, detail="Participante nao esta CHECKED_IN")

    participante.status = EventoParticipanteStatusEnum.CHECKED_OUT
    participante.checkout_at = datetime.now(timezone.utc)
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
    assert_jogador_na_evento(db, evento.id, jogador_id)

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
    if evento.status != StatusEventoEnum.PLANEJADO:
        raise HTTPException(status_code=409, detail="Evento nao pode iniciar neste status")

    db.query(JogadorEventoModel).filter(
        JogadorEventoModel.evento_id == evento.id,
        JogadorEventoModel.status != StatusPresencaEnum.presente,
    ).update({JogadorEventoModel.status: StatusPresencaEnum.faltou})

    evento.status = StatusEventoEnum.EM_ANDAMENTO
    db.commit()
    db.refresh(evento)
    return EventoActionOut(evento=evento_out(evento))


def end_evento_flow(db: Session, evento_id: int, user: AuthUser) -> EventoActionOut:
    require_roles(user, "admin", "treinador")
    evento = get_evento_or_404(db, evento_id)
    if evento.status != StatusEventoEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Evento nao pode ser encerrado neste status")

    partida_ativa = (
        db.query(PartidaModel.id)
        .filter(
            PartidaModel.evento_id == evento.id,
            PartidaModel.status == PartidaStatusEnum.EM_ANDAMENTO,
        )
        .first()
    )
    if partida_ativa:
        raise HTTPException(
            status_code=409,
            detail="Encerre a partida em andamento antes de encerrar o evento",
        )

    evento.status = StatusEventoEnum.ENCERRADO
    no_show_updated = (
        db.query(EventoParticipanteModel)
        .filter(EventoParticipanteModel.evento_id == evento.id)
        .filter(EventoParticipanteModel.status == EventoParticipanteStatusEnum.RSVP)
        .update({EventoParticipanteModel.status: EventoParticipanteStatusEnum.NO_SHOW})
    )
    db.commit()
    db.refresh(evento)
    return EventoActionOut(evento=evento_out(evento), summary={"no_show_updated": int(no_show_updated or 0)})


def cancel_evento_flow(db: Session, evento_id: int, user: AuthUser) -> EventoActionOut:
    require_roles(user, "admin", "treinador")
    evento = get_evento_or_404(db, evento_id)
    if evento.status != StatusEventoEnum.PLANEJADO:
        raise HTTPException(status_code=409, detail="Cancelamento permitido apenas em PLANEJADO")
    evento.status = StatusEventoEnum.CANCELADO
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
    _lock_evento_for_command(db, evento.id)

    participantes = (
        db.query(EventoParticipanteModel)
        .filter(EventoParticipanteModel.evento_id == evento.id)
        .filter(EventoParticipanteModel.status == EventoParticipanteStatusEnum.CHECKED_IN)
        .order_by(EventoParticipanteModel.arrival_seq.asc(), EventoParticipanteModel.id.asc())
        .limit(payload.players_count)
        .all()
    )
    if len(participantes) < payload.players_count:
        raise HTTPException(status_code=400, detail="Nao ha jogadores CHECKED_IN suficientes")

    jogador_ids = [p.jogador_id for p in participantes]
    jogadores_evento = (
        db.query(JogadorEventoModel)
        .filter(JogadorEventoModel.evento_id == evento.id, JogadorEventoModel.jogador_id.in_(jogador_ids))
        .all()
    )
    ja_por_jogador = {ja.jogador_id: ja for ja in jogadores_evento if ja.jogador_id is not None}
    if len(ja_por_jogador) < payload.players_count:
        raise HTTPException(status_code=400, detail="Nem todos jogadores possuem snapshot no evento")

    times = (
        db.query(TimeEventoModel)
        .filter(TimeEventoModel.evento_id == evento.id)
        .order_by(TimeEventoModel.id.asc())
        .all()
    )
    while len(times) < 2:
        idx = len(times) + 1
        nomes_existentes = {time.nome for time in times}
        while f"Time {idx}" in nomes_existentes:
            idx += 1
        t = TimeEventoModel(evento_id=evento.id, nome=f"Time {idx}")
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
        .filter(PartidaModel.evento_id == evento.id)
        .scalar()
    ) or 0
    partida = PartidaModel(
        evento_id=evento.id,
        ordem=int(next_ordem) + 1,
        time_a_id=time_a.id,
        time_b_id=time_b.id,
        status=PartidaStatusEnum.EM_ANDAMENTO,
        inicio_at=datetime.now(timezone.utc),
    )
    db.add(partida)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Partida inicial mudou no servidor. Recarregue e tente novamente.",
        ) from exc
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
        .filter(EventoParticipanteModel.evento_id == evento_id)
        .order_by(EventoParticipanteModel.id.asc())
        .all()
    )
    return EventoParticipantesListOut(items=[participante_out(i) for i in items])


def list_presentes_flow(db: Session, evento_id: int, order: str) -> EventoParticipantesListOut:
    get_evento_or_404(db, evento_id)
    query = db.query(EventoParticipanteModel).filter(
        EventoParticipanteModel.evento_id == evento_id,
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
    def resolve_jogador_global_id(raw_id: int | None) -> int | None:
        if raw_id is None:
            return None

        jogador_evento_por_id = (
            db.query(JogadorEventoModel)
            .filter(
                JogadorEventoModel.evento_id == partida.evento_id,
                JogadorEventoModel.id == raw_id,
            )
            .first()
        )
        if jogador_evento_por_id:
            if jogador_evento_por_id.jogador_id is None:
                raise HTTPException(
                    status_code=422,
                    detail="Jogador da evento sem vinculo global; lance nominal indisponivel para este jogador",
                )
            return int(jogador_evento_por_id.jogador_id)

        jogador_evento_por_global = (
            db.query(JogadorEventoModel.id)
            .filter(
                JogadorEventoModel.evento_id == partida.evento_id,
                JogadorEventoModel.jogador_id == raw_id,
            )
            .first()
        )
        if jogador_evento_por_global:
            return int(raw_id)

        raise HTTPException(status_code=422, detail="Jogador informado nao pertence ao evento")

    partida = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.evento))
        .filter(PartidaModel.id == partida_id)
        .first()
    )
    if not partida:
        raise HTTPException(status_code=404, detail="Partida nao encontrada")
    if partida.evento.status != StatusEventoEnum.EM_ANDAMENTO:
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
            return LanceCreateOut(lance=lance_out(db, existing))

    jogador_id_resolvido = resolve_jogador_global_id(payload.jogador_id)
    payload_normalizado = dict(payload.payload or {})
    raw_jogador_secundario = payload_normalizado.get("jogador_secundario_id")
    if raw_jogador_secundario is not None:
        try:
            payload_normalizado["jogador_secundario_id"] = resolve_jogador_global_id(
                int(raw_jogador_secundario)
            )
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="jogador_secundario_id invalido") from exc

    raw_time_id = payload_normalizado.get("time_id")
    if raw_time_id is not None:
        try:
            payload_normalizado["time_id"] = int(raw_time_id)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="time_id invalido") from exc

    lance = LanceModel(
        partida_id=partida.id,
        evento_id=partida.evento_id,
        jogador_id=jogador_id_resolvido,
        tipo=payload.tipo,
        payload=payload_normalizado,
        client_event_id=payload.client_event_id,
        created_by_user_id=user.user_id,
    )
    partida_id_value = int(partida.id)
    db.add(lance)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if payload.client_event_id:
            existing = (
                db.query(LanceModel)
                .filter(
                    LanceModel.partida_id == partida_id_value,
                    LanceModel.client_event_id == payload.client_event_id,
                    LanceModel.is_deleted.is_(False),
                )
                .first()
            )
            if existing:
                return LanceCreateOut(lance=lance_out(db, existing))
        raise HTTPException(status_code=422, detail="Lance invalido para o estado atual dos dados") from exc
    db.refresh(lance)
    return LanceCreateOut(lance=lance_out(db, lance))


def list_lances_flow(
    db: Session,
    evento_id: int,
    partida_id: int | None,
    since: datetime | None,
    limit: int,
) -> LanceListOut:
    get_evento_or_404(db, evento_id)
    cap_limit = max(1, min(limit, 500))

    if partida_id is not None:
        partida = (
            db.query(PartidaModel.id)
            .filter(
                PartidaModel.id == partida_id,
                PartidaModel.evento_id == evento_id,
            )
            .first()
        )
        if not partida:
            raise HTTPException(status_code=404, detail="Partida nao encontrada para o evento")

    query = (
        db.query(LanceModel)
        .filter(
            LanceModel.evento_id == evento_id,
            LanceModel.is_deleted.is_(False),
        )
    )
    if partida_id is not None:
        query = query.filter(LanceModel.partida_id == partida_id)
    if since is not None:
        query = query.filter(LanceModel.created_at > since)

    items = (
        query.order_by(LanceModel.created_at.asc(), LanceModel.id.asc())
        .limit(cap_limit)
        .all()
    )
    return LanceListOut(items=[lance_out(db, lance) for lance in items])


def _assert_evento_tipo_com_rotacao(evento: EventoModel) -> None:
    tipo = evento_tipo_canonical(evento)
    if tipo not in {"AULA", "JOGO_LIVRE"}:
        raise HTTPException(status_code=409, detail="Rotacao manual nao habilitada para este tipo de evento")


def _buscar_partida_em_andamento(db: Session, evento_id: int) -> PartidaModel | None:
    return (
        db.query(PartidaModel)
        .filter(
            PartidaModel.evento_id == evento_id,
            PartidaModel.status == PartidaStatusEnum.EM_ANDAMENTO,
        )
        .order_by(PartidaModel.ordem.asc(), PartidaModel.id.asc())
        .first()
    )


def _listar_jogadores_presentes_ids(db: Session, evento: EventoModel) -> list[int]:
    if evento_tipo_canonical(evento) == "JOGO_LIVRE":
        rows = (
            db.query(EventoParticipanteModel.jogador_id, JogadorEventoModel.id)
            .join(
                JogadorEventoModel,
                (JogadorEventoModel.evento_id == EventoParticipanteModel.evento_id)
                & (JogadorEventoModel.jogador_id == EventoParticipanteModel.jogador_id),
            )
            .filter(
                EventoParticipanteModel.evento_id == evento.id,
                EventoParticipanteModel.status == EventoParticipanteStatusEnum.CHECKED_IN,
            )
            .order_by(
                EventoParticipanteModel.arrival_seq.asc(),
                EventoParticipanteModel.id.asc(),
            )
            .all()
        )
        ids = [int(row.id) for row in rows if row.id is not None]
        return ids

    rows = (
        db.query(JogadorEventoModel.id)
        .filter(
            JogadorEventoModel.evento_id == evento.id,
            JogadorEventoModel.status == StatusPresencaEnum.presente,
        )
        .order_by(JogadorEventoModel.id.asc())
        .all()
    )
    return [int(row.id) for row in rows]


def _listar_jogadores_em_campo_ids(db: Session, evento_id: int, partida: PartidaModel | None) -> set[int]:
    if not partida:
        return set()

    rows = (
        db.query(JogadorEventoModel.id)
        .filter(JogadorEventoModel.evento_id == evento_id)
        .filter(JogadorEventoModel.time_id.in_([partida.time_a_id, partida.time_b_id]))
        .all()
    )
    return {int(row.id) for row in rows}


def _chunk_em_grupos(fila_ids: list[int], team_size_ref: int) -> list[dict]:
    grupos: list[dict] = []
    safe_size = max(1, int(team_size_ref))
    current: list[int] = []
    idx = 1
    for jogador_id in fila_ids:
        current.append(int(jogador_id))
        if len(current) >= safe_size:
            grupos.append({"grupo_id": f"grupo-{idx}", "jogadores_ids": list(current)})
            idx += 1
            current = []
    if current:
        grupos.append({"grupo_id": f"grupo-{idx}", "jogadores_ids": list(current)})
    return grupos


def _sanitize_grupos(grupos_raw: list[dict] | None) -> list[dict]:
    grupos: list[dict] = []
    for idx, item in enumerate(grupos_raw or [], start=1):
        grupo_id = str(item.get("grupo_id") or f"grupo-{idx}")
        jogadores_ids = [int(v) for v in (item.get("jogadores_ids") or [])]
        grupos.append({"grupo_id": grupo_id, "jogadores_ids": jogadores_ids})
    return grupos


def _reconcile_rotacao_com_estado_jogo(
    estado: EventoRotacaoEstadoModel,
    presentes_ids: list[int],
    em_campo_ids: set[int],
) -> bool:
    elegiveis = [jid for jid in presentes_ids if jid not in em_campo_ids]
    elegiveis_set = set(elegiveis)

    fila_atual = [int(v) for v in (estado.fila_jogadores_ids or [])]
    fila_reconciliada = [jid for jid in fila_atual if jid in elegiveis_set]
    for jid in elegiveis:
        if jid not in fila_reconciliada:
            fila_reconciliada.append(jid)

    grupos_atual = _sanitize_grupos(estado.proximos_times)
    grupos_reconciliados: list[dict] = []
    usados: set[int] = set()
    for grupo in grupos_atual:
        ids_validos: list[int] = []
        for jid in grupo.get("jogadores_ids", []):
            jid_int = int(jid)
            if jid_int not in elegiveis_set:
                continue
            if jid_int in usados:
                continue
            ids_validos.append(jid_int)
            usados.add(jid_int)
        grupos_reconciliados.append(
            {
                "grupo_id": str(grupo.get("grupo_id")),
                "jogadores_ids": ids_validos,
            }
        )

    changed = (
        fila_reconciliada != fila_atual
        or grupos_reconciliados != grupos_atual
    )
    if not changed:
        return False

    estado.fila_jogadores_ids = fila_reconciliada
    estado.proximos_times = grupos_reconciliados
    estado.version = int(estado.version) + 1
    estado.updated_by_user_id = "system-sync"
    return True


def _build_rotacao_indicadores(
    em_campo_count: int,
    fila_ids: list[int],
    grupos: list[dict],
    team_size_ref: int,
) -> RotacaoIndicadoresOut:
    completos = 0
    aguardando = 0
    for grupo in grupos:
        qtd = len(grupo.get("jogadores_ids") or [])
        if qtd >= team_size_ref:
            completos += 1
        else:
            aguardando += max(team_size_ref - qtd, 0)
    return RotacaoIndicadoresOut(
        jogadores_em_campo=em_campo_count,
        jogadores_na_fila=len(fila_ids),
        proximos_times_completos=completos,
        jogadores_aguardando_complemento=aguardando,
    )


def _rotacao_estado_out(
    evento_id: int,
    team_size_ref: int,
    duracao_partida_segundos: int,
    fila_ids: list[int],
    grupos: list[dict],
    em_campo_count: int,
    version: int,
    updated_at: datetime | None,
    updated_by_user_id: str | None,
) -> RotacaoEstadoOut:
    grupos_out = []
    for grupo in grupos:
        ids = [int(v) for v in (grupo.get("jogadores_ids") or [])]
        faltam = max(team_size_ref - len(ids), 0)
        grupos_out.append(
            RotacaoGrupoOut(
                grupo_id=str(grupo.get("grupo_id")),
                jogadores_ids=ids,
                target_size=team_size_ref,
                faltam=faltam,
                completo=(faltam == 0),
            )
        )
    return RotacaoEstadoOut(
        evento_id=evento_id,
        team_size_ref=team_size_ref,
        duracao_partida_segundos=duracao_partida_segundos,
        fila_jogadores_ids=fila_ids,
        proximos_times=grupos_out,
        indicadores=_build_rotacao_indicadores(em_campo_count, fila_ids, grupos, team_size_ref),
        version=version,
        updated_at=updated_at,
        updated_by_user_id=updated_by_user_id,
    )


def _get_or_init_rotacao_estado(
    db: Session,
    evento: EventoModel,
    *,
    for_update: bool = False,
) -> EventoRotacaoEstadoModel:
    query = db.query(EventoRotacaoEstadoModel).filter(EventoRotacaoEstadoModel.evento_id == evento.id)
    if for_update:
        query = query.with_for_update()
    estado = query.first()
    if estado:
        return estado

    partida_ativa = _buscar_partida_em_andamento(db, evento.id)
    presentes_ids = _listar_jogadores_presentes_ids(db, evento)
    em_campo_ids = _listar_jogadores_em_campo_ids(db, evento.id, partida_ativa)
    fila_ids = [j for j in presentes_ids if j not in em_campo_ids]
    team_size_ref = 8
    estado = EventoRotacaoEstadoModel(
        evento_id=evento.id,
        team_size_ref=team_size_ref,
        duracao_partida_segundos=600,
        fila_jogadores_ids=fila_ids,
        proximos_times=_chunk_em_grupos(fila_ids, team_size_ref),
        version=1,
    )
    db.add(estado)
    db.flush()
    return estado


def _expire_previews_if_needed(db: Session, evento_id: int) -> None:
    now = datetime.now(timezone.utc)
    db.query(EventoRotacaoSorteioModel).filter(
        EventoRotacaoSorteioModel.evento_id == evento_id,
        EventoRotacaoSorteioModel.status == RotacaoSorteioStatusEnum.PREVIEWED,
        EventoRotacaoSorteioModel.expires_at < now,
    ).update({EventoRotacaoSorteioModel.status: RotacaoSorteioStatusEnum.EXPIRED}, synchronize_session=False)


def _rotacao_audit_out(record: EventoRotacaoSorteioModel) -> RotacaoAuditRecordOut:
    return RotacaoAuditRecordOut(
        token=record.token,
        status=record.status,
        grupo_alvo_id=record.grupo_alvo_id,
        needed_count=record.needed_count,
        candidatos_ids=[int(v) for v in (record.candidatos_ids or [])],
        sorteados_ids=[int(v) for v in (record.sorteados_ids or [])],
        nao_sorteados_ids=[int(v) for v in (record.nao_sorteados_ids or [])],
        partida_origem_id=record.partida_origem_id,
        created_by_user_id=record.created_by_user_id,
        created_at=record.created_at,
        confirmed_at=record.confirmed_at,
        expires_at=record.expires_at,
    )


def _to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def get_rotacao_estado_flow(db: Session, evento_id: int, user: AuthUser) -> RotacaoEstadoOut:
    _ = user
    evento = get_evento_or_404(db, evento_id)
    _assert_evento_tipo_com_rotacao(evento)
    _expire_previews_if_needed(db, evento.id)

    estado = _get_or_init_rotacao_estado(db, evento)
    partida_ativa = _buscar_partida_em_andamento(db, evento.id)
    presentes_ids = _listar_jogadores_presentes_ids(db, evento)
    em_campo_ids = _listar_jogadores_em_campo_ids(db, evento.id, partida_ativa)
    _reconcile_rotacao_com_estado_jogo(estado, presentes_ids, em_campo_ids)
    fila_ids = [int(v) for v in (estado.fila_jogadores_ids or [])]
    grupos = _sanitize_grupos(estado.proximos_times)
    db.commit()
    return _rotacao_estado_out(
        evento_id=evento.id,
        team_size_ref=int(estado.team_size_ref),
        duracao_partida_segundos=int(estado.duracao_partida_segundos),
        fila_ids=fila_ids,
        grupos=grupos,
        em_campo_count=len(em_campo_ids),
        version=int(estado.version),
        updated_at=estado.updated_at,
        updated_by_user_id=estado.updated_by_user_id,
    )


def _proxima_partida_payload_hash(payload: ProximaPartidaIn) -> str:
    canonical = json.dumps(payload.model_dump(), sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _partida_proxima_out(partida: PartidaModel) -> ProximaPartidaOut:
    return ProximaPartidaOut(
        partida=PartidaSeedOut(
            id=partida.id,
            evento_id=partida.evento_id,
            ordem=partida.ordem,
            status=partida.status,
            time_a_id=partida.time_a_id,
            time_b_id=partida.time_b_id,
        ),
        rotation_version=int(partida.command_rotation_version or 0),
        fila_resultante=partida.command_result_queue or [],
    )


def criar_proxima_partida_flow(
    db: Session,
    evento_id: int,
    payload: ProximaPartidaIn,
    user: AuthUser,
    *,
    data_iso: str | None = None,
) -> ProximaPartidaOut:
    require_roles(user, "admin", "treinador", "auxiliar")
    evento = get_evento_or_404(db, evento_id)
    _assert_evento_tipo_com_rotacao(evento)
    _lock_evento_for_command(db, evento.id)

    if data_iso is not None and evento.dia.data_iso != data_iso:
        raise HTTPException(status_code=404, detail="Evento nao pertence ao dia informado")

    estado = _get_or_init_rotacao_estado(db, evento, for_update=True)
    payload_hash = _proxima_partida_payload_hash(payload)
    comando_existente = (
        db.query(PartidaModel)
        .filter(
            PartidaModel.evento_id == evento.id,
            PartidaModel.client_command_id == payload.client_command_id,
        )
        .first()
    )
    if comando_existente:
        if comando_existente.client_command_payload_hash != payload_hash:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "idempotency_conflict",
                    "message": "client_command_id ja foi usado com outro payload.",
                },
            )
        return _partida_proxima_out(comando_existente)

    if payload.expected_rotation_version != int(estado.version):
        raise _version_conflict("rotacao", payload.expected_rotation_version, int(estado.version))
    if evento.status != StatusEventoEnum.EM_ANDAMENTO:
        raise HTTPException(status_code=409, detail="Evento nao esta EM_ANDAMENTO")
    if payload.time_a_id == payload.time_b_id:
        raise HTTPException(status_code=422, detail="Os times do confronto devem ser distintos")
    if _buscar_partida_em_andamento(db, evento.id):
        raise HTTPException(
            status_code=409,
            detail={"code": "active_match_conflict", "message": "Ja existe partida em andamento."},
        )

    partida_origem = (
        db.query(PartidaModel)
        .filter(
            PartidaModel.id == payload.partida_origem_id,
            PartidaModel.evento_id == evento.id,
        )
        .with_for_update()
        .first()
    )
    if not partida_origem:
        raise HTTPException(status_code=404, detail="Partida de origem nao encontrada no evento")
    if partida_origem.status != PartidaStatusEnum.ENCERRADA:
        raise HTTPException(status_code=409, detail="Partida de origem precisa estar ENCERRADA")

    times = (
        db.query(TimeEventoModel)
        .filter(
            TimeEventoModel.evento_id == evento.id,
            TimeEventoModel.id.in_([payload.time_a_id, payload.time_b_id]),
        )
        .with_for_update()
        .all()
    )
    times_por_id = {int(time.id): time for time in times}
    if set(times_por_id) != {payload.time_a_id, payload.time_b_id}:
        raise HTTPException(status_code=404, detail="Time selecionado nao pertence ao evento")

    jogadores_por_time: dict[int, list[int]] = {}
    envolvidos = {
        partida_origem.time_a_id,
        partida_origem.time_b_id,
        payload.time_a_id,
        payload.time_b_id,
    }
    for time_id in envolvidos:
        rows = (
            db.query(JogadorEventoModel.id)
            .filter(JogadorEventoModel.evento_id == evento.id, JogadorEventoModel.time_id == time_id)
            .order_by(JogadorEventoModel.id.asc())
            .all()
        )
        jogadores_por_time[int(time_id)] = [int(row.id) for row in rows]

    selecionados = {payload.time_a_id, payload.time_b_id}
    grupos_resultantes: list[dict] = []
    times_canonicos_vistos: set[int] = set()
    for grupo in _sanitize_grupos(estado.proximos_times):
        grupo_id = str(grupo["grupo_id"])
        if not grupo_id.startswith("time:"):
            grupos_resultantes.append(grupo)
            continue
        try:
            time_id = int(grupo_id.split(":", 1)[1])
        except ValueError:
            grupos_resultantes.append(grupo)
            continue
        if time_id in selecionados or time_id in times_canonicos_vistos:
            continue
        time_valido = db.query(TimeEventoModel.id).filter(
            TimeEventoModel.id == time_id,
            TimeEventoModel.evento_id == evento.id,
        ).first()
        if not time_valido:
            continue
        grupos_resultantes.append({"grupo_id": f"time:{time_id}", "jogadores_ids": jogadores_por_time.get(time_id, grupo["jogadores_ids"])})
        times_canonicos_vistos.add(time_id)

    for time_id in (partida_origem.time_a_id, partida_origem.time_b_id):
        if time_id in selecionados or time_id in times_canonicos_vistos:
            continue
        grupos_resultantes.append(
            {"grupo_id": f"time:{time_id}", "jogadores_ids": jogadores_por_time.get(time_id, [])}
        )
        times_canonicos_vistos.add(time_id)

    jogadores_selecionados = {
        jogador_id
        for time_id in selecionados
        for jogador_id in jogadores_por_time.get(time_id, [])
    }
    jogadores_reenfileirados = [
        jogador_id
        for time_id in (partida_origem.time_a_id, partida_origem.time_b_id)
        if time_id not in selecionados
        for jogador_id in jogadores_por_time.get(time_id, [])
    ]
    fila_resultante = [
        int(jogador_id)
        for jogador_id in (estado.fila_jogadores_ids or [])
        if int(jogador_id) not in jogadores_selecionados
        and int(jogador_id) not in set(jogadores_reenfileirados)
    ]
    fila_resultante.extend(jogadores_reenfileirados)

    ultima_ordem = db.query(func.max(PartidaModel.ordem)).filter(PartidaModel.evento_id == evento.id).scalar()
    nova_partida = PartidaModel(
        evento_id=evento.id,
        ordem=int(ultima_ordem or 0) + 1,
        status=PartidaStatusEnum.EM_ANDAMENTO,
        inicio_at=datetime.now(timezone.utc),
        time_a_id=payload.time_a_id,
        time_b_id=payload.time_b_id,
        client_command_id=payload.client_command_id,
        client_command_payload_hash=payload_hash,
        partida_origem_id=partida_origem.id,
    )
    estado.fila_jogadores_ids = fila_resultante
    estado.proximos_times = grupos_resultantes
    estado.version = int(estado.version) + 1
    estado.updated_by_user_id = user.user_id
    fila_out = _rotacao_estado_out(
        evento_id=evento.id,
        team_size_ref=int(estado.team_size_ref),
        duracao_partida_segundos=int(estado.duracao_partida_segundos),
        fila_ids=fila_resultante,
        grupos=grupos_resultantes,
        em_campo_count=len(jogadores_selecionados),
        version=int(estado.version),
        updated_at=estado.updated_at,
        updated_by_user_id=user.user_id,
    ).proximos_times
    nova_partida.command_rotation_version = int(estado.version)
    nova_partida.command_result_queue = [item.model_dump() for item in fila_out]
    db.add(nova_partida)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail={"code": "active_match_conflict", "message": "Outra partida foi iniciada."},
        ) from exc
    db.refresh(nova_partida)
    return _partida_proxima_out(nova_partida)


def update_rotacao_estado_flow(
    db: Session,
    evento_id: int,
    payload: RotacaoEstadoUpdateIn,
    user: AuthUser,
) -> RotacaoEstadoOut:
    require_roles(user, "admin", "treinador", "auxiliar")
    evento = get_evento_or_404(db, evento_id)
    _assert_evento_tipo_com_rotacao(evento)
    _expire_previews_if_needed(db, evento.id)
    _lock_evento_for_command(db, evento.id)

    estado = _get_or_init_rotacao_estado(db, evento, for_update=True)
    if payload.expected_version is not None and payload.expected_version != int(estado.version):
        raise _version_conflict("rotacao", payload.expected_version, int(estado.version))
    partida_ativa = _buscar_partida_em_andamento(db, evento.id)
    presentes_ids = _listar_jogadores_presentes_ids(db, evento)
    em_campo_ids = _listar_jogadores_em_campo_ids(db, evento.id, partida_ativa)
    elegiveis_set = {jid for jid in presentes_ids if jid not in em_campo_ids}

    changed = False
    if payload.team_size_ref is not None and payload.team_size_ref != estado.team_size_ref:
        estado.team_size_ref = int(payload.team_size_ref)
        changed = True
    if (
        payload.duracao_partida_segundos is not None
        and payload.duracao_partida_segundos != estado.duracao_partida_segundos
    ):
        estado.duracao_partida_segundos = int(payload.duracao_partida_segundos)
        changed = True

    if payload.fila_jogadores_ids is not None:
        fila_atual = [int(v) for v in (estado.fila_jogadores_ids or [])]
        fila_normalizada: list[int] = []
        fila_seen: set[int] = set()
        for jogador_id in payload.fila_jogadores_ids:
            jid = int(jogador_id)
            if jid not in elegiveis_set or jid in fila_seen:
                continue
            fila_normalizada.append(jid)
            fila_seen.add(jid)
        if fila_normalizada != fila_atual:
            estado.fila_jogadores_ids = fila_normalizada
            changed = True

    if payload.proximos_times is not None:
        grupos_atual = _sanitize_grupos(estado.proximos_times)
        grupos_normalizados: list[dict] = []
        usados: set[int] = set()
        for idx, grupo in enumerate(payload.proximos_times, start=1):
            grupo_id = str(grupo.grupo_id or f"grupo-{idx}")
            ids_validos: list[int] = []
            for jogador_id in grupo.jogadores_ids:
                jid = int(jogador_id)
                if jid not in elegiveis_set or jid in usados:
                    continue
                ids_validos.append(jid)
                usados.add(jid)
            grupos_normalizados.append(
                {
                    "grupo_id": grupo_id,
                    "jogadores_ids": ids_validos,
                }
            )
        if grupos_normalizados != grupos_atual:
            estado.proximos_times = grupos_normalizados
            changed = True

    if changed:
        estado.version = int(estado.version) + 1
        estado.updated_by_user_id = user.user_id

    _reconcile_rotacao_com_estado_jogo(estado, presentes_ids, em_campo_ids)
    db.commit()
    db.refresh(estado)
    return _rotacao_estado_out(
        evento_id=evento.id,
        team_size_ref=int(estado.team_size_ref),
        duracao_partida_segundos=int(estado.duracao_partida_segundos),
        fila_ids=[int(v) for v in (estado.fila_jogadores_ids or [])],
        grupos=_sanitize_grupos(estado.proximos_times),
        em_campo_count=len(em_campo_ids),
        version=int(estado.version),
        updated_at=estado.updated_at,
        updated_by_user_id=estado.updated_by_user_id,
    )


def preview_rotacao_sorteio_flow(
    db: Session,
    evento_id: int,
    payload: RotacaoPreviewIn,
    user: AuthUser,
) -> RotacaoPreviewOut:
    require_roles(user, "admin", "treinador", "auxiliar")
    evento = get_evento_or_404(db, evento_id)
    _assert_evento_tipo_com_rotacao(evento)
    _expire_previews_if_needed(db, evento.id)

    estado = _get_or_init_rotacao_estado(db, evento)
    partida_ativa = _buscar_partida_em_andamento(db, evento.id)
    presentes_ids = _listar_jogadores_presentes_ids(db, evento)
    em_campo_ids = _listar_jogadores_em_campo_ids(db, evento.id, partida_ativa)
    _reconcile_rotacao_com_estado_jogo(estado, presentes_ids, em_campo_ids)
    grupos = _sanitize_grupos(estado.proximos_times)
    grupo = next((g for g in grupos if g.get("grupo_id") == payload.grupo_alvo_id), None)
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo alvo nao encontrado")

    team_size_ref = max(1, int(estado.team_size_ref))
    grupo_ids = [int(v) for v in (grupo.get("jogadores_ids") or [])]
    faltam = max(team_size_ref - len(grupo_ids), 0)
    if faltam == 0:
        raise HTTPException(status_code=409, detail="Grupo alvo ja esta completo")

    fila_ids = [int(v) for v in (estado.fila_jogadores_ids or [])]
    candidatos_ids = [jid for jid in fila_ids if jid not in grupo_ids]
    if len(candidatos_ids) < faltam:
        raise HTTPException(status_code=409, detail="Jogadores na fila insuficientes para completar grupo")

    rng = random.SystemRandom()
    sorteados_ids = rng.sample(candidatos_ids, faltam)
    nao_sorteados_ids = [jid for jid in candidatos_ids if jid not in set(sorteados_ids)]

    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    record = EventoRotacaoSorteioModel(
        token=token,
        evento_id=evento.id,
        partida_origem_id=payload.partida_origem_id,
        grupo_alvo_id=payload.grupo_alvo_id,
        needed_count=faltam,
        candidatos_ids=candidatos_ids,
        sorteados_ids=sorteados_ids,
        nao_sorteados_ids=nao_sorteados_ids,
        status=RotacaoSorteioStatusEnum.PREVIEWED,
        created_by_user_id=user.user_id,
        expires_at=expires_at,
    )
    db.add(record)
    db.commit()
    return RotacaoPreviewOut(
        token=token,
        evento_id=evento.id,
        grupo_alvo_id=payload.grupo_alvo_id,
        needed_count=faltam,
        candidatos_ids=candidatos_ids,
        sorteados_ids=sorteados_ids,
        nao_sorteados_ids=nao_sorteados_ids,
        expires_at=expires_at,
    )


def confirm_rotacao_sorteio_flow(
    db: Session,
    evento_id: int,
    token: str,
    user: AuthUser,
) -> RotacaoConfirmOut:
    require_roles(user, "admin", "treinador", "auxiliar")
    evento = get_evento_or_404(db, evento_id)
    _assert_evento_tipo_com_rotacao(evento)
    _expire_previews_if_needed(db, evento.id)
    _lock_evento_for_command(db, evento.id)

    record = (
        db.query(EventoRotacaoSorteioModel)
        .filter(
            EventoRotacaoSorteioModel.evento_id == evento.id,
            EventoRotacaoSorteioModel.token == token,
        )
        .with_for_update()
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Preview de sorteio nao encontrado")
    if record.status != RotacaoSorteioStatusEnum.PREVIEWED:
        raise HTTPException(status_code=409, detail="Preview nao esta disponivel para confirmacao")
    if _to_utc(record.expires_at) < datetime.now(timezone.utc):
        record.status = RotacaoSorteioStatusEnum.EXPIRED
        db.commit()
        raise HTTPException(status_code=409, detail="Preview expirado")

    estado = _get_or_init_rotacao_estado(db, evento, for_update=True)
    partida_ativa = _buscar_partida_em_andamento(db, evento.id)
    presentes_ids = _listar_jogadores_presentes_ids(db, evento)
    em_campo_ids = _listar_jogadores_em_campo_ids(db, evento.id, partida_ativa)
    _reconcile_rotacao_com_estado_jogo(estado, presentes_ids, em_campo_ids)
    grupos = _sanitize_grupos(estado.proximos_times)
    grupo = next((g for g in grupos if g.get("grupo_id") == record.grupo_alvo_id), None)
    if not grupo:
        raise HTTPException(status_code=409, detail="Grupo alvo nao existe mais")

    fila_ids = [int(v) for v in (estado.fila_jogadores_ids or [])]
    sorteados_ids = [int(v) for v in (record.sorteados_ids or [])]
    fila_set = set(fila_ids)
    if not all(jid in fila_set for jid in sorteados_ids):
        raise HTTPException(status_code=409, detail="Fila mudou desde o preview; gere um novo sorteio")

    grupo_ids = [int(v) for v in (grupo.get("jogadores_ids") or [])]
    grupo["jogadores_ids"] = grupo_ids + [jid for jid in sorteados_ids if jid not in set(grupo_ids)]
    estado.fila_jogadores_ids = [jid for jid in fila_ids if jid not in set(sorteados_ids)]
    estado.proximos_times = grupos
    estado.version = int(estado.version) + 1
    estado.updated_by_user_id = user.user_id

    record.status = RotacaoSorteioStatusEnum.CONFIRMED
    record.confirmed_at = datetime.now(timezone.utc)

    partida_ativa = _buscar_partida_em_andamento(db, evento.id)
    em_campo_ids = _listar_jogadores_em_campo_ids(db, evento.id, partida_ativa)
    db.commit()
    db.refresh(estado)
    db.refresh(record)

    estado_out = _rotacao_estado_out(
        evento_id=evento.id,
        team_size_ref=int(estado.team_size_ref),
        duracao_partida_segundos=int(estado.duracao_partida_segundos),
        fila_ids=[int(v) for v in (estado.fila_jogadores_ids or [])],
        grupos=_sanitize_grupos(estado.proximos_times),
        em_campo_count=len(em_campo_ids),
        version=int(estado.version),
        updated_at=estado.updated_at,
        updated_by_user_id=estado.updated_by_user_id,
    )
    return RotacaoConfirmOut(estado=estado_out, audit=_rotacao_audit_out(record))
