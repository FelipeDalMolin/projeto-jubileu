import { useMemo } from "react";
import { Link } from "react-router-dom";
import InfoCard from "../../components/dashboard/cards/InfoCard";
import SectionHeader from "../../components/dashboard/common/SectionHeader";
import { jogadoresMock } from "../../mocks/dashboard/jogadoresMock";
import { partidasMock } from "../../mocks/dashboard/partidasMock";
import { estatisticasMock } from "../../mocks/dashboard/estatisticasMock";

export default function DashboardHome() {
  const resumo = useMemo(() => {
    const gols = jogadoresMock.reduce((acc, j) => acc + j.gols, 0);
    const assist = jogadoresMock.reduce((acc, j) => acc + j.assistencias, 0);
    const recentes = partidasMock.slice(0, 3);
    const topMetricas = estatisticasMock.slice(0, 3);

    return {
      jogadores: jogadoresMock.length,
      gols,
      assist,
      partidas: partidasMock.length,
      recentes,
      topMetricas,
    };
  }, []);

  return (
    <div className="container py-4">
      <SectionHeader
        title="Dashboards"
        subtitle="Resumo rápido"
        action={
          <Link className="btn btn-outline-primary btn-sm" to="/dashboard/estatisticas">
            Ver estatísticas detalhadas
          </Link>
        }
      />

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <InfoCard
            title="Jogadores"
            value={`${resumo.jogadores}`}
            subtitle={`${resumo.assist} assistências totais`}
            icon={<span aria-hidden>👟</span>}
            to="/dashboard/jogadores"
          />
        </div>
        <div className="col-12 col-md-4">
          <InfoCard
            title="Partidas"
            value={`${resumo.partidas}`}
            subtitle="Resultados recentes e destaques"
            icon={<span aria-hidden>⚽</span>}
            to="/dashboard/partidas"
          />
        </div>
        <div className="col-12 col-md-4">
          <InfoCard
            title="Estatísticas"
            value={`${resumo.gols} gols`}
            subtitle="Métricas agregadas por turma"
            icon={<span aria-hidden>📊</span>}
            to="/dashboard/estatisticas"
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Partidas recentes</h5>
              <p className="text-muted small mb-3">Visão rápida dos últimos resultados.</p>
              <ul className="list-group list-group-flush">
                {resumo.recentes.map((p) => (
                  <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{p.turma}</strong>
                      <div className="small text-muted">
                        {p.dataIso} · vs {p.adversario}
                      </div>
                    </div>
                    <span className="badge bg-primary rounded-pill">
                      {p.golsPro} x {p.golsContra}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Highlights de estatísticas</h5>
              <p className="text-muted small mb-3">Indicadores rápidos por turma.</p>
              <div className="d-flex flex-column gap-3">
                {resumo.topMetricas.map((m) => (
                  <div key={m.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{m.categoria}</div>
                      <small className="text-muted">{m.turma}</small>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold me-2">{m.valor}</span>
                      <span className={m.variacao >= 0 ? "text-success" : "text-danger"}>
                        {m.variacao >= 0 ? "+" : ""}
                        {m.variacao}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
