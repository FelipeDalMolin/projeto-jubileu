import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardFilters from "../../components/dashboard/filters/DashboardFilters";
import RankingTable from "../../components/dashboard/tables/RankingTable";
import SectionHeader from "../../components/dashboard/common/SectionHeader";
import InfoCard from "../../components/dashboard/cards/InfoCard";
import {
  obterVisaoGeralEstatisticas,
  type VisaoGeralEstatisticas,
  type ItemScore,
} from "../../services/dashboard/estatisticasDashboardService";

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

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function DashboardEstatisticas() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [period, setPeriod] = useState<number>(parsePeriodFromSearch(searchParams));
  const [turma, setTurma] = useState<string>(searchParams.get("turma") ?? "todas");
  const [search, setSearch] = useState<string>(searchParams.get("busca") ?? "");
  const debouncedSearch = useDebouncedValue(search);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visao, setVisao] = useState<VisaoGeralEstatisticas | null>(null);

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
        const resp = await obterVisaoGeralEstatisticas(
          { periodo: period, turma: turmaId ?? undefined },
          { force },
        );
        setVisao(resp);
      } catch (err: unknown) {
        setError(errorMessage(err, "Erro ao carregar estatísticas."));
      } finally {
        setLoading(false);
      }
    },
    [period, turmaId],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const turmasDisponiveis = useMemo(() => {
    const nomes = new Set<string>();
    (visao?.golsPorTurma ?? []).forEach((t) => {
      if (typeof t.turmaId === "number" && !Number.isNaN(t.turmaId)) {
        nomes.add(String(t.turmaId));
      }
    });
    return Array.from(nomes);
  }, [visao]);

  const filterBySearch = useCallback(<T extends { nome?: string; turmaNome?: string }>(items: T[]) => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (i) =>
        (i.nome ?? "").toLowerCase().includes(term) ||
        (i.turmaNome ?? "").toLowerCase().includes(term),
    );
  }, [debouncedSearch]);

  const artilheiros = useMemo(() => filterBySearch<ItemScore>(visao?.topArtilheiros ?? []), [visao, filterBySearch]);
  const presencas = useMemo(() => filterBySearch<ItemScore>(visao?.topPresencas ?? []), [visao, filterBySearch]);
  const golsTurma = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const base = visao?.golsPorTurma ?? [];
    if (!term) return base;
    return base.filter((g) => (g.turmaNome ?? "").toLowerCase().includes(term));
  }, [visao, debouncedSearch]);

  const cards = useMemo(() => {
    const totalGolsTurma = (visao?.golsPorTurma ?? []).reduce((acc, g) => acc + g.gols, 0);
    return {
      artilheiros: artilheiros.length,
      presencas: presencas.length,
      golsTurma: totalGolsTurma,
    };
  }, [visao, artilheiros, presencas]);

  const columnsArtilheiros = [
    { key: "nome", label: "Jogador" },
    { key: "valor", label: "Gols", numeric: true },
  ];

  const columnsPresencas = [
    { key: "nome", label: "Jogador" },
    { key: "valor", label: "Presenças", numeric: true },
  ];

  const columnsTurma = [
    { key: "turmaNome", label: "Turma" },
    { key: "gols", label: "Gols", numeric: true },
  ];

  return (
    <div className="container py-4">
      <SectionHeader
        title="Dashboard de Estatísticas"
        subtitle="Indicadores agregados"
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
        turmasDisponiveis={turmasDisponiveis}
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
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h5 className="mb-0">Resumo</h5>
                  <small className="text-muted">Métricas filtradas</small>
                </div>
              </div>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <InfoCard title="Top artilheiros" value={`${cards.artilheiros}`} subtitle="Até 5 itens" />
                </div>
                <div className="col-12 col-md-4">
                  <InfoCard title="Top presenças" value={`${cards.presencas}`} subtitle="Até 5 itens" />
                </div>
                <div className="col-12 col-md-4">
                  <InfoCard title="Gols por turma" value={`${cards.golsTurma}`} subtitle="Somatório" />
                </div>
              </div>
            </div>
          </div>

          {artilheiros.length === 0 && presencas.length === 0 && golsTurma.length === 0 ? (
            <div className="alert alert-warning d-flex justify-content-between align-items-center">
              <span>Sem dados para este período.</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => fetchData(true)}>
                Recarregar
              </button>
            </div>
          ) : (
            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="mb-2">Artilheiros</h5>
                    <RankingTable columns={columnsArtilheiros} data={artilheiros} />
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="mb-2">Presenças</h5>
                    <RankingTable columns={columnsPresencas} data={presencas} />
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="mb-2">Gols por turma</h5>
                    <RankingTable columns={columnsTurma} data={golsTurma} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
