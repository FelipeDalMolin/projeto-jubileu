from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db
from app.deps_auth import AuthUser, get_current_user
from app.modules.eventos import service as eventos_service
from app.schemas.eventos import (
    EventoActionOut,
    EventoParticipanteOut,
    EventoParticipantesListOut,
    LanceCreateIn,
    LanceCreateOut,
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
    order: str = "arrival",
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
