import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardFilters from "../../components/dashboard/filters/DashboardFilters";
import RankingTable from "../../components/dashboard/tables/RankingTable";
import InfoCard from "../../components/dashboard/cards/InfoCard";
import SectionHeader from "../../components/dashboard/common/SectionHeader";
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
    <div className="container py-4">
      <SectionHeader
        title="Dashboard de Jogadores"
        subtitle="Desempenho recente"
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
        <div className="row g-3">
          {[1, 2, 3].map((n) => (
            <div className="col-12 col-md-4" key={n}>
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="placeholder-wave">
                    <span className="placeholder col-6 mb-2"></span>
                    <span className="placeholder col-4 mb-2"></span>
                    <span className="placeholder col-8"></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="col-12">
            <div className="placeholder-wave">
              <div className="placeholder col-12" style={{ height: 180 }}></div>
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
              <InfoCard title="Jogadores" value={`${resumo?.totalJogadores ?? 0}`} subtitle="Cadastrados" />
            </div>
            <div className="col-12 col-md-4">
              <InfoCard
                title="Presença média"
                value={`${resumo?.mediaPresenca ?? 0}%`}
                subtitle="Últimos registros"
              />
            </div>
            <div className="col-12 col-md-4">
              <InfoCard title="Gols" value={`${resumo?.totalGols ?? totals.gols}`} subtitle="Soma no período" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="alert alert-warning d-flex justify-content-between align-items-center">
              <span>Sem dados nesse período ou filtros.</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => fetchData(true)}>
                Recarregar
              </button>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">Ranking</h5>
                  <small className="text-muted">Clique em uma linha para ver detalhes</small>
                </div>
                <RankingTable
                  columns={columns}
                  data={filtered}
                  onRowClick={handleRowClick}
                  rowKey={(r) => r.jogadorId}
                  activeRowKey={selectedJogador?.jogadorId ?? null}
                />
              </div>
            </div>
          )}

          {selectedJogador && (
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{selectedJogador.nome}</h6>
                    <small className="text-muted">{selectedJogador.turmaNome ?? "Turma não informada"}</small>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setSelectedJogador(null)}
                  >
                    Fechar
                  </button>
                </div>
                <div className="row g-3 mt-2">
                  <div className="col-6 col-md-3">
                    <InfoCard title="Presenças" value={`${selectedJogador.presencas}`} subtitle="No período" />
                  </div>
                  <div className="col-6 col-md-3">
                    <InfoCard title="Gols" value={`${selectedJogador.gols}`} subtitle="Somatório" />
                  </div>
                  <div className="col-6 col-md-3">
                    <InfoCard title="Assistências" value={`${selectedJogador.assistencias}`} subtitle="Somatório" />
                  </div>
                  <div className="col-6 col-md-3">
                    <InfoCard title="Pontuação" value={`${selectedJogador.pontuacao.toFixed(1)}`} subtitle="Regra local" />
                  </div>
                </div>
                <div className="mt-4">
                  <h6 className="mb-2">Origem por Evento</h6>
                  <div className="d-grid gap-2">
                    {selectedJogador.eventos.map((evento) => (
                      <Link
                        key={`${evento.eventoId}-${evento.dataIso}`}
                        to={`/dias/${evento.dataIso}/eventos/${evento.eventoId}`}
                        className="rounded border p-3 text-decoration-none"
                      >
                        <div className="d-flex flex-wrap justify-content-between gap-2">
                          <span>
                            <strong>Evento #{evento.eventoId}</strong> · {evento.tipo}
                          </span>
                          <span>{new Date(`${evento.dataIso}T12:00:00`).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <small className="text-muted">
                          {evento.turmaNome ?? "Jogo livre"} · {evento.gols} gols · {evento.assistencias} assist. · {evento.presencas} presença
                        </small>
                      </Link>
                    ))}
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
