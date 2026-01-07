from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db
from app.schemas.dashboards.jogadores import JogadoresResumoOut, JogadoresRankingOut
from app.services.dashboards import jogadores_service


router = APIRouter(prefix="/dashboards/jogadores", tags=["Dashboards - Jogadores"])


def _parse_periodo(periodo: int | None) -> int:
    allowed = {30, 90, 365}
    if periodo is None:
        return 30
    if periodo not in allowed:
        raise HTTPException(status_code=400, detail="periodo deve ser 30, 90 ou 365")
    return periodo


@router.get("/resumo", response_model=JogadoresResumoOut)
def obter_resumo_jogadores(db: Session = Depends(get_db)) -> JogadoresResumoOut:
    return jogadores_service.get_resumo(db)


@router.get("/ranking", response_model=JogadoresRankingOut)
def ranking_jogadores(
    periodo: int | None = None,
    turma: int | None = None,
    db: Session = Depends(get_db),
) -> JogadoresRankingOut:
    periodo_validado = _parse_periodo(periodo)
    return jogadores_service.ranking(db, periodo=periodo_validado, turma_id=turma)
