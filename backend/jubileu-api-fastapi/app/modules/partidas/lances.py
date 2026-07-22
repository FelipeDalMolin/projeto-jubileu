"""Registro idempotente e consulta de lances de Partida."""

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.deps_auth import AuthUser
from app.models.dia_evento import (
    JogadorEvento as JogadorEventoModel,
    Lance as LanceModel,
    Partida as PartidaModel,
    PartidaStatusEnum,
    StatusEventoEnum,
    TimeEvento as TimeEventoModel,
)
from app.modules.eventos.core import get_evento_or_404, lock_evento_for_command
from app.schemas.eventos import LanceCreateIn, LanceCreateOut, LanceListOut, LanceOut


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


def _resolve_jogador_global_id(
    db: Session,
    partida: PartidaModel,
    raw_id: int | None,
) -> int | None:
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


def create_lance_flow(
    db: Session,
    partida_id: int,
    payload: LanceCreateIn,
    user: AuthUser,
) -> LanceCreateOut:
    partida_ref = db.query(PartidaModel.evento_id).filter(PartidaModel.id == partida_id).first()
    if not partida_ref:
        raise HTTPException(status_code=404, detail="Partida nao encontrada")

    lock_evento_for_command(db, int(partida_ref.evento_id))
    partida = (
        db.query(PartidaModel)
        .options(selectinload(PartidaModel.evento))
        .filter(PartidaModel.id == partida_id)
        .with_for_update()
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

    jogador_id_resolvido = _resolve_jogador_global_id(db, partida, payload.jogador_id)
    payload_normalizado = dict(payload.payload or {})
    raw_jogador_secundario = payload_normalizado.get("jogador_secundario_id")
    if raw_jogador_secundario is not None:
        try:
            payload_normalizado["jogador_secundario_id"] = _resolve_jogador_global_id(
                db,
                partida,
                int(raw_jogador_secundario),
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
    try:
        with db.begin_nested():
            db.add(lance)
            db.flush()
    except IntegrityError as exc:
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
                db.commit()
                return LanceCreateOut(lance=lance_out(db, existing))
        raise HTTPException(status_code=422, detail="Lance invalido para o estado atual dos dados") from exc

    db.commit()
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

    query = db.query(LanceModel).filter(
        LanceModel.evento_id == evento_id,
        LanceModel.is_deleted.is_(False),
    )
    if partida_id is not None:
        query = query.filter(LanceModel.partida_id == partida_id)
    if since is not None:
        query = query.filter(LanceModel.created_at > since)

    items = query.order_by(LanceModel.created_at.asc(), LanceModel.id.asc()).limit(cap_limit).all()
    return LanceListOut(items=[lance_out(db, lance) for lance in items])
