// src/pages/dias/AulaPage.tsx
import {
  useEffect,
  useMemo,
  useState,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  obterDiaPorData,
  criarTimeNaAula,
  carregarEstadoEquipesAula,
  salvarEstadoEquipesAula,
} from "../../services/diasService";
import { obterEstadoAula } from "../../services/aulaEstadoService";

import type {
  AulaDia,
  Dia,
  PresencaJogadorDia,
  TimeDia,
  StatusPresenca,
} from "../../types/dia";

type PartidaAula = {
  id: string;
  ordem: number;
  timeAId: string;
  timeBId: string;
  golsTimeA: number;
  golsTimeB: number;
};

type StatsJogador = {
  gols: number;
  assistencias: number;
  defesas: number;
  chiliques: number;
  faltas: number;
};

// partidaId -> (jogadorId -> stats)
type StatsPartidas = Record<string, Record<number, StatsJogador>>;

// Extensão local de TimeDia com campo de característica
type TimeAula = TimeDia & {
  caracteristica?: string;
};

const DEFAULT_STATS: StatsJogador = {
  gols: 0,
  assistencias: 0,
  defesas: 0,
  chiliques: 0,
  faltas: 0,
};

export default function AulaPage() {
  const { dataIso, aulaId } = useParams<{ dataIso: string; aulaId: string }>();
  const navigate = useNavigate();

  const [dia, setDia] = useState<Dia | null>(null);
  const [aula, setAula] = useState<AulaDia | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [jogadores, setJogadores] = useState<PresencaJogadorDia[]>([]);
  const [times, setTimes] = useState<TimeAula[]>([]);
  const [partidas, setPartidas] = useState<PartidaAula[]>([]);
  const [stats, setStats] = useState<StatsPartidas>({});
  const [pollVersion, setPollVersion] = useState<number | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  const [filtroNome, setFiltroNome] = useState<string>("");

  // seleção para criar nova partida
  const [novoTimeAId, setNovoTimeAId] = useState<string>("");
  const [novoTimeBId, setNovoTimeBId] = useState<string>("");

  // ✅ HOOKS DERIVADOS SEMPRE NO TOPO (Rules of Hooks)
  const dataObj = useMemo(() => {
    try {
      return dataIso ? parseISO(dataIso) : null;
    } catch {
      return null;
    }
  }, [dataIso]);

  const tituloData = useMemo(() => {
    if (!dataObj) return "";
    return format(dataObj, "dd/MM/yyyy", { locale: ptBR });
  }, [dataObj]);

  const jogadoresSemTimeLista = useMemo(
    () => jogadores.filter((j) => !j.timeId),
    [jogadores],
  );

  const jogadoresFiltrados = useMemo(() => {
    if (!filtroNome.trim()) return jogadoresSemTimeLista;
    const f = filtroNome.toLowerCase();
    return jogadoresSemTimeLista.filter((j) => j.nome.toLowerCase().includes(f));
  }, [filtroNome, jogadoresSemTimeLista]);

  // ---------------- CARREGAMENTO ----------------
  useEffect(() => {
    if (!dataIso || !aulaId) return;

    setLoading(true);

    (async () => {
      try {
        const diaResp = await obterDiaPorData(dataIso);
        setDia(diaResp);

        const aulaEncontrada = diaResp.aulas.find((x) => x.id === aulaId) ?? null;
        setAula(aulaEncontrada);

        if (!aulaEncontrada) {
          setJogadores([]);
          setTimes([]);
          setPartidas([]);
          setStats({});
          return;
        }

        // base: o que vier da API da aula
        let jogadoresBase = aulaEncontrada.jogadores ?? [];
        let timesBase: TimeAula[] = (aulaEncontrada.times ?? []).map((t) => ({
          ...t,
          caracteristica: "",
        }));

        // tenta carregar snapshot salvo (estado-equipes)
        try {
          const snap = await carregarEstadoEquipesAula(diaResp.dataIso, aulaEncontrada.id);

          if (snap && (snap.jogadores.length > 0 || snap.times.length > 0)) {
            jogadoresBase = snap.jogadores;
            if (snap.times.length > 0) {
              timesBase = snap.times.map((t) => ({
                ...t,
                caracteristica: "",
              }));
            }
          }
        } catch (err) {
          console.warn("Erro ao carregar estado-equipes (ignorado):", err);
        }

        setJogadores(jogadoresBase);
        setTimes(timesBase);
        setPartidas([]);
        setStats({});
        setPollVersion(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [dataIso, aulaId]);

  // ---------------- POLLING DO ESTADO AGREGADO ----------------
  const isInteractingRef = useRef(false);
  const interactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const marcarInteracao = () => {
    isInteractingRef.current = true;
    if (interactTimerRef.current) clearTimeout(interactTimerRef.current);
    interactTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 3000);
  };

  const aplicarEstadoAula = (data: any) => {
    const jogadoresSrv: PresencaJogadorDia[] = (data.equipes?.jogadores ?? []).map(
      (j: any) => ({
        ...j,
        timeId: j.timeId ?? j.time_id ?? undefined,
      }),
    );
    const timesSrv: TimeAula[] = (data.equipes?.times ?? []).map((t: any) => ({
      ...t,
      id: String(t.id),
      caracteristica: t.caracteristica ?? "",
    }));
    const partidasSrv: PartidaAula[] = (data.partidas ?? []).map((p: any) => ({
      id: String(p.id),
      ordem: p.ordem ?? 0,
      timeAId: p.timeAId ?? p.time_a_id ?? "",
      timeBId: p.timeBId ?? p.time_b_id ?? "",
      golsTimeA: p.golsTimeA ?? p.gols_time_a ?? 0,
      golsTimeB: p.golsTimeB ?? p.gols_time_b ?? 0,
    }));

    setJogadores(jogadoresSrv);
    setTimes(timesSrv);
    setPartidas(partidasSrv);
    // stats detalhadas não vêm no agregado atual
  };

  useEffect(() => {
    if (!dataIso || !aulaId) return;

    let ativo = true;

    const tick = async () => {
      if (!ativo) return;
      if (isInteractingRef.current || document.hidden) {
        pollingTimerRef.current = setTimeout(tick, 3000);
        return;
      }

      try {
        const resp = await obterEstadoAula(
          dataIso,
          Number(aulaId),
          pollVersion ?? undefined,
        );
        if (!ativo) return;

        if (resp.status === 200 && resp.data) {
          if (pollVersion === null || resp.data.version > pollVersion) {
            aplicarEstadoAula(resp.data);
            setPollVersion(resp.data.version);
          }
          setPollError(null);
        }
      } catch (err: any) {
        if (!ativo) return;
        setPollError(err?.message ?? "Erro no polling do estado da aula");
      } finally {
        if (ativo) {
          pollingTimerRef.current = setTimeout(tick, 3000);
        }
      }
    };

    tick();

    return () => {
      ativo = false;
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
      if (interactTimerRef.current) clearTimeout(interactTimerRef.current);
    };
  }, [dataIso, aulaId, pollVersion]);

  // ---------------- ESTADOS BÁSICOS / GUARDAS ----------------
  if (!dataIso || !aulaId) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate("/dias")}>
          ← Voltar
        </button>
        <h1>Parâmetros inválidos</h1>
        <p>Data ou aula não informadas na URL.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
          ← Voltar
        </button>
        <h1>Aula</h1>
        <p>Carregando dados da aula...</p>
      </main>
    );
  }

  if (!dia || !aula) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
          ← Voltar
        </button>
        <h1>Aula não encontrada</h1>
        <p>Não foi possível localizar a aula selecionada para o dia {tituloData}.</p>
      </main>
    );
  }

  // ---------------- PRESENÇA / FILTRO ----------------
  const handleFiltroChange = (e: ChangeEvent<HTMLInputElement>) => {
    marcarInteracao();
    setFiltroNome(e.target.value);
  };

  const handleAlterarStatus = (jogadorId: number, novoStatus: StatusPresenca) => {
    marcarInteracao();
    setJogadores((prev) =>
      prev.map((j) => (j.jogadorId === jogadorId ? { ...j, status: novoStatus } : j)),
    );
  };

  const handleMarcarTodosSoTreino = () => {
    marcarInteracao();
    setJogadores((prev) => prev.map((j) => ({ ...j, status: "so_treino" })));
  };

  const handleLimparStatus = () => {
    marcarInteracao();
    // volta ao padrão: quem não está em time fica "so_treino"
    // (ou ajuste aqui se você quiser um status default diferente)
    setJogadores((prev) =>
      prev.map((j) => ({
        ...j,
        status: j.timeId ? "presente" : "so_treino",
      })),
    );
  };

  // --------------- EQUIPES / DRAG & DROP -------------
  const handleAdicionarEquipe = async () => {
    marcarInteracao();
    try {
      const idx = times.length + 1;
      const nome = `Time ${idx}`;

      const timeBackend = await criarTimeNaAula(dia.dataIso, aula.id, { nome });

      const novo: TimeAula = { ...timeBackend, caracteristica: "" };
      setTimes((prev) => [...prev, novo]);
    } catch (err) {
      console.error(err);
      alert("Erro ao criar equipe. Veja o console para detalhes.");
    }
  };

  const handleLimparEquipes = () => {
    marcarInteracao();
    setTimes([]);
    setPartidas([]);
    setStats({});
    setJogadores((prev) => prev.map((j) => ({ ...j, timeId: undefined })));
  };

  const moverJogadorParaTime = (jogadorId: number, timeId: string | null) => {
    marcarInteracao();
    setTimes((prev) => {
      const semJogador = prev.map((t) => ({
        ...t,
        jogadoresIds: t.jogadoresIds.filter((id) => id !== jogadorId),
      }));

      if (!timeId) return semJogador;

      const idx = semJogador.findIndex((t) => t.id === timeId);
      if (idx === -1) return semJogador;

      const destino = semJogador[idx];
      const atualizado: TimeAula = {
        ...destino,
        jogadoresIds: [...destino.jogadoresIds, jogadorId],
      };

      const novo = [...semJogador];
      novo[idx] = atualizado;
      return novo;
    });

    setJogadores((prev) =>
      prev.map((j) =>
        j.jogadorId === jogadorId ? { ...j, timeId: timeId || undefined } : j,
      ),
    );
  };

  const onJogadorDragStart = (e: DragEvent<HTMLSpanElement>, jogadorId: number) => {
    e.dataTransfer.setData("text/plain", String(jogadorId));
  };

  const onAreaDrop = (e: DragEvent<HTMLDivElement>, destinoTimeId: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    const jogadorId = Number(data);
    if (!Number.isNaN(jogadorId)) {
      moverJogadorParaTime(jogadorId, destinoTimeId);
    }
  };

  const onAreaDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const jogadoresPorTime = (timeId: string) => jogadores.filter((j) => j.timeId === timeId);

  const handleChangeCaracteristica = (timeId: string, e: ChangeEvent<HTMLInputElement>) => {
    marcarInteracao();
    const value = e.target.value;
    setTimes((prev) => prev.map((t) => (t.id === timeId ? { ...t, caracteristica: value } : t)));
  };

  const handleRemoverDoTime = (jogadorId: number) => {
    moverJogadorParaTime(jogadorId, null);
  };

  // ---------------- PARTIDAS / SÚMULA ---------------
  const handleAdicionarPartida = () => {
    marcarInteracao();
    if (times.length < 2) return;
    if (!novoTimeAId || !novoTimeBId) return;
    if (novoTimeAId === novoTimeBId) return;

    setPartidas((prev) => {
      const ordem = prev.length + 1;
      const nova: PartidaAula = {
        id: `jogo-${ordem}`,
        ordem,
        timeAId: novoTimeAId,
        timeBId: novoTimeBId,
        golsTimeA: 0,
        golsTimeB: 0,
      };
      return [...prev, nova];
    });

    setNovoTimeAId("");
    setNovoTimeBId("");
  };

  const handleRemoverPartida = (partidaId: string) => {
    marcarInteracao();
    setPartidas((prev) => prev.filter((p) => p.id !== partidaId));
    setStats((prev) => {
      const clone = { ...prev };
      delete clone[partidaId];
      return clone;
    });
  };

  const handleAlterarStat = (
    partidaId: string,
    jogadorId: number,
    campo: keyof StatsJogador,
    valor: number,
  ) => {
    marcarInteracao();
    setStats((prev) => {
      const statsPartida = prev[partidaId] ?? {};
      const statsJogador: StatsJogador = statsPartida[jogadorId] ?? { ...DEFAULT_STATS };

      return {
        ...prev,
        [partidaId]: {
          ...statsPartida,
          [jogadorId]: {
            ...statsJogador,
            [campo]: valor,
          },
        },
      };
    });
  };

  const getStat = (partidaId: string, jogadorId: number, campo: keyof StatsJogador): number => {
    return stats[partidaId]?.[jogadorId]?.[campo] ?? 0;
  };

  const handleAlterarPlacar = (
    partidaId: string,
    campo: "golsTimeA" | "golsTimeB",
    valor: number,
  ) => {
    marcarInteracao();
    setPartidas((prev) => prev.map((p) => (p.id === partidaId ? { ...p, [campo]: valor } : p)));
  };

  // ---------------- SALVAR ESTADO EQUIPES ---------------
  const handleSalvarEstadoEquipes = async () => {
    marcarInteracao();
    try {
      await salvarEstadoEquipesAula(dia.dataIso, aula.id, jogadores, times);
      alert("Estado das equipes salvo com sucesso!");
      setPollVersion((prev) => (prev === null ? prev : prev + 1));
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar estado das equipes. Veja o console para detalhes.");
    }
  };

  // -------------------------------------------------
  // ------------------- RENDER ----------------------
  // -------------------------------------------------
  return (
    <main className="container py-3">
      <button className="btn btn-link p-0 mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
        ← Voltar para o dia
      </button>

      <h2 className="mb-1">
        Dia {tituloData} • {aula.turmaNome}
      </h2>
      <h1 className="h4 mb-1">
        Aula #{aula.numeroAulaNaTurma} – {aula.turmaNome}
      </h1>
      <p className="text-muted mb-4">
        {aula.horarioInicio} – {aula.horarioFim}
      </p>

      {pollError && (
        <div className="alert alert-warning py-2">
          {pollError}
        </div>
      )}

      <div className="row">
        {/* COLUNA ESQUERDA */}
        <section className="col-12 col-lg-4 mb-4">
          <h3 className="h5">Jogadores da turma</h3>

          {jogadores.length === 0 ? (
            <p className="text-muted">Nenhum jogador associado a esta turma ainda.</p>
          ) : (
            <>
              <div className="d-flex gap-2 mb-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success"
                  onClick={handleMarcarTodosSoTreino}
                >
                  Marcar todos como SÓ TREINOU
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleLimparStatus}
                >
                  Limpar status
                </button>
              </div>

              <input
                type="text"
                className="form-control form-control-sm mb-2"
                placeholder="Filtrar por nome..."
                value={filtroNome}
                onChange={handleFiltroChange}
              />

              <div className="border rounded p-2" style={{ maxHeight: 420, overflowY: "auto" }}>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Jogador</strong>
                  <small className="text-muted">Status</small>
                </div>

                {jogadoresFiltrados.map((j) => (
                  <LinhaJogador
                    key={j.jogadorId}
                    jogador={j}
                    onAlterarStatus={handleAlterarStatus}
                    onDragStart={onJogadorDragStart}
                  />
                ))}
              </div>

              <p className="mt-2 mb-0" style={{ fontSize: 12 }}>
                Jogadores em algum time são <strong>presentes em jogo</strong>. Para quem não
                entrar, selecione <em>Só treino</em>, <em>Faltou</em> ou <em>Atestado</em>.
              </p>
            </>
          )}
        </section>

        {/* COLUNA DIREITA */}
        <section className="col-12 col-lg-8">
          {/* Equipes */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="h5 mb-0">Equipes</h3>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-primary" onClick={handleAdicionarEquipe}>
                  + Adicionar equipe
                </button>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleLimparEquipes}>
                  Limpar equipes
                </button>
              </div>
            </div>

            <p className="text-muted" style={{ fontSize: 12 }}>
              Arraste jogadores da lista para montar os times. Para tirar alguém, clique no “x”.
            </p>

            {times.length === 0 ? (
              <p className="text-muted">
                Nenhuma equipe cadastrada. Clique em <strong>“Adicionar equipe”</strong>.
              </p>
            ) : (
              <div className="row g-2">
                {times.map((time) => {
                  const jogadoresTime = jogadoresPorTime(time.id);
                  return (
                    <div key={time.id} className="col-12 col-md-6">
                      <DropArea
                        titulo={time.nome}
                        descricao={
                          time.caracteristica ||
                          "Defina uma característica (ex.: mais experiente, mais leve, etc.)"
                        }
                        onDrop={(e) => onAreaDrop(e, time.id)}
                        onDragOver={onAreaDragOver}
                      >
                        <input
                          type="text"
                          className="form-control form-control-sm mb-2"
                          placeholder="Característica do time..."
                          value={time.caracteristica ?? ""}
                          onChange={(e) => handleChangeCaracteristica(time.id, e)}
                        />

                        <div className="d-flex flex-wrap gap-1">
                          {jogadoresTime.map((j) => (
                            <ChipJogador key={j.jogadorId} jogador={j} onRemover={handleRemoverDoTime} />
                          ))}

                          {jogadoresTime.length === 0 && (
                            <span className="text-muted" style={{ fontSize: 12 }}>
                              Arraste jogadores para cá
                            </span>
                          )}
                        </div>
                      </DropArea>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Partidas */}
          <div className="mb-4">
            <h3 className="h5">Partidas</h3>

            {times.length < 2 ? (
              <p className="text-muted">
                Para criar partidas, é necessário ter pelo menos <strong>2 equipes</strong>.
              </p>
            ) : (
              <>
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span>Nova partida:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: 160 }}
                    value={novoTimeAId}
                    onChange={(e) => setNovoTimeAId(e.target.value)}
                  >
                    <option value="">Time A</option>
                    {times.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>

                  <span>x</span>

                  <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: 160 }}
                    value={novoTimeBId}
                    onChange={(e) => setNovoTimeBId(e.target.value)}
                  >
                    <option value="">Time B</option>
                    {times.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>

                  <button type="button" className="btn btn-sm btn-success" onClick={handleAdicionarPartida}>
                    Adicionar partida
                  </button>

                  <small className="text-muted">Monte na ordem real (ex.: vencedor continua).</small>
                </div>

                {partidas.length === 0 ? (
                  <p className="text-muted">Nenhuma partida cadastrada ainda.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {partidas.map((p) => {
                      const timeA = times.find((t) => t.id === p.timeAId);
                      const timeB = times.find((t) => t.id === p.timeBId);

                      const jogadoresA = timeA ? jogadoresPorTime(timeA.id) : [];
                      const jogadoresB = timeB ? jogadoresPorTime(timeB.id) : [];

                      return (
                        <div key={p.id} className="border rounded p-2" style={{ fontSize: 13 }}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Partida {p.ordem}</strong>
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-danger p-0"
                              onClick={() => handleRemoverPartida(p.id)}
                            >
                              Remover
                            </button>
                          </div>

                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span>{timeA?.nome ?? "Time A"}</span>
                            <input
                              type="number"
                              min={0}
                              className="form-control form-control-sm"
                              style={{ width: 50 }}
                              value={p.golsTimeA}
                              onChange={(e) =>
                                handleAlterarPlacar(p.id, "golsTimeA", Number(e.target.value) || 0)
                              }
                            />
                            <span>x</span>
                            <input
                              type="number"
                              min={0}
                              className="form-control form-control-sm"
                              style={{ width: 50 }}
                              value={p.golsTimeB}
                              onChange={(e) =>
                                handleAlterarPlacar(p.id, "golsTimeB", Number(e.target.value) || 0)
                              }
                            />
                            <span>{timeB?.nome ?? "Time B"}</span>
                          </div>

                          <div className="row g-2">
                            <div className="col-12 col-md-6">
                              <TabelaSumulaTime
                                titulo={timeA?.nome ?? "Time A"}
                                partidaId={p.id}
                                jogadores={jogadoresA}
                                getStat={getStat}
                                onAlterarStat={handleAlterarStat}
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <TabelaSumulaTime
                                titulo={timeB?.nome ?? "Time B"}
                                partidaId={p.id}
                                jogadores={jogadoresB}
                                getStat={getStat}
                                onAlterarStat={handleAlterarStat}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-success" onClick={handleSalvarEstadoEquipes}>
              Salvar estado das equipes
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

// ---------------- COMPONENTES AUXILIARES ----------------

type LinhaJogadorProps = {
  jogador: PresencaJogadorDia;
  onAlterarStatus: (id: number, status: StatusPresenca) => void;
  onDragStart: (e: DragEvent<HTMLSpanElement>, id: number) => void;
};

function LinhaJogador({ jogador, onAlterarStatus, onDragStart }: LinhaJogadorProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onAlterarStatus(jogador.jogadorId, e.target.value as StatusPresenca);
  };

  return (
    <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
      <span
        draggable
        onDragStart={(e) => onDragStart(e, jogador.jogadorId)}
        style={{ cursor: "grab" }}
        title="Arraste o nome para uma equipe"
      >
        {jogador.nome}
      </span>

      <select
        className="form-select form-select-sm"
        style={{ maxWidth: 140 }}
        value={jogador.status}
        onChange={handleChange}
      >
        <option value="so_treino">Só treinou</option>
        <option value="faltou">Faltou</option>
        <option value="atestado">Atestado</option>
        <option value="presente">Presente</option>
        <option value="coringa">Coringa</option>
      </select>
    </div>
  );
}

type DropAreaProps = {
  titulo: string;
  descricao: string;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  children: ReactNode;
};

function DropArea({ titulo, descricao, onDrop, onDragOver, children }: DropAreaProps) {
  return (
    <div className="border rounded p-2 h-100" onDrop={onDrop} onDragOver={onDragOver}>
      <div className="d-flex flex-column mb-1">
        <strong>{titulo}</strong>
        <small className="text-muted">{descricao}</small>
      </div>
      {children}
    </div>
  );
}

type ChipJogadorProps = {
  jogador: PresencaJogadorDia;
  onRemover: (id: number) => void;
};

function ChipJogador({ jogador, onRemover }: ChipJogadorProps) {
  return (
    <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
      {jogador.nome}
      <button
        type="button"
        onClick={() => onRemover(jogador.jogadorId)}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 12,
          lineHeight: 1,
          color: "#ffffff",
        }}
      >
        ×
      </button>
    </span>
  );
}

type TabelaSumulaTimeProps = {
  titulo: string;
  partidaId: string;
  jogadores: PresencaJogadorDia[];
  getStat: (partidaId: string, jogadorId: number, campo: keyof StatsJogador) => number;
  onAlterarStat: (partidaId: string, jogadorId: number, campo: keyof StatsJogador, valor: number) => void;
};

function TabelaSumulaTime({ titulo, partidaId, jogadores, getStat, onAlterarStat }: TabelaSumulaTimeProps) {
  const campos: (keyof StatsJogador)[] = ["gols", "assistencias", "defesas", "chiliques", "faltas"];

  const labels: Record<keyof StatsJogador, string> = {
    gols: "G",
    assistencias: "A",
    defesas: "D",
    chiliques: "Ch",
    faltas: "F",
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, jogadorId: number, campo: keyof StatsJogador) => {
    const valor = Number(e.target.value) || 0;
    onAlterarStat(partidaId, jogadorId, campo, valor);
  };

  return (
    <div>
      <div className="d-flex justify-content-between mb-1">
        <strong>{titulo}</strong>
      </div>

      {jogadores.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 12 }}>
          Nenhum jogador neste time.
        </p>
      ) : (
        <table className="table table-sm mb-1 align-middle">
          <thead>
            <tr>
              <th style={{ fontSize: 11 }}>Jogador</th>
              {campos.map((c) => (
                <th key={c} className="text-center" style={{ width: 40, fontSize: 11 }}>
                  {labels[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jogadores.map((j) => (
              <tr key={j.jogadorId}>
                <td style={{ fontSize: 11 }}>{j.nome}</td>
                {campos.map((c) => (
                  <td key={c} className="text-center">
                    <input
                      type="number"
                      min={0}
                      className="form-control form-control-sm"
                      style={{ width: 40, fontSize: 10, textAlign: "center" }}
                      value={getStat(partidaId, j.jogadorId, c)}
                      onChange={(e) => handleChange(e, j.jogadorId, c)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
