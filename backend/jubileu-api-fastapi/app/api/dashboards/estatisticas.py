from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db
from app.schemas.dashboards.estatisticas import EstatisticasVisaoGeralOut
from app.services.dashboards import estatisticas_service


router = APIRouter(prefix="/dashboards/estatisticas", tags=["Dashboards - Estatisticas"])


def _parse_periodo(periodo: int | None) -> int:
    allowed = {30, 90, 365}
    if periodo is None:
        return 30
    if periodo not in allowed:
        raise HTTPException(status_code=400, detail="periodo deve ser 30, 90 ou 365")
    return periodo


@router.get("/visao-geral", response_model=EstatisticasVisaoGeralOut)
def visao_geral(
    periodo: int | None = None,
    db: Session = Depends(get_db),
) -> EstatisticasVisaoGeralOut:
    periodo_validado = _parse_periodo(periodo)
    return estatisticas_service.visao_geral(db, periodo=periodo_validado)
