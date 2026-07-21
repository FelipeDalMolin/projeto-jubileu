import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardFilters from "../../components/dashboard/filters/DashboardFilters";
import RankingTable from "../../components/dashboard/tables/RankingTable";
import SectionHeader from "../../components/dashboard/common/SectionHeader";
import InfoCard from "../../components/dashboard/cards/InfoCard";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, ErrorState } from "../../components/ui/feedback";
import {
  obterResumoPartidas,
  obterSeriePorDia,
  obterListaPartidas,
  type PartidaListaItem,
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

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
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
  const [partidas, setPartidas] = useState<PartidaListaItem[]>([]);

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
        const [resumoResp, serieResp, partidasResp] = await Promise.all([
          obterResumoPartidas({ force }),
          obterSeriePorDia({ periodo: period, turma: turmaId ?? undefined }, { force }),
          obterListaPartidas({ periodo: period, turma: turmaId ?? undefined }, { force }),
        ]);
        setResumo(resumoResp);
        setSerie(serieResp.items ?? []);
        setPartidas(partidasResp.items ?? []);
      } catch (err: unknown) {
        setError(errorMessage(err, "Erro ao carregar partidas."));
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

  const partidasFiltradas = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return partidas;
    return partidas.filter((partida) =>
      [
        partida.dataIso,
        partida.eventoTipo,
        partida.turmaNome ?? "",
        partida.timeANome,
        partida.timeBNome,
        `evento ${partida.eventoId}`,
      ].some((value) => value.toLowerCase().includes(term)),
    );
  }, [partidas, debouncedSearch]);

  const turmasDisponiveis = useMemo(
    () => Array.from(new Set(partidas.flatMap((partida) => partida.turmaId ? [String(partida.turmaId)] : []))),
    [partidas],
  );

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

  const partidaColumns = [
    {
      key: "eventoId",
      label: "Evento",
      render: (row: PartidaListaItem) => (
        <Link to={`/dias/${row.dataIso}/eventos/${row.eventoId}`}>
          Evento #{row.eventoId}
        </Link>
      ),
    },
    {
      key: "dataIso",
      label: "Data",
      render: (row: PartidaListaItem) => new Date(`${row.dataIso}T12:00:00`).toLocaleDateString("pt-BR"),
    },
    { key: "eventoTipo", label: "Tipo" },
    {
      key: "confronto",
      label: "Confronto",
      render: (row: PartidaListaItem) => `${row.timeANome} ${row.golsTimeA} × ${row.golsTimeB} ${row.timeBNome}`,
    },
    { key: "partidaStatus", label: "Status" },
  ];

  return (
    <PageShell>
      <SectionHeader
        title="Dashboard de Partidas"
        subtitle="Resultados e destaques"
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
        <Card className="animate-pulse p-5" aria-label="Carregando dashboard de partidas">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="mt-6 space-y-3"><div className="h-10 rounded bg-slate-100" /><div className="h-10 rounded bg-slate-100" /><div className="h-10 rounded bg-slate-100" /></div>
        </Card>
      )}

      {!loading && error && (
        <div className="space-y-3">
          <ErrorState title="Não foi possível carregar partidas" message={error} />
          <Button variant="outline" size="sm" onClick={() => fetchData(true)}>Tentar novamente</Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <InfoCard title="Partidas" value={`${cards.totalPartidas}`} subtitle="No período" />
            </div>
            <div>
              <InfoCard title="Gols" value={`${cards.totalGols}`} subtitle="Marcados + sofridos" />
            </div>
            <div>
              <InfoCard title="Média de gols" value={`${cards.mediaGols}`} subtitle="Por partida" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Sem dados nesse período" description="Altere os filtros ou recarregue o dashboard." action={<Button variant="outline" size="sm" onClick={() => fetchData(true)}>Recarregar</Button>} />
          ) : (
            <Card>
              <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Série por dia</CardTitle>
                <CardDescription>Tabela rolável no mobile</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingTable columns={columns} data={filtered} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Partidas rastreáveis</CardTitle>
              <CardDescription>Abra o Evento para consultar o fluxo completo</CardDescription>
            </CardHeader>
            <CardContent>
              {partidasFiltradas.length > 0 ? (
                <RankingTable
                  columns={partidaColumns}
                  data={partidasFiltradas}
                  rowKey={(partida) => partida.partidaId}
                />
              ) : (
                <EmptyState title="Nenhuma partida corresponde aos filtros" />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  );
}
