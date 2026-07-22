from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.deps import get_db
from app.modules.auth.deps import AuthUser, get_current_user, get_operator_user
from app.modules.auth.service import get_usuario_by_user_id
from app.models.dia_evento import (
    Dia as DiaModel,
    Evento as EventoModel,
    EventoParticipante as EventoParticipanteModel,
    JogadorEvento as JogadorEventoModel,
)
from app.models.jogador_turma import Jogador as JogadorModel
from app.schemas.usuarios import (
    UsuarioEventoParticipadoOut,
    UsuarioJogadorOut,
    UsuarioJogadorUpdateIn,
    UsuarioMeOut,
    UsuarioPerfilOut,
)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


def _build_usuario_me(
    db: Session,
    usuario,
) -> UsuarioMeOut:
    jogador = None
    eventos: list[UsuarioEventoParticipadoOut] = []
    if usuario.jogador_id is not None:
        jogador_model = db.query(JogadorModel).filter(JogadorModel.id == usuario.jogador_id).first()
        jogador = UsuarioJogadorOut.model_validate(jogador_model) if jogador_model else None

        participante_rows = (
            db.query(EventoParticipanteModel)
            .filter(EventoParticipanteModel.jogador_id == usuario.jogador_id)
            .all()
        )
        participante_por_evento = {row.evento_id: row for row in participante_rows}

        evento_ids = set(participante_por_evento)
        snapshot_ids = (
            db.query(JogadorEventoModel.evento_id)
            .filter(JogadorEventoModel.jogador_id == usuario.jogador_id)
            .all()
        )
        evento_ids.update(int(row.evento_id) for row in snapshot_ids)

        if evento_ids:
            rows = (
                db.query(EventoModel, DiaModel.data_iso)
                .join(DiaModel, EventoModel.dia_id == DiaModel.id)
                .filter(EventoModel.id.in_(evento_ids))
                .order_by(DiaModel.data_iso.desc(), EventoModel.horario_inicio.desc(), EventoModel.id.desc())
                .all()
            )
            eventos = [
                UsuarioEventoParticipadoOut(
                    evento_id=evento.id,
                    data_iso=data_iso,
                    tipo=evento.tipo,
                    status=evento.status,
                    horario_inicio=evento.horario_inicio,
                    horario_fim=evento.horario_fim,
                    turma_id=evento.turma_id,
                    turma_nome=evento.turma_nome,
                    participante_status=(
                        participante_por_evento[evento.id].status
                        if evento.id in participante_por_evento
                        else None
                    ),
                )
                for evento, data_iso in rows
            ]

    return UsuarioMeOut(
        usuario=UsuarioPerfilOut(
            user_id=usuario.user_id,
            username=usuario.username,
            display_name=usuario.display_name,
            email=usuario.email,
            role=usuario.role,
            jogador_id=usuario.jogador_id,
        ),
        jogador=jogador,
        eventos=eventos,
    )


@router.get("/me", response_model=UsuarioMeOut)
def obter_usuario_me(
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> UsuarioMeOut:
    usuario = get_usuario_by_user_id(db, user.user_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")

    return _build_usuario_me(db, usuario)


@router.put(
    "/me/jogador",
    response_model=UsuarioMeOut,
    dependencies=[Depends(get_operator_user)],
)
def atualizar_usuario_jogador(
    payload: UsuarioJogadorUpdateIn,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> UsuarioMeOut:
    usuario = get_usuario_by_user_id(db, user.user_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")

    if payload.jogador_id is not None:
        jogador = db.query(JogadorModel).filter(JogadorModel.id == payload.jogador_id).first()
        if not jogador:
            raise HTTPException(status_code=404, detail="Jogador nao encontrado")

    usuario.jogador_id = payload.jogador_id
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail={
                "code": "jogador_already_linked",
                "message": "Jogador ja esta vinculado a outro usuario.",
            },
        ) from exc
    db.refresh(usuario)

    return _build_usuario_me(db, usuario)
