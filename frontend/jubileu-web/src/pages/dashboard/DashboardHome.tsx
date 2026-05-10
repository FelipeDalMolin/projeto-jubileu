import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import InfoCard from "../../components/dashboard/cards/InfoCard";
import SectionHeader from "../../components/dashboard/common/SectionHeader";
import { obterVisaoGeralEstatisticas, type VisaoGeralEstatisticas } from "../../services/dashboard/estatisticasDashboardService";
import { obterResumoJogadores, type ResumoJogadores } from "../../services/dashboard/jogadoresDashboardService";
import { obterResumoPartidas, obterSeriePorDia, type ResumoPartidas, type SeriePorDia } from "../../services/dashboard/partidasDashboardService";

type DashboardState = {
  jogadores: ResumoJogadores | null;
  partidas: ResumoPartidas | null;
  serie: SeriePorDia | null;
  estatisticas: VisaoGeralEstatisticas | null;
};

export default function DashboardHome() {
  const [data, setData] = useState<DashboardState>({
    jogadores: null,
    partidas: null,
    serie: null,
    estatisticas: null,
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    async function load() {
      setLoading(true);
      setErro(null);
      try {
        const [jogadores, partidas, serie, estatisticas] = await Promise.all([
          obterResumoJogadores({ force: true }),
          obterResumoPartidas({ force: true }),
          obterSeriePorDia({ periodo: 30 }, { force: true }),
          obterVisaoGeralEstatisticas({ periodo: 30 }, { force: true }),
        ]);
        if (!canceled) setData({ jogadores, partidas, serie, estatisticas });
      } catch (err) {
        if (!canceled) setErro(err instanceof Error ? err.message : "Erro ao carregar dashboard");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void load();
    return () => {
      canceled = true;
    };
  }, []);

  const ultimosDias = useMemo(() => data.serie?.items.slice(-5).reverse() ?? [], [data.serie]);
  const topArtilheiros = data.estatisticas?.topArtilheiros.slice(0, 5) ?? [];

  return (
    <div className="container py-4">
      <SectionHeader
        title="Dashboard"
        subtitle={loading ? "Carregando indicadores operacionais" : "Resumo operacional dos dados atuais"}
        action={
          <Link className="btn btn-outline-primary btn-sm" to="/dashboard/estatisticas">
            Ver estatisticas
          </Link>
        }
      />

      {erro ? <div className="alert alert-warning py-2">{erro}</div> : null}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <InfoCard
            title="Jogadores"
            value={`${data.jogadores?.totalJogadores ?? 0}`}
            subtitle={`${data.jogadores?.mediaPresenca ?? 0}% media de presenca`}
            icon={<span aria-hidden>J</span>}
            to="/dashboard/jogadores"
          />
        </div>
        <div className="col-12 col-md-4">
          <InfoCard
            title="Partidas"
            value={`${data.partidas?.totalPartidas ?? 0}`}
            subtitle={`${data.partidas?.mediaGolsPorPartida ?? 0} gols por partida`}
            icon={<span aria-hidden>P</span>}
            to="/dashboard/partidas"
          />
        </div>
        <div className="col-12 col-md-4">
          <InfoCard
            title="Gols"
            value={`${data.partidas?.totalGols ?? data.jogadores?.totalGols ?? 0}`}
            subtitle="Total consolidado nos eventos"
            icon={<span aria-hidden>G</span>}
            to="/dashboard/estatisticas"
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Atividade recente</h5>
              <p className="text-muted small mb-3">Partidas e gols por dia nos ultimos registros.</p>
              {ultimosDias.length === 0 ? (
                <p className="text-muted mb-0">Sem partidas registradas no periodo.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {ultimosDias.map((item) => (
                    <li key={item.data} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{item.data}</strong>
                        <div className="small text-muted">{item.partidas} partida(s)</div>
                      </div>
                      <span className="badge bg-primary rounded-pill">{item.gols} gols</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Top artilheiros</h5>
              <p className="text-muted small mb-3">Ranking vindo do backend.</p>
              {topArtilheiros.length === 0 ? (
                <p className="text-muted mb-0">Sem gols registrados ainda.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {topArtilheiros.map((item) => (
                    <div key={`${item.jogadorId ?? "sem-id"}-${item.nome}`} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">{item.nome}</div>
                        <small className="text-muted">Jogador #{item.jogadorId ?? "-"}</small>
                      </div>
                      <span className="fw-bold">{item.valor}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
