from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db
from app.schemas.dashboards.partidas import PartidasListaOut, PartidasResumoOut, SeriePorDiaOut
from app.services.dashboards import partidas_service


router = APIRouter(prefix="/dashboards/partidas", tags=["Dashboards - Partidas"])


def _parse_periodo(periodo: int | None) -> int:
    allowed = {30, 90, 365}
    if periodo is None:
        return 30
    if periodo not in allowed:
        raise HTTPException(status_code=400, detail="periodo deve ser 30, 90 ou 365")
    return periodo


@router.get("/resumo", response_model=PartidasResumoOut)
def obter_resumo_partidas(db: Session = Depends(get_db)) -> PartidasResumoOut:
    return partidas_service.get_resumo(db)


@router.get("/serie-por-dia", response_model=SeriePorDiaOut)
def serie_por_dia(
    periodo: int | None = None,
    turma: int | None = None,
    db: Session = Depends(get_db),
) -> SeriePorDiaOut:
    periodo_validado = _parse_periodo(periodo)
    return partidas_service.serie_por_dia(db, periodo=periodo_validado, turma_id=turma)


@router.get("/lista", response_model=PartidasListaOut)
def listar_partidas(
    periodo: int | None = None,
    turma: int | None = None,
    db: Session = Depends(get_db),
) -> PartidasListaOut:
    periodo_validado = _parse_periodo(periodo)
    return partidas_service.listar(db, periodo=periodo_validado, turma_id=turma)
