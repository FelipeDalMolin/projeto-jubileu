import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDays, isWithinInterval, parseISO } from "date-fns";
import styles from "./TrofeuPage.module.css";
import InfoCard from "../../components/dashboard/cards/InfoCard";
import {
  calcularRanking,
  getRankingTimeline,
  type RankingTimeline,
} from "../../domain/trofeu/trofeuScoring";
import { calcularDeltaPosicoes } from "../../domain/trofeu/trofeuDelta";
import type { RankingItem } from "../../domain/trofeu/trofeuTypes";
import { trofeuJogadores, trofeuTurmas, trofeuRegistros } from "../../mocks/trofeu/trofeuMock";
import { buildPlayerProfiles, type PlayerProfile } from "../../domain/recommendation/playerProfile";

const ALLOWED_PERIODS = new Set([30, 90, 365]);
const MAX_SELECTED_EVOLUCAO = 3;

type TrofeuRow = RankingItem & {
  rank: number;
  delta: number | null;
  posAnterior: number | null;
};

type TrofeuSortKey = keyof TrofeuRow;

type TrofeuColumn = {
  key: TrofeuSortKey | "spark";
  label: string;
  numeric: boolean;
};

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function parsePeriod(search: URLSearchParams): number {
  const raw = Number(search.get("periodo") ?? 30);
  return ALLOWED_PERIODS.has(raw) ? raw : 30;
}

function filterBetween(registros: typeof trofeuRegistros, start: Date, end: Date) {
  return registros.filter((r) => {
    const d = parseISO(r.dataIso);
    return isWithinInterval(d, { start, end });
  });
}

function countJogos(registros: typeof trofeuRegistros) {
  return registros.reduce((acc, r) => acc + r.presencas.filter((p) => p.participou).length, 0);
}

function countPontos(registros: typeof trofeuRegistros) {
  return registros.reduce((acc, r) => {
    return (
      acc +
      r.presencas.reduce((sum, p) => {
        if (!p.participou) return sum;
        if (p.resultado === "V") return sum + 3;
        if (p.resultado === "E") return sum + 1;
        return sum;
      }, 0)
    );
  }, 0);
}

export default function TrofeuPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [periodo, setPeriodo] = useState<number>(parsePeriod(searchParams));
  const [turmaId, setTurmaId] = useState<string>(searchParams.get("turma") ?? "todas");
  const [busca, setBusca] = useState<string>(searchParams.get("busca") ?? "");
  const [incluirZero, setIncluirZero] = useState<boolean>(searchParams.get("zero") === "1");
  const debouncedBusca = useDebouncedValue(busca);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [rankingAnterior, setRankingAnterior] = useState<RankingItem[]>([]);
  const [timeline, setTimeline] = useState<RankingTimeline | null>(null);
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [selected, setSelected] = useState<RankingItem | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedEvolucao, setSelectedEvolucao] = useState<number[]>([]);
  const [showSparklines, setShowSparklines] = useState<boolean>(true);

  const fail = searchParams.get("fail") === "1";

  useEffect(() => {
    const params = new URLSearchParams();
    if (periodo !== 30) params.set("periodo", String(periodo));
    if (turmaId !== "todas") params.set("turma", turmaId);
    if (busca.trim()) params.set("busca", busca.trim());
    if (incluirZero) params.set("zero", "1");
    setSearchParams(params, { replace: true });
  }, [periodo, turmaId, busca, incluirZero, setSearchParams]);

  const turmaIdNum = useMemo(() => {
    const n = Number(turmaId);
    return turmaId === "todas" || Number.isNaN(n) ? null : n;
  }, [turmaId]);

  const loadData = useCallback(
    (forceDelay?: number) => {
      setLoading(true);
      setError(null);
      const timeout = forceDelay ?? Math.floor(Math.random() * 400) + 400;
      const timer = setTimeout(() => {
        if (fail) {
          setError("Erro ao carregar ranking (simulado via ?fail=1).");
          setLoading(false);
          return;
        }

        const hoje = new Date();
        const inicioAtual = addDays(hoje, -periodo);
        const registrosPeriodo = filterBetween(trofeuRegistros, inicioAtual, hoje);

        const inicioAnterior = addDays(inicioAtual, -periodo);
        const fimAnterior = addDays(inicioAtual, -1);
        const registrosPeriodoAnterior = filterBetween(trofeuRegistros, inicioAnterior, fimAnterior);

        const atual = calcularRanking({
          registros: registrosPeriodo,
          jogadores: trofeuJogadores,
          periodoDias: periodo,
          turmaId: turmaIdNum,
          incluirZeroJogos: incluirZero,
          busca: debouncedBusca,
        });

        const anterior = calcularRanking({
          registros: registrosPeriodoAnterior,
          jogadores: trofeuJogadores,
          periodoDias: periodo,
          turmaId: turmaIdNum,
          incluirZeroJogos: incluirZero,
          busca: debouncedBusca,
        });

        const timelineResp = getRankingTimeline({
          registros: registrosPeriodo,
          jogadores: trofeuJogadores,
          periodoDias: periodo,
          turmaId: turmaIdNum,
          incluirZeroJogos: incluirZero,
          busca: debouncedBusca,
          bucket: "semana",
        });

        setRanking(atual);
        setRankingAnterior(anterior);
        setTimeline(timelineResp);
        setProfiles(buildPlayerProfiles(atual, timelineResp));

        if (selectedEvolucao.length === 0) {
          setSelectedEvolucao(atual.slice(0, MAX_SELECTED_EVOLUCAO).map((r) => r.jogadorId));
        }

        setLoading(false);
      }, timeout);
      return () => clearTimeout(timer);
    },
    [periodo, turmaIdNum, incluirZero, debouncedBusca, fail, selectedEvolucao.length],
  );

  useEffect(() => {
    let cancelLoad: (() => void) | undefined;
    const startTimer = setTimeout(() => {
      cancelLoad = loadData();
    }, 0);
    return () => {
      clearTimeout(startTimer);
      cancelLoad?.();
    };
  }, [loadData]);

  const deltas = useMemo(() => calcularDeltaPosicoes(ranking, rankingAnterior), [ranking, rankingAnterior]);
  const deltaMap = useMemo(() => new Map(deltas.map((d) => [d.jogadorId, d])), [deltas]);
  const sortedTurmas = useMemo(() => trofeuTurmas.map((t) => ({ value: String(t.id), label: t.nome })), []);

  const jogosPeriodo = useMemo(
    () => countJogos(filterBetween(trofeuRegistros, addDays(new Date(), -periodo), new Date())),
    [periodo],
  );
  const pontosTotais = useMemo(
    () => countPontos(filterBetween(trofeuRegistros, addDays(new Date(), -periodo), new Date())),
    [periodo],
  );
  const presencaMedia = useMemo(() => {
    if (!ranking.length) return 0;
    const soma = ranking.reduce((acc, r) => acc + r.presenca, 0);
    return Number(((soma / ranking.length) * 100).toFixed(1));
  }, [ranking]);

  const [sortKey, setSortKey] = useState<TrofeuSortKey>("scoreFinal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const withRank = useMemo(() => {
    return ranking.map((item, idx) => {
      const delta = deltaMap.get(item.jogadorId);
      return {
        ...item,
        rank: idx + 1,
        delta: delta?.delta ?? null,
        posAnterior: delta?.posicaoAnterior ?? null,
      };
    });
  }, [ranking, deltaMap]);

  const sortedRows = useMemo(() => {
    const rows = [...withRank];
    rows.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (sortDir === "asc") return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
    return rows;
  }, [withRank, sortKey, sortDir]);

  const toggleSort = (key: TrofeuColumn["key"]) => {
    if (key === "spark") return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  };

  const timelineMap = useMemo(() => {
    const map = new Map<number, Array<number | null>>();
    if (!timeline) return map;
    timeline.items.forEach((it) => {
      const positions = it.positionByBucket.map((p) => (p === null ? null : Number(p)));
      map.set(it.jogadorId, positions);
    });
    return map;
  }, [timeline]);

  const renderSparkline = (jogadorId: number) => {
    if (!showSparklines) return null;
    const serie = timelineMap.get(jogadorId) ?? [];
    const filtered = serie.filter((p): p is number => p !== null);
    if (!filtered.length) return <small className="text-muted">-</small>;
    const max = Math.max(...filtered);
    const min = Math.min(...filtered);
    const range = Math.max(1, max - min);
    const width = Math.max(40, filtered.length * 12);
    const height = 30;
    const points = filtered
      .map((p, idx) => {
        const x = (idx / Math.max(1, filtered.length - 1)) * (width - 6) + 3;
        const y = height - ((p - min) / range) * (height - 6) - 3;
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline fill="none" stroke="#0ea5e9" strokeWidth="2" points={points} />
      </svg>
    );
  };

  const columns: TrofeuColumn[] = [
    { key: "rank", label: "#", numeric: true },
    { key: "delta", label: "Delta", numeric: true },
    { key: "nome", label: "Jogador" },
    { key: "spark", label: showSparklines ? "Trend" : "", numeric: false },
    { key: "presenca", label: "Presenca", numeric: true },
    { key: "jogos", label: "Jogos", numeric: true },
    { key: "vitorias", label: "V", numeric: true },
    { key: "empates", label: "E", numeric: true },
    { key: "derrotas", label: "D", numeric: true },
    { key: "pontosBrutos", label: "Pontos", numeric: true },
    { key: "scoreFinal", label: "Score", numeric: true },
    { key: "gols", label: "Gols", numeric: true },
    { key: "cartoes2min", label: "2min", numeric: true },
    { key: "chilique", label: "Chiliques", numeric: true },
  ];

  const renderDelta = (delta: number | null) => {
    if (delta === null) return <span className="text-muted">-</span>;
    if (delta > 0) return <span className="text-success">▲ {delta}</span>;
    if (delta < 0) return <span className="text-danger">▼ {Math.abs(delta)}</span>;
    return <span className="text-muted">=</span>;
  };

  const openDrawer = (row: RankingItem & { rank: number; delta: number | null }) => {
    setSelected(row);
  };
  const closeDrawer = () => setSelected(null);

  const selectedProfilesMap = useMemo(() => {
    const map = new Map<number, PlayerProfile>();
    profiles.forEach((p) => map.set(p.jogadorId, p));
    return map;
  }, [profiles]);

  const renderEvolucaoChart = () => {
    if (!timeline || selectedEvolucao.length === 0) return null;
    const buckets = timeline.buckets;
    if (!buckets.length) return null;
    const series = timeline.items.filter((it) => selectedEvolucao.includes(it.jogadorId));
    if (!series.length) return null;
    const allPositions = series.flatMap((s) => s.positionByBucket.filter((p): p is number => p !== null));
    const maxPos = Math.max(...allPositions, 1);
    const width = Math.max(260, buckets.length * 40);
    const height = 180;

    const colorPalette = ["#0ea5e9", "#6366f1", "#f97316", "#22c55e"];

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {buckets.map((b, idx) => (
          <text key={b} x={(idx / Math.max(1, buckets.length - 1)) * width} y={height - 6} fontSize="10">
            {b.slice(5)}
          </text>
        ))}
        {series.map((s, sIdx) => {
          const positions = s.positionByBucket.map((p) => (p === null ? maxPos : p));
          const points = positions
            .map((p, idx) => {
              const x = (idx / Math.max(1, positions.length - 1)) * (width - 10) + 5;
              const y = 10 + ((p - 1) / Math.max(1, maxPos - 1)) * (height - 30);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polyline
              key={s.jogadorId}
              fill="none"
              stroke={colorPalette[sIdx % colorPalette.length]}
              strokeWidth="2"
              points={points}
            />
          );
        })}
      </svg>
    );
  };

  const toggleEvolucaoSelection = (id: number) => {
    setSelectedEvolucao((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_SELECTED_EVOLUCAO) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className="container py-4">
      <div className={`${styles.hero} mb-3`}>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <p className="mb-1 text-uppercase" style={{ letterSpacing: 0.4 }}>
              Ranking
            </p>
            <h1 className="h3 mb-1">Trofeu Jubileu</h1>
            <p className="mb-0 text-light">Ranking, desempenho e evolucao</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-outline-light btn-sm" onClick={() => navigate("/dashboard/partidas")}>
              Abrir Partidas
            </button>
            <button className="btn btn-outline-light btn-sm" onClick={() => navigate("/dashboard/jogadores")}>
              Ver Jogadores
            </button>
            <button className="btn btn-light btn-sm" onClick={() => setShowModal(true)}>
              Como calculamos?
            </button>
          </div>
        </div>
      </div>

      <div className={`${styles.stickyFilters} mb-3`}>
        <div className="card border-0 shadow-sm">
          <div className="card-body row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label text-muted small mb-1">Turma</label>
              <select
                className="form-select"
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
              >
                <option value="todas">Todas</option>
                {sortedTurmas.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small mb-1">Periodo</label>
              <div className="btn-group w-100">
                {[30, 90, 365].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${periodo === p ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setPeriodo(p)}
                  >
                    {p} dias
                  </button>
                ))}
              </div>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label text-muted small mb-1">Busca</label>
              <input
                type="text"
                className="form-control"
                value={busca}
                placeholder="Nome ou apelido"
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-1 d-flex align-items-center gap-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="incluirZero"
                checked={incluirZero}
                onChange={(e) => setIncluirZero(e.target.checked)}
              />
              <label htmlFor="incluirZero" className="form-check-label small">
                Incluir 0 jogos
              </label>
            </div>
            <div className="col-6 col-md-1 text-end">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => loadData(500)}>
                Recarregar
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="placeholder-wave">
              <div className="placeholder col-12 mb-2" style={{ height: 24 }}></div>
              <div className="placeholder col-12 mb-2" style={{ height: 24 }}></div>
              <div className="placeholder col-12" style={{ height: 240 }}></div>
            </div>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
          <span>{error}</span>
          <button className="btn btn-sm btn-light" onClick={() => loadData(600)}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="row g-3 mb-3">
            <div className="col-6 col-md-2">
              <InfoCard title="Jogadores" value={`${ranking.length}`} subtitle="No periodo" />
            </div>
            <div className="col-6 col-md-2">
              <InfoCard title="Jogos" value={`${jogosPeriodo}`} subtitle="Somatorio" />
            </div>
            <div className="col-6 col-md-2">
              <InfoCard title="Pontos" value={`${pontosTotais}`} subtitle="Pontos brutos" />
            </div>
            <div className="col-6 col-md-2">
              <InfoCard title="Presenca media" value={`${presencaMedia}%`} subtitle="Ranking atual" />
            </div>
            <div className="col-6 col-md-2">
              <InfoCard title="Periodo" value={`${periodo}d`} subtitle="Janela analisada" />
            </div>
            <div className="col-6 col-md-2">
              <InfoCard title="Turma" value={turmaId === "todas" ? "Todas" : turmaId} subtitle="Filtro ativo" />
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Evolucao</h5>
                <small className="text-muted">Selecione ate 3 jogadores</small>
              </div>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {ranking.map((r) => (
                  <button
                    key={r.jogadorId}
                    className={`btn btn-sm ${selectedEvolucao.includes(r.jogadorId) ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => toggleEvolucaoSelection(r.jogadorId)}
                  >
                    {r.nome}
                  </button>
                ))}
              </div>
              <div style={{ minHeight: 120 }}>{renderEvolucaoChart()}</div>
            </div>
          </div>

          {sortedRows.length === 0 ? (
            <div className="alert alert-warning d-flex justify-content-between align-items-center">
              <span>Nenhum jogador encontrado. Ajuste o periodo ou marque "Incluir 0 jogos".</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setIncluirZero(true)}>
                Incluir 0 jogos
              </button>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">Ranking</h5>
                  <div className="d-flex align-items-center gap-2">
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="sparkToggle"
                        checked={showSparklines}
                        onChange={(e) => setShowSparklines(e.target.checked)}
                      />
                      <label className="form-check-label small" htmlFor="sparkToggle">
                        Sparklines
                      </label>
                    </div>
                    <small className="text-muted">Topo destacado, header fixo</small>
                  </div>
                </div>
                <div className={styles.tableWrapper}>
                  <table className="table align-middle mb-0" style={{ minWidth: 900 }}>
                    <thead className="table-light position-sticky top-0" style={{ zIndex: 2 }}>
                      <tr>
                        {columns.map((c) => (
                          <th
                            key={c.key}
                            role="button"
                            onClick={() => toggleSort(c.key)}
                            className={c.numeric ? "text-end" : "text-start"}
                          >
                            <span className="d-inline-flex align-items-center gap-1">
                              {c.label}
                              <small className="text-muted">
                                {sortKey === c.key ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                              </small>
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => {
                        const isTop3 = row.rank <= 3;
                        const delta = deltaMap.get(row.jogadorId)?.delta ?? null;
                        return (
                          <tr
                            key={row.jogadorId}
                            className={isTop3 ? "table-primary" : ""}
                            style={{ cursor: "pointer" }}
                            onClick={() => openDrawer(row)}
                          >
                            <td className="text-end fw-bold">
                              {isTop3 ? <span className={styles.medal}>#{row.rank}</span> : row.rank}
                            </td>
                            <td className="text-end">{renderDelta(delta)}</td>
                            <td>{row.nome}</td>
                            <td>{renderSparkline(row.jogadorId)}</td>
                            <td className="text-end">{(row.presenca * 100).toFixed(1)}%</td>
                            <td className="text-end">{row.jogos}</td>
                            <td className="text-end">{row.vitorias}</td>
                            <td className="text-end">{row.empates}</td>
                            <td className="text-end">{row.derrotas}</td>
                            <td className="text-end">{row.pontosBrutos}</td>
                            <td className="text-end">{row.scoreFinal.toFixed(2)}</td>
                            <td className="text-end">{row.gols}</td>
                            <td className="text-end">{row.cartoes2min}</td>
                            <td className="text-end">{row.chilique}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className={styles.drawer}>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 className="mb-0">{selected.nome}</h5>
              <small className="text-muted">
                Score {selected.scoreFinal.toFixed(2)} · Presenca {(selected.presenca * 100).toFixed(1)}%
              </small>
            </div>
            <button className="btn btn-sm btn-outline-secondary" onClick={closeDrawer}>
              Fechar
            </button>
          </div>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <InfoCard title="Pontos" value={`${selected.pontosBrutos}`} subtitle="Brutos" />
            </div>
            <div className="col-6">
              <InfoCard title="Vitorias" value={`${selected.vitorias}`} subtitle="No periodo" />
            </div>
            <div className="col-6">
              <InfoCard title="Gols" value={`${selected.gols}`} subtitle="Somatorio" />
            </div>
            <div className="col-6">
              <InfoCard title="Jogos" value={`${selected.jogos}`} subtitle="No periodo" />
            </div>
          </div>
          <div className="mb-3">
            <h6 className="mb-1">Sinais</h6>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-primary">Performance {selected.scoreFinal.toFixed(1)}</span>
              <span className="badge bg-success">
                Confiabilidade {(selected.presenca * 100).toFixed(0)}%
              </span>
              {(() => {
                const prof = selectedProfilesMap.get(selected.jogadorId);
                const tendencia = prof?.tendencia ?? 0;
                const label = tendencia > 0 ? "Subindo" : tendencia < 0 ? "Caindo" : "Estavel";
                const cls = tendencia > 0 ? "badge bg-success" : tendencia < 0 ? "badge bg-danger" : "badge bg-secondary";
                return <span className={cls}>Tendencia {label}</span>;
              })()}
            </div>
          </div>
          <div className="mb-3">
            <h6 className="mb-1">Ultimos resultados</h6>
            <div className="d-flex flex-wrap gap-1">
              {[...Array(Math.min(selected.jogos, 6)).keys()].map((idx) => (
                <span key={idx} className="badge bg-secondary">
                  {idx % 3 === 0 ? "V" : idx % 3 === 1 ? "E" : "D"}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <h6 className="mb-1">Evolucao da posicao</h6>
            <svg width="100%" height="60" viewBox="0 0 200 60">
              <polyline
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2"
                points="0,50 50,40 100,30 150,35 200,20"
              />
            </svg>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary btn-sm">Abrir perfil do jogador</button>
            <button className="btn btn-outline-primary btn-sm">Ver dias</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Como calculamos?</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <ul className="mb-2">
                  <li>PontosBrutos = 3*V + 1*E + 0*D</li>
                  <li>ScoreFinal = PontosBrutos * (0.85 + 0.15*Presenca)</li>
                  <li>Presenca = presencas / totalEventos</li>
                  <li>Desempate: Score desc, Presenca desc, Vitorias desc, Gols desc, Jogos desc</li>
                </ul>
                <div className="alert alert-warning mb-0">Pesos podem ser ajustados no futuro.</div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
