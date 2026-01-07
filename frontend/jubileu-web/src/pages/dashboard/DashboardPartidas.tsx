import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardFilters from "../../components/dashboard/filters/DashboardFilters";
import RankingTable from "../../components/dashboard/tables/RankingTable";
import SectionHeader from "../../components/dashboard/common/SectionHeader";
import InfoCard from "../../components/dashboard/cards/InfoCard";
import {
  obterResumoPartidas,
  obterSeriePorDia,
  type ResumoPartidas,
  type SeriePorDiaItem,
} from "../../services/dashboard/partidasDashboardService";

const ALLOWED_PERIODS = new Set([30, 90, 365]);

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function parsePeriodFromSearch(search: URLSearchParams): number {
  const raw = Number(search.get("periodo") ?? 30);
  return ALLOWED_PERIODS.has(raw) ? raw : 30;
}

export default function DashboardPartidas() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [period, setPeriod] = useState<number>(parsePeriodFromSearch(searchParams));
  const [turma, setTurma] = useState<string>(searchParams.get("turma") ?? "todas");
  const [search, setSearch] = useState<string>(searchParams.get("busca") ?? "");
  const debouncedSearch = useDebouncedValue(search);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResumoPartidas | null>(null);
  const [serie, setSerie] = useState<SeriePorDiaItem[]>([]);

  const turmaId = useMemo(() => {
    const n = Number(turma);
    return turma === "todas" || Number.isNaN(n) ? null : n;
  }, [turma]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (period !== 30) params.set("periodo", String(period));
    if (turma && turma !== "todas") params.set("turma", turma);
    if (search.trim()) params.set("busca", search.trim());
    setSearchParams(params, { replace: true });
  }, [period, turma, search, setSearchParams]);

  const fetchData = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      try {
        const [resumoResp, serieResp] = await Promise.all([
          obterResumoPartidas({ force }),
          obterSeriePorDia({ periodo: period, turma: turmaId ?? undefined }, { force }),
        ]);
        setResumo(resumoResp);
        setSerie(serieResp.items ?? []);
      } catch (err: any) {
        setError(err?.message ?? "Erro ao carregar partidas.");
      } finally {
        setLoading(false);
      }
    },
    [period, turmaId],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return serie;
    return serie.filter((p) => p.data.toLowerCase().includes(term));
  }, [serie, debouncedSearch]);

  const cards = useMemo(() => {
    const totalPartidas = resumo?.totalPartidas ?? filtered.reduce((acc, s) => acc + s.partidas, 0);
    const totalGols = resumo?.totalGols ?? filtered.reduce((acc, s) => acc + s.gols, 0);
    const mediaGols =
      resumo?.mediaGolsPorPartida ??
      (totalPartidas ? Number((totalGols / totalPartidas).toFixed(2)) : 0);
    return { totalPartidas, totalGols, mediaGols };
  }, [resumo, filtered]);

  const columns = [
    {
      key: "data",
      label: "Data",
      render: (row: SeriePorDiaItem) => new Date(row.data).toLocaleDateString("pt-BR"),
    },
    { key: "partidas", label: "Partidas", numeric: true },
    { key: "gols", label: "Gols", numeric: true },
  ];

  return (
    <div className="container py-4">
      <SectionHeader
        title="Dashboard de Partidas"
        subtitle="Resultados e destaques"
        action={
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => fetchData(true)}>
              Recarregar
            </button>
          </div>
        }
      />

      <DashboardFilters
        period={period}
        turma={turma}
        search={search}
        turmasDisponiveis={[]}
        onChangePeriod={setPeriod}
        onChangeTurma={setTurma}
        onChangeSearch={setSearch}
      />

      {loading && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="placeholder-wave">
              <div className="placeholder col-12 mb-2" style={{ height: 24 }}></div>
              <div className="placeholder col-12 mb-2" style={{ height: 24 }}></div>
              <div className="placeholder col-12" style={{ height: 24 }}></div>
            </div>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
          <span>{error}</span>
          <button className="btn btn-sm btn-light" onClick={() => fetchData(true)}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-4">
              <InfoCard title="Partidas" value={`${cards.totalPartidas}`} subtitle="No período" />
            </div>
            <div className="col-12 col-md-4">
              <InfoCard title="Gols" value={`${cards.totalGols}`} subtitle="Marcados + sofridos" />
            </div>
            <div className="col-12 col-md-4">
              <InfoCard title="Média de gols" value={`${cards.mediaGols}`} subtitle="Por partida" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="alert alert-warning d-flex justify-content-between align-items-center">
              <span>Sem dados nesse período.</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => fetchData(true)}>
                Recarregar
              </button>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">Série por dia</h5>
                  <small className="text-muted">Tabela rolável no mobile</small>
                </div>
                <RankingTable columns={columns} data={filtered} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
