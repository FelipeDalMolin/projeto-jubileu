import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardFilters from "../../components/dashboard/filters/DashboardFilters";
import RankingTable from "../../components/dashboard/tables/RankingTable";
import SectionHeader from "../../components/dashboard/common/SectionHeader";
import InfoCard from "../../components/dashboard/cards/InfoCard";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, ErrorState } from "../../components/ui/feedback";
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
    <PageShell>
      <SectionHeader
        title="Dashboard de Estatísticas"
        subtitle="Indicadores agregados"
        action={
          <Button variant="outline" size="sm" onClick={() => fetchData(true)}>Recarregar</Button>
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
        <Card className="animate-pulse p-5" aria-label="Carregando dashboard de estatísticas">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="mt-6 space-y-3"><div className="h-10 rounded bg-slate-100" /><div className="h-10 rounded bg-slate-100" /><div className="h-10 rounded bg-slate-100" /></div>
        </Card>
      )}

      {!loading && error && (
        <div className="space-y-3">
          <ErrorState title="Não foi possível carregar estatísticas" message={error} />
          <Button variant="outline" size="sm" onClick={() => fetchData(true)}>Tentar novamente</Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
              <CardDescription>Métricas filtradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <InfoCard title="Top artilheiros" value={`${cards.artilheiros}`} subtitle="Até 5 itens" />
                </div>
                <div>
                  <InfoCard title="Top presenças" value={`${cards.presencas}`} subtitle="Até 5 itens" />
                </div>
                <div>
                  <InfoCard title="Gols por turma" value={`${cards.golsTurma}`} subtitle="Somatório" />
                </div>
              </div>
            </CardContent>
          </Card>

          {artilheiros.length === 0 && presencas.length === 0 && golsTurma.length === 0 ? (
            <EmptyState title="Sem dados para este período" description="Altere os filtros ou recarregue o dashboard." action={<Button variant="outline" size="sm" onClick={() => fetchData(true)}>Recarregar</Button>} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                  <CardHeader><CardTitle>Artilheiros</CardTitle></CardHeader>
                  <CardContent>
                    <RankingTable columns={columnsArtilheiros} data={artilheiros} />
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>Presenças</CardTitle></CardHeader>
                  <CardContent>
                    <RankingTable columns={columnsPresencas} data={presencas} />
                  </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>Gols por turma</CardTitle></CardHeader>
                  <CardContent>
                    <RankingTable columns={columnsTurma} data={golsTurma} />
                  </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
