from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.deps import get_db
from app.modules.auth.deps import get_operator_user
from app.modules.dias import service as dias_service
from app.modules.partidas import service as partidas_service
from app.schemas.dia_evento import (
    CommandOkOut,
    PartidaCreate,
    PartidaOut,
    PartidaUpdate,
    StatsJogadorIn,
)

router = APIRouter(prefix="/dias", tags=["Partidas"])


@router.get("/{data_iso}/eventos/{evento_id}/partidas", response_model=List[PartidaOut])
def listar_partidas(
    data_iso: str,
    evento_id: int,
    db: Session = Depends(get_db),
) -> List[PartidaOut]:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    return partidas_service.listar_partidas_flow(db, evento)


@router.post(
    "/{data_iso}/eventos/{evento_id}/partidas",
    response_model=PartidaOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_operator_user)],
)
def criar_partida(
    data_iso: str,
    evento_id: int,
    payload: PartidaCreate,
    db: Session = Depends(get_db),
) -> PartidaOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    return partidas_service.criar_partida_flow(db, evento, payload)


@router.put(
    "/{data_iso}/eventos/{evento_id}/partidas/{partida_id}",
    response_model=PartidaOut,
    dependencies=[Depends(get_operator_user)],
)
def atualizar_partida(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    payload: PartidaUpdate,
    db: Session = Depends(get_db),
) -> PartidaOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    return partidas_service.atualizar_partida_flow(db, evento, partida_id, payload)


@router.put(
    "/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/jogadores/{jogador_evento_id}/stats",
    response_model=CommandOkOut,
    dependencies=[Depends(get_operator_user)],
)
def atualizar_stats_jogador_partida(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    jogador_evento_id: int,
    payload: StatsJogadorIn,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    return partidas_service.atualizar_stats_jogador_flow(
        db,
        evento,
        partida_id,
        jogador_evento_id,
        payload,
    )


@router.delete(
    "/{data_iso}/eventos/{evento_id}/partidas/{partida_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_operator_user)],
)
def deletar_partida(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> Response:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    partidas_service.deletar_partida_flow(db, evento, partida_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start",
    response_model=CommandOkOut,
    dependencies=[Depends(get_operator_user)],
)
def iniciar_partida(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    return partidas_service.iniciar_partida_flow(db, evento, partida_id)


@router.post(
    "/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end",
    response_model=CommandOkOut,
    dependencies=[Depends(get_operator_user)],
)
def encerrar_partida(
    data_iso: str,
    evento_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> CommandOkOut:
    evento = dias_service.get_evento_no_dia_or_404(db, data_iso, evento_id)
    return partidas_service.encerrar_partida_flow(db, evento, partida_id)
