// src/pages/dias/AulaPage.tsx
import {
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obterDiaPorData } from "../../services/diasService";
import type {
  AulaDia,
  Dia,
  PresencaJogadorDia,
  TimeDia,
  StatusPresenca,
} from "../../types/dia";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function AulaPage() {
  const { dataIso, aulaId } = useParams<{ dataIso: string; aulaId: string }>();
  const navigate = useNavigate();

  const [dia, setDia] = useState<Dia | null>(null);
  const [aula, setAula] = useState<AulaDia | null>(null);
  const [loading, setLoading] = useState(true);

  const [jogadores, setJogadores] = useState<PresencaJogadorDia[]>([]);
  const [times, setTimes] = useState<TimeAula[]>([]);
  const [partidas, setPartidas] = useState<PartidaAula[]>([]);
  const [stats, setStats] = useState<StatsPartidas>({});

  const [filtroNome, setFiltroNome] = useState("");

  // seleção para criar nova partida
  const [novoTimeAId, setNovoTimeAId] = useState<string>("");
  const [novoTimeBId, setNovoTimeBId] = useState<string>("");

  useEffect(() => {
    if (!dataIso || !aulaId) return;
    setLoading(true);
    obterDiaPorData(dataIso)
      .then((result) => {
        setDia(result);
        if (result) {
          const a = result.aulas.find((x) => x.id === aulaId) ?? null;
          setAula(a);

          if (a) {
            setJogadores(a.jogadores ?? []);
            const ts: TimeAula[] = (a.times ?? []).map((t) => ({ ...t }));
            setTimes(ts);
            setPartidas([]);
            setStats({});
          }
        }
      })
      .finally(() => setLoading(false));
  }, [dataIso, aulaId]);

  if (!dataIso || !aulaId) {
    return <div style={{ padding: 24 }}>Parâmetros inválidos.</div>;
  }

  const dataObj = parseISO(dataIso);
  const tituloData = format(dataObj, "dd/MM/yyyy", { locale: ptBR });

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate(`/dias/${dataIso}`)}>&larr; Voltar</button>
        <h1>Aula</h1>
        <p>Carregando dados da aula...</p>
      </div>
    );
  }

  if (!dia || !aula) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate(`/dias/${dataIso}`)}>&larr; Voltar</button>
        <h1>Aula não encontrada</h1>
        <p>
          Não foi possível localizar a aula selecionada para o dia {tituloData}.
        </p>
      </div>
    );
  }

  // ---------------- PRESENÇA / FILTRO ----------------

  const handleFiltroChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiltroNome(e.target.value);
  };

  const handleAlterarStatus = (
    jogadorId: number,
    novoStatus: StatusPresenca
  ) => {
    setJogadores((prev) =>
      prev.map((j) =>
        j.jogadorId === jogadorId ? { ...j, status: novoStatus } : j
      )
    );
  };

  const handleMarcarTodosSoTreino = () => {
    // atalho: todo mundo veio, só treinou (sem jogo)
    setJogadores((prev) =>
      prev.map((j) => ({
        ...j,
        status: "so_treino",
      }))
    );
  };

  const handleLimparStatus = () => {
    // zera para "so_treino" também
    setJogadores((prev) =>
      prev.map((j) => ({
        ...j,
        status: "so_treino",
      }))
    );
  };

  const jogadoresSemTimeLista = jogadores.filter((j) => !j.timeId);

  const jogadoresFiltrados = filtroNome
    ? jogadoresSemTimeLista.filter((j) =>
        j.nome.toLowerCase().includes(filtroNome.toLowerCase())
      )
    : jogadoresSemTimeLista;

  // --------------- EQUIPES / DRAG & DROP -------------

  const handleAdicionarEquipe = () => {
    setTimes((prev) => {
      const idx = prev.length + 1;
      const novo: TimeAula = {
        id: `time-${idx}`,
        nome: `Time ${idx}`,
        jogadoresIds: [],
        caracteristica: "",
      };
      return [...prev, novo];
    });
  };

  const handleLimparEquipes = () => {
    setTimes([]);
    setPartidas([]);
    setStats({});
    setJogadores((prev) =>
      prev.map((j) => ({
        ...j,
        timeId: undefined,
      }))
    );
  };

  const moverJogadorParaTime = (jogadorId: number, timeId: string | null) => {
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
        j.jogadorId === jogadorId ? { ...j, timeId: timeId || undefined } : j
      )
    );
  };

  const onJogadorDragStart = (
    e: DragEvent<HTMLElement>,
    jogadorId: number
  ) => {
    e.dataTransfer.setData("text/plain", String(jogadorId));
  };

  const onAreaDrop = (
    e: DragEvent<HTMLDivElement>,
    destinoTimeId: string
  ) => {
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

  const jogadoresPorTime = (timeId: string) =>
    jogadores.filter((j) => j.timeId === timeId);

  const handleChangeCaracteristica = (
    timeId: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setTimes((prev) =>
      prev.map((t) =>
        t.id === timeId ? { ...t, caracteristica: value } : t
      )
    );
  };

  const handleRemoverDoTime = (jogadorId: number) => {
    moverJogadorParaTime(jogadorId, null);
  };

  // ---------------- PARTIDAS / SÚMULA ---------------

  const handleAdicionarPartida = () => {
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
    valor: number
  ) => {
    setStats((prev) => {
      const statsPartida = prev[partidaId] ?? {};
      const statsJogador: StatsJogador =
        statsPartida[jogadorId] ?? {
          gols: 0,
          assistencias: 0,
          defesas: 0,
          chiliques: 0,
          faltas: 0,
        };

      const atualizado: StatsJogador = {
        ...statsJogador,
        [campo]: valor,
      };

      return {
        ...prev,
        [partidaId]: {
          ...statsPartida,
          [jogadorId]: atualizado,
        },
      };
    });
  };

  const getStat = (
    partidaId: string,
    jogadorId: number,
    campo: keyof StatsJogador
  ): number => {
    return stats[partidaId]?.[jogadorId]?.[campo] ?? 0;
  };

  const handleAlterarPlacar = (
    partidaId: string,
    campo: "golsTimeA" | "golsTimeB",
    valor: number
  ) => {
    setPartidas((prev) =>
      prev.map((p) =>
        p.id === partidaId ? { ...p, [campo]: valor } : p
      )
    );
  };

  // (mock) salvar tudo – aqui depois entra chamada de API
  const handleSalvarAula = () => {
    const payload = {
      diaDataIso: dia?.dataIso ?? dataIso,
      aulaId: aula.id,
      jogadores,
      times,
      partidas,
      stats,
    };
    // por enquanto só loga; depois vira POST pra API
    // eslint-disable-next-line no-console
    console.log("SALVAR AULA (mock):", payload);
    alert("Dados da aula registrados em memória (ver console).");
  };

  // -------------------------------------------------

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate(`/dias/${dataIso}`)}>
        &larr; Voltar para o dia
      </button>

      <header style={{ marginTop: 12, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#555" }}>
          Dia {tituloData} &bull; {aula.turmaNome}
        </div>
        <h1 style={{ margin: 0 }}>
          Aula #{aula.numeroAulaNaTurma} – {aula.turmaNome}
        </h1>
        <div style={{ fontSize: 13, color: "#555" }}>
          {aula.horarioInicio} – {aula.horarioFim}
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) minmax(360px, 1fr)",
          gap: 24,
        }}
      >
        {/* COLUNA ESQUERDA: lista + status + drag start */}
        <section
          style={{
            borderRadius: 12,
            border: "1px solid #dde1e7",
            padding: 16,
            background: "#fff",
            maxHeight: "70vh",
            overflow: "auto",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Jogadores da turma</h2>

          {jogadores.length === 0 ? (
            <p style={{ color: "#555" }}>
              Nenhum jogador associado a esta turma ainda.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={handleMarcarTodosSoTreino}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Marcar todos como SÓ TREINOU
                </button>
                <button
                  onClick={handleLimparStatus}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Limpar status
                </button>

                <input
                  type="text"
                  placeholder="Filtrar por nome..."
                  value={filtroNome}
                  onChange={handleFiltroChange}
                  style={{
                    marginLeft: "auto",
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    minWidth: 140,
                  }}
                />
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 6px",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Jogador
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 6px",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Status (não jogou)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jogadoresFiltrados.map((j) => (
                    <LinhaJogador
                      key={j.jogadorId}
                      jogador={j}
                      onAlterarStatus={handleAlterarStatus}
                      onDragStart={onJogadorDragStart}
                    />
                  ))}
                </tbody>
              </table>

              <p
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "#64748b",
                }}
              >
                Jogadores que estiverem em algum time são considerados{" "}
                <strong>presentes em jogo</strong>. Para quem não entrar em
                campo, selecione se foi <strong>Só treino</strong>,{" "}
                <strong>Faltou</strong> ou <strong>Atestado</strong>.
              </p>
            </>
          )}
        </section>

        {/* COLUNA DIREITA: equipes + partidas */}
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Equipes */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #dde1e7",
              padding: 16,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: 16 }}>Equipes</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleAdicionarEquipe}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid #22c55e",
                    background: "#dcfce7",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  + Adicionar equipe
                </button>
                <button
                  onClick={handleLimparEquipes}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Limpar equipes
                </button>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
              Arraste o nome do jogador a partir da lista à esquerda para as
              colunas abaixo para montar os times. Para tirar alguém de um time,
              clique no <strong>“x”</strong> no chip do jogador.
            </p>

            {times.length === 0 ? (
              <p style={{ fontSize: 13, color: "#555" }}>
                Nenhuma equipe cadastrada. Clique em{" "}
                <strong>“Adicionar equipe”</strong> para começar.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${times.length}, minmax(160px, 1fr))`,
                  gap: 12,
                }}
              >
                {times.map((time) => {
                  const jogadoresTime = jogadoresPorTime(time.id);
                  return (
                    <DropArea
                      key={time.id}
                      titulo={time.nome}
                      descricao={`${jogadoresTime.length} jogador(es)`}
                      onDrop={(e) => onAreaDrop(e, time.id)}
                      onDragOver={onAreaDragOver}
                    >
                      <input
                        type="text"
                        placeholder="Característica (ex.: camisa azul, equilibrado...)"
                        value={time.caracteristica ?? ""}
                        onChange={(e) => handleChangeCaracteristica(time.id, e)}
                        style={{
                          width: "100%",
                          fontSize: 11,
                          marginBottom: 6,
                          padding: "3px 6px",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      {jogadoresTime.map((j) => (
                        <ChipJogador
                          key={j.jogadorId}
                          jogador={j}
                          onRemover={handleRemoverDoTime}
                        />
                      ))}
                    </DropArea>
                  );
                })}
              </div>
            )}
          </div>

          {/* Partidas + súmula */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #dde1e7",
              padding: 16,
              background: "#fff",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 16 }}>Partidas</h2>

            {times.length < 2 ? (
              <p style={{ fontSize: 13, color: "#555" }}>
                Para criar partidas, é necessário ter pelo menos{" "}
                <strong>2 equipes</strong>.
              </p>
            ) : (
              <>
                {/* Formulário para adicionar partida */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 12 }}>Nova partida:</span>
                  <select
                    value={novoTimeAId}
                    onChange={(e) => setNovoTimeAId(e.target.value)}
                    style={{
                      fontSize: 12,
                      borderRadius: 999,
                      border: "1px solid #e2e8f0",
                      padding: "2px 6px",
                    }}
                  >
                    <option value="">Time A</option>
                    {times.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 12 }}>x</span>
                  <select
                    value={novoTimeBId}
                    onChange={(e) => setNovoTimeBId(e.target.value)}
                    style={{
                      fontSize: 12,
                      borderRadius: 999,
                      border: "1px solid #e2e8f0",
                      padding: "2px 6px",
                    }}
                  >
                    <option value="">Time B</option>
                    {times.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAdicionarPartida}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: "1px solid #2563eb",
                      background: "#dbeafe",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Adicionar partida
                  </button>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    Monte na ordem real (ex.: vencedor continua).
                  </span>
                </div>

                {partidas.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#555" }}>
                    Nenhuma partida cadastrada ainda.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {partidas.map((p) => {
                      const timeA = times.find((t) => t.id === p.timeAId);
                      const timeB = times.find((t) => t.id === p.timeBId);
                      const jogadoresA = timeA
                        ? jogadoresPorTime(timeA.id)
                        : [];
                      const jogadoresB = timeB
                        ? jogadoresPorTime(timeB.id)
                        : [];

                      return (
                        <div
                          key={p.id}
                          style={{
                            borderRadius: 8,
                            border: "1px solid #e2e8f0",
                            padding: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 6,
                              fontSize: 13,
                              gap: 8,
                            }}
                          >
                            <span>Partida {p.ordem}</span>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <strong>{timeA?.nome ?? "Time A"}</strong>
                              <input
                                type="number"
                                min={0}
                                value={p.golsTimeA}
                                onChange={(e) =>
                                  handleAlterarPlacar(
                                    p.id,
                                    "golsTimeA",
                                    Number(e.target.value) || 0
                                  )
                                }
                                style={{
                                  width: 36,
                                  fontSize: 12,
                                  textAlign: "center",
                                  borderRadius: 4,
                                  border: "1px solid #e2e8f0",
                                }}
                              />
                              <span>x</span>
                              <input
                                type="number"
                                min={0}
                                value={p.golsTimeB}
                                onChange={(e) =>
                                  handleAlterarPlacar(
                                    p.id,
                                    "golsTimeB",
                                    Number(e.target.value) || 0
                                  )
                                }
                                style={{
                                  width: 36,
                                  fontSize: 12,
                                  textAlign: "center",
                                  borderRadius: 4,
                                  border: "1px solid #e2e8f0",
                                }}
                              />
                              <strong>{timeB?.nome ?? "Time B"}</strong>
                            </div>
                            <button
                              onClick={() => handleRemoverPartida(p.id)}
                              style={{
                                fontSize: 11,
                                border: "none",
                                background: "transparent",
                                color: "#ef4444",
                                cursor: "pointer",
                              }}
                            >
                              Remover
                            </button>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 8,
                              fontSize: 11,
                            }}
                          >
                            <TabelaSumulaTime
                              titulo={timeA?.nome ?? "Time A"}
                              partidaId={p.id}
                              jogadores={jogadoresA}
                              getStat={getStat}
                              onAlterarStat={handleAlterarStat}
                            />
                            <TabelaSumulaTime
                              titulo={timeB?.nome ?? "Time B"}
                              partidaId={p.id}
                              jogadores={jogadoresB}
                              getStat={getStat}
                              onAlterarStat={handleAlterarStat}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button
                onClick={handleSalvarAula}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid #16a34a",
                  background: "#22c55e",
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Salvar aula / partidas (mock)
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------- COMPONENTES AUXILIARES ----------------

type LinhaJogadorProps = {
  jogador: PresencaJogadorDia;
  onAlterarStatus: (id: number, status: StatusPresenca) => void;
  onDragStart: (e: DragEvent<HTMLElement>, id: number) => void;
};

function LinhaJogador({
  jogador,
  onAlterarStatus,
  onDragStart,
}: LinhaJogadorProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onAlterarStatus(jogador.jogadorId, e.target.value as StatusPresenca);
  };

  return (
    <tr
      draggable
      onDragStart={(e) => onDragStart(e, jogador.jogadorId)}
      style={{ cursor: "grab" }}
      title="Arraste o nome para uma equipe"
    >
      <td
        style={{
          padding: "4px 6px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        {jogador.nome}
      </td>
      <td
        style={{
          padding: "4px 6px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <select
          value={jogador.status}
          onChange={handleChange}
          style={{
            fontSize: 12,
            borderRadius: 999,
            border: "1px solid #e2e8f0",
            padding: "2px 6px",
          }}
        >
          <option value="so_treino">Só treinou</option>
          <option value="faltou">Faltou</option>
          <option value="atestado">Atestado</option>
        </select>
      </td>
    </tr>
  );
}

type DropAreaProps = {
  titulo: string;
  descricao: string;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  children: ReactNode;
};

function DropArea({
  titulo,
  descricao,
  onDrop,
  onDragOver,
  children,
}: DropAreaProps) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      style={{
        borderRadius: 10,
        border: "1px dashed #cbd5f5",
        padding: 8,
        minHeight: 140,
        background: "#f9fafb",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13 }}>{titulo}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
        {descricao}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

type ChipJogadorProps = {
  jogador: PresencaJogadorDia;
  onRemover: (id: number) => void;
};

function ChipJogador({ jogador, onRemover }: ChipJogadorProps) {
  return (
    <div
      style={{
        padding: "4px 6px",
        borderRadius: 999,
        border: "1px solid #cbd5e1",
        background: "#fff",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
      }}
      title={jogador.nome}
    >
      <span>{jogador.nome}</span>
      <button
        onClick={() => onRemover(jogador.jogadorId)}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 12,
          lineHeight: 1,
          color: "#ef4444",
        }}
      >
        ×
      </button>
    </div>
  );
}

type TabelaSumulaTimeProps = {
  titulo: string;
  partidaId: string;
  jogadores: PresencaJogadorDia[];
  getStat: (
    partidaId: string,
    jogadorId: number,
    campo: keyof StatsJogador
  ) => number;
  onAlterarStat: (
    partidaId: string,
    jogadorId: number,
    campo: keyof StatsJogador,
    valor: number
  ) => void;
};

function TabelaSumulaTime({
  titulo,
  partidaId,
  jogadores,
  getStat,
  onAlterarStat,
}: TabelaSumulaTimeProps) {
  const campos: (keyof StatsJogador)[] = [
    "gols",
    "assistencias",
    "defesas",
    "chiliques",
    "faltas",
  ];

  const labels: Record<keyof StatsJogador, string> = {
    gols: "G",
    assistencias: "A",
    defesas: "D",
    chiliques: "Ch",
    faltas: "F",
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    jogadorId: number,
    campo: keyof StatsJogador
  ) => {
    const valor = Number(e.target.value) || 0;
    onAlterarStat(partidaId, jogadorId, campo, valor);
  };

  return (
    <div>
      <div
        style={{
          fontWeight: 600,
          marginBottom: 4,
          fontSize: 12,
        }}
      >
        {titulo}
      </div>
      {jogadores.length === 0 ? (
        <div style={{ fontSize: 11, color: "#64748b" }}>
          Nenhum jogador neste time.
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 11,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "2px 4px",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Jogador
              </th>
              {campos.map((c) => (
                <th
                  key={c}
                  style={{
                    textAlign: "center",
                    padding: "2px 3px",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  {labels[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jogadores.map((j) => (
              <tr key={j.jogadorId}>
                <td
                  style={{
                    padding: "2px 4px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  {j.nome}
                </td>
                {campos.map((c) => (
                  <td
                    key={c}
                    style={{
                      padding: "1px 2px",
                      textAlign: "center",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <input
                      type="number"
                      min={0}
                      value={getStat(partidaId, j.jogadorId, c)}
                      onChange={(e) => handleChange(e, j.jogadorId, c)}
                      style={{
                        width: 32,
                        fontSize: 10,
                        borderRadius: 4,
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                      }}
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
