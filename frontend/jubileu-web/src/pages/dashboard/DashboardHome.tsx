import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

type KpiItem = {
  label: string;
  value: string;
  subtitle: string;
  icon: string;
  to: string;
};

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

function formatPercent(value: number | null | undefined) {
  return `${formatNumber(value ?? 0)}%`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-5 h-8 w-20 rounded bg-slate-200" />
            <div className="mt-5 h-3 w-36 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="mt-6 space-y-4">
              <div className="h-12 rounded bg-slate-100" />
              <div className="h-12 rounded bg-slate-100" />
              <div className="h-12 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const maxGols = Math.max(...topArtilheiros.map((item) => item.valor), 1);

  const kpis: KpiItem[] = [
    {
      label: "Jogadores",
      value: formatNumber(data.jogadores?.totalJogadores),
      subtitle: `${formatPercent(data.jogadores?.mediaPresenca)} media de presenca`,
      icon: "J",
      to: "/dashboard/jogadores",
    },
    {
      label: "Partidas",
      value: formatNumber(data.partidas?.totalPartidas),
      subtitle: `${formatNumber(data.partidas?.mediaGolsPorPartida)} gols por partida`,
      icon: "P",
      to: "/dashboard/partidas",
    },
    {
      label: "Gols",
      value: formatNumber(data.partidas?.totalGols ?? data.jogadores?.totalGols),
      subtitle: "Total consolidado nos eventos",
      icon: "G",
      to: "/dashboard/estatisticas",
    },
    {
      label: "Presenca media",
      value: formatPercent(data.jogadores?.mediaPresenca),
      subtitle: "Indicador agregado dos jogadores",
      icon: "%",
      to: "/dashboard/jogadores",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader
            title="Dashboard"
            subtitle="Resumo operacional dos eventos, jogadores e partidas"
            action={
              <>
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  to="/dashboard/partidas"
                >
                  Ver partidas
                </Link>
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  to="/dashboard/estatisticas"
                >
                  Ver estatisticas
                </Link>
              </>
            }
          />
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Ultimos 30 dias</span>
            <span>{loading ? "Atualizando indicadores..." : "Indicadores atualizados com dados reais do backend"}</span>
          </div>
        </section>

        {erro ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" aria-live="polite">
            <h2 className="font-semibold">Nao foi possivel carregar o dashboard</h2>
            <p className="mt-1">Verifique backend, proxy ou CORS e tente atualizar a pagina.</p>
            <p className="mt-2 text-amber-800">{erro}</p>
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-6">
              <section aria-labelledby="dashboard-kpis" data-testid="dashboard-indicadores">
                <h2 id="dashboard-kpis" className="sr-only">
                  Indicadores principais
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {kpis.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="group flex min-h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{item.label}</p>
                          <p className="mt-2 text-3xl font-semibold text-slate-950">{item.value}</p>
                        </div>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary" aria-hidden>
                          {item.icon}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-5 text-slate-600">{item.subtitle}</p>
                    </Link>
                  ))}
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="atividade-recente">
                  <div>
                    <h2 id="atividade-recente" className="text-lg font-semibold text-slate-950">
                      Atividade recente
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">Partidas e gols por dia nos ultimos registros.</p>
                  </div>
                  {ultimosDias.length === 0 ? (
                    <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                      Sem partidas registradas no periodo.
                    </div>
                  ) : (
                    <div className="mt-5 divide-y divide-slate-100">
                      {ultimosDias.map((item) => (
                        <article key={item.data} className="flex items-center justify-between gap-4 py-4">
                          <div>
                            <h3 className="font-medium text-slate-900">{formatDate(item.data)}</h3>
                            <p className="mt-1 text-sm text-slate-600">{formatNumber(item.partidas)} partida(s)</p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                            {formatNumber(item.gols)} gols
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="top-artilheiros">
                  <div>
                    <h2 id="top-artilheiros" className="text-lg font-semibold text-slate-950">
                      Top artilheiros
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">Ranking consolidado vindo do backend.</p>
                  </div>
                  {topArtilheiros.length === 0 ? (
                    <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                      Sem gols registrados ainda.
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {topArtilheiros.map((item, index) => {
                        const width = `${Math.max(8, Math.round((item.valor / maxGols) * 100))}%`;
                        return (
                          <article key={`${item.jogadorId ?? "sem-id"}-${item.nome}`} className="rounded-lg border border-slate-100 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900">
                                  #{index + 1} {item.nome}
                                </h3>
                                <p className="mt-1 text-sm text-slate-600">Jogador #{item.jogadorId ?? "-"}</p>
                              </div>
                              <span className="text-lg font-semibold text-slate-950">{formatNumber(item.valor)}</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                              <div className="h-full rounded-full bg-primary" style={{ width }} />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
