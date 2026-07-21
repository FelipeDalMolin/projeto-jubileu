import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardFilters from "../../components/dashboard/filters/DashboardFilters";
import RankingTable from "../../components/dashboard/tables/RankingTable";
import InfoCard from "../../components/dashboard/cards/InfoCard";
import SectionHeader from "../../components/dashboard/common/SectionHeader";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, ErrorState } from "../../components/ui/feedback";
import {
  obterResumoJogadores,
  obterRankingJogadores,
  type ResumoJogadores,
  type RankingJogadorItem,
} from "../../services/dashboard/jogadoresDashboardService";

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

export default function DashboardJogadores() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [period, setPeriod] = useState<number>(parsePeriodFromSearch(searchParams));
  const [turma, setTurma] = useState<string>(searchParams.get("turma") ?? "todas");
  const [search, setSearch] = useState<string>(searchParams.get("busca") ?? "");

  const debouncedSearch = useDebouncedValue(search);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResumoJogadores | null>(null);
  const [ranking, setRanking] = useState<RankingJogadorItem[]>([]);
  const [selectedJogador, setSelectedJogador] = useState<RankingJogadorItem | null>(null);

  const turmaId = useMemo(() => {
    const n = Number(turma);
    return turma === "todas" || Number.isNaN(n) ? null : n;
  }, [turma]);

  // Sincroniza filtros com a URL
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
        const [resumoResp, rankingResp] = await Promise.all([
          obterResumoJogadores({ force }),
          obterRankingJogadores({ periodo: period, turma: turmaId ?? undefined }, { force }),
        ]);
        setResumo(resumoResp);
        setRanking(rankingResp.items ?? []);
      } catch (err: unknown) {
        setError(errorMessage(err, "Erro ao carregar jogadores."));
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
    ranking.forEach((r) => {
      if (typeof r.turmaId === "number" && !Number.isNaN(r.turmaId)) {
        nomes.add(String(r.turmaId));
      }
    });
    return Array.from(nomes);
  }, [ranking]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return ranking;
    return ranking.filter(
      (j) => j.nome.toLowerCase().includes(term) || (j.turmaNome ?? "").toLowerCase().includes(term),
    );
  }, [ranking, debouncedSearch]);

  const totals = useMemo(() => {
    const gols = filtered.reduce((acc, j) => acc + j.gols, 0);
    const assist = filtered.reduce((acc, j) => acc + j.assistencias, 0);
    const presencas = filtered.reduce((acc, j) => acc + j.presencas, 0);
    return { gols, assist, presencas };
  }, [filtered]);

  const columns = [
    { key: "nome", label: "Jogador" },
    { key: "turmaNome", label: "Turma" },
    { key: "presencas", label: "Presenças", numeric: true },
    { key: "gols", label: "Gols", numeric: true },
    { key: "assistencias", label: "Assist.", numeric: true },
    { key: "pontuacao", label: "Pontuação", numeric: true },
  ];

  const handleRowClick = (row: RankingJogadorItem) => {
    setSelectedJogador((prev) => (prev?.jogadorId === row.jogadorId ? null : row));
  };

  return (
    <PageShell>
      <SectionHeader
        title="Dashboard de Jogadores"
        subtitle="Desempenho recente"
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
        <div className="grid gap-4 sm:grid-cols-3" aria-label="Carregando dashboard de jogadores">
          {[1, 2, 3].map((n) => (
            <Card className="animate-pulse p-5" key={n}>
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-5 h-8 w-16 rounded bg-slate-200" />
              <div className="mt-5 h-3 w-32 rounded bg-slate-100" />
            </Card>
          ))}
          <Card className="h-48 animate-pulse bg-slate-50 sm:col-span-3" />
        </div>
      )}

      {!loading && error && (
        <div className="space-y-3">
          <ErrorState title="Não foi possível carregar jogadores" message={error} />
          <Button variant="outline" size="sm" onClick={() => fetchData(true)}>Tentar novamente</Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <InfoCard title="Jogadores" value={`${resumo?.totalJogadores ?? 0}`} subtitle="Cadastrados" />
            </div>
            <div>
              <InfoCard
                title="Presença média"
                value={`${resumo?.mediaPresenca ?? 0}%`}
                subtitle="Últimos registros"
              />
            </div>
            <div>
              <InfoCard title="Gols" value={`${resumo?.totalGols ?? totals.gols}`} subtitle="Soma no período" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Sem dados nesse período ou filtros"
              description="Altere os filtros ou recarregue os dados do dashboard."
              action={<Button variant="outline" size="sm" onClick={() => fetchData(true)}>Recarregar</Button>}
            />
          ) : (
            <Card>
              <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Ranking</CardTitle>
                <CardDescription>Clique em uma linha para ver detalhes</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingTable
                  columns={columns}
                  data={filtered}
                  onRowClick={handleRowClick}
                  rowKey={(r) => r.jogadorId}
                  activeRowKey={selectedJogador?.jogadorId ?? null}
                />
              </CardContent>
            </Card>
          )}

          {selectedJogador && (
            <Card>
              <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{selectedJogador.nome}</CardTitle>
                    <CardDescription>{selectedJogador.turmaNome ?? "Turma não informada"}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedJogador(null)}>Fechar</Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div>
                    <InfoCard title="Presenças" value={`${selectedJogador.presencas}`} subtitle="No período" />
                  </div>
                  <div>
                    <InfoCard title="Gols" value={`${selectedJogador.gols}`} subtitle="Somatório" />
                  </div>
                  <div>
                    <InfoCard title="Assistências" value={`${selectedJogador.assistencias}`} subtitle="Somatório" />
                  </div>
                  <div>
                    <InfoCard title="Pontuação" value={`${selectedJogador.pontuacao.toFixed(1)}`} subtitle="Regra local" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="mb-2 font-semibold text-slate-950">Origem por Evento</h3>
                  <div className="grid gap-2">
                    {selectedJogador.eventos.map((evento) => (
                      <Link
                        key={`${evento.eventoId}-${evento.dataIso}`}
                        to={`/dias/${evento.dataIso}/eventos/${evento.eventoId}`}
                        className="rounded-md border border-slate-200 p-3 text-slate-800 transition hover:border-primary/40 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <span>
                            <strong>Evento #{evento.eventoId}</strong> · {evento.tipo}
                          </span>
                          <span>{new Date(`${evento.dataIso}T12:00:00`).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <span className="mt-1 block text-sm text-slate-600">
                          {evento.turmaNome ?? "Jogo livre"} · {evento.gols} gols · {evento.assistencias} assist. · {evento.presencas} presença
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
