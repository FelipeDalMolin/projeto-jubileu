from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.deps import get_db
from app.deps_auth import AuthUser, get_current_user
from app.modules.eventos import service as eventos_service
from app.schemas.eventos import (
    EventoActionOut,
    EventoParticipanteOut,
    EventoParticipantesListOut,
    LanceListOut,
    LanceCreateIn,
    LanceCreateOut,
    ProximaPartidaIn,
    ProximaPartidaOut,
    RotacaoConfirmIn,
    RotacaoConfirmOut,
    RotacaoEstadoOut,
    RotacaoEstadoUpdateIn,
    RotacaoPreviewIn,
    RotacaoPreviewOut,
    SeedPartidaIn,
    SeedPartidaOut,
)

router = APIRouter(prefix="/api", tags=["Eventos"])


@router.post("/eventos/{evento_id}/rsvp", response_model=dict[str, EventoParticipanteOut])
def rsvp_self(
    evento_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> dict[str, EventoParticipanteOut]:
    return eventos_service.rsvp_self_flow(db, evento_id, user)


@router.post("/eventos/{evento_id}/checkin", response_model=dict[str, EventoParticipanteOut])
def checkin_self(
    evento_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> dict[str, EventoParticipanteOut]:
    return eventos_service.checkin_self_flow(db, evento_id, user)


@router.delete("/eventos/{evento_id}/rsvp", response_model=dict[str, EventoParticipanteOut])
def cancel_rsvp_self(
    evento_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> dict[str, EventoParticipanteOut]:
    return eventos_service.rsvp_self_cancel_flow(db, evento_id, user)


@router.delete("/eventos/{evento_id}/checkin", response_model=dict[str, EventoParticipanteOut])
def cancel_checkin_self(
    evento_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> dict[str, EventoParticipanteOut]:
    return eventos_service.checkin_self_cancel_flow(db, evento_id, user)


@router.post(
    "/eventos/{evento_id}/participants/{jogador_id}/checkin",
    response_model=dict[str, EventoParticipanteOut],
)
def checkin_manual(
    evento_id: int,
    jogador_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> dict[str, EventoParticipanteOut]:
    return eventos_service.checkin_manual_flow(db, evento_id, jogador_id, user)


@router.post("/eventos/{evento_id}/start", response_model=EventoActionOut)
def start_evento(
    evento_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> EventoActionOut:
    return eventos_service.start_evento_flow(db, evento_id, user)


@router.post("/eventos/{evento_id}/end", response_model=EventoActionOut)
def end_evento(
    evento_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> EventoActionOut:
    return eventos_service.end_evento_flow(db, evento_id, user)


@router.post("/eventos/{evento_id}/cancel", response_model=EventoActionOut)
def cancel_evento(
    evento_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> EventoActionOut:
    return eventos_service.cancel_evento_flow(db, evento_id, user)


@router.post("/eventos/{evento_id}/partidas/seed", response_model=SeedPartidaOut)
def seed_primeira_partida(
    evento_id: int,
    payload: SeedPartidaIn,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> SeedPartidaOut:
    return eventos_service.seed_primeira_partida_flow(db, evento_id, payload, user)


@router.post("/eventos/{evento_id}/partidas/proxima", response_model=ProximaPartidaOut)
def criar_proxima_partida(
    evento_id: int,
    payload: ProximaPartidaIn,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> ProximaPartidaOut:
    return eventos_service.criar_proxima_partida_flow(db, evento_id, payload, user)


@router.post("/dias/{data_iso}/eventos/{evento_id}/partidas/proxima", response_model=ProximaPartidaOut)
def criar_proxima_partida_contextual(
    data_iso: str,
    evento_id: int,
    payload: ProximaPartidaIn,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> ProximaPartidaOut:
    return eventos_service.criar_proxima_partida_flow(db, evento_id, payload, user, data_iso=data_iso)


@router.get("/eventos/{evento_id}/participants", response_model=EventoParticipantesListOut)
def list_participants(
    evento_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> EventoParticipantesListOut:
    _ = user
    return eventos_service.list_participants_flow(db, evento_id)


@router.get("/eventos/{evento_id}/presentes", response_model=EventoParticipantesListOut)
def list_presentes(
    evento_id: int,
    order: Literal["arrival", "id"] = "arrival",
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> EventoParticipantesListOut:
    _ = user
    return eventos_service.list_presentes_flow(db, evento_id, order)


@router.post("/partidas/{partida_id}/lances", response_model=LanceCreateOut)
def create_lance(
    partida_id: int,
    payload: LanceCreateIn,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> LanceCreateOut:
    return eventos_service.create_lance_flow(db, partida_id, payload, user)


@router.get("/eventos/{evento_id}/lances", response_model=LanceListOut)
def list_lances(
    evento_id: int,
    partida_id: int | None = Query(default=None, ge=1),
    since: str | None = None,
    limit: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> LanceListOut:
    _ = user
    from datetime import datetime, timezone

    try:
        since_dt = datetime.fromisoformat(since.replace("Z", "+00:00")) if since else None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Parametro 'since' invalido") from exc
    if since_dt is not None and since_dt.tzinfo is None:
        since_dt = since_dt.replace(tzinfo=timezone.utc)
    return eventos_service.list_lances_flow(db, evento_id, partida_id, since_dt, limit)


@router.get("/eventos/{evento_id}/rotacao/estado", response_model=RotacaoEstadoOut)
def get_rotacao_estado(
    evento_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> RotacaoEstadoOut:
    return eventos_service.get_rotacao_estado_flow(db, evento_id, user)


@router.patch("/eventos/{evento_id}/rotacao/estado", response_model=RotacaoEstadoOut)
def update_rotacao_estado(
    evento_id: int,
    payload: RotacaoEstadoUpdateIn,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> RotacaoEstadoOut:
    return eventos_service.update_rotacao_estado_flow(db, evento_id, payload, user)


@router.post("/eventos/{evento_id}/rotacao/preview-sorteio", response_model=RotacaoPreviewOut)
def preview_rotacao_sorteio(
    evento_id: int,
    payload: RotacaoPreviewIn,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> RotacaoPreviewOut:
    return eventos_service.preview_rotacao_sorteio_flow(db, evento_id, payload, user)


@router.post("/eventos/{evento_id}/rotacao/confirmar-sorteio", response_model=RotacaoConfirmOut)
def confirmar_rotacao_sorteio(
    evento_id: int,
    payload: RotacaoConfirmIn,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> RotacaoConfirmOut:
    return eventos_service.confirm_rotacao_sorteio_flow(db, evento_id, payload.token, user)
