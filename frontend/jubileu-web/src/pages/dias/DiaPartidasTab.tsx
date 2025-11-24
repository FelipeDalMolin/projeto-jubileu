import { useState } from "react";
import type {
  EquipeDia,
  JogadorDia,
  PartidaDia,
  EstatisticaJogadorPartida,
} from "../../types/dia";

// Mocks locais (por enquanto independentes da aba Equipes)
const MOCK_EQUIPES: EquipeDia[] = [
  { id: 1, nome: "Time Azul", corCamisa: "Azul" },
  { id: 2, nome: "Time Laranja", corCamisa: "Laranja" },
];

const MOCK_JOGADORES: JogadorDia[] = [
  { id: 1, nome: "João", apelido: "Joãozinho", status: "presente", equipeId: 1 },
  { id: 2, nome: "Pedro", status: "presente", equipeId: 1 },
  { id: 3, nome: "Carlos", status: "coringa", equipeId: 1 },
  { id: 4, nome: "Lucas", status: "presente", equipeId: 2 },
  { id: 5, nome: "Matheus", status: "so_treinou", equipeId: 2 },
];

const MOCK_PARTIDAS: PartidaDia[] = [
  {
    id: 1,
    equipeA: 1,
    equipeB: 2,
    statsJogadores: [
      { jogadorId: 1, gols: 1, chiliques: 0 },
      { jogadorId: 2, gols: 1, chiliques: 0 },
      { jogadorId: 4, gols: 1, chiliques: 0 },
    ],
  },
];

function nomeEquipe(equipes: EquipeDia[], id: number) {
  return equipes.find((e) => e.id === id)?.nome ?? `Equipe ${id}`;
}

function nomeJogador(jogadores: JogadorDia[], id: number) {
  const j = jogadores.find((jg) => jg.id === id);
  if (!j) return `Jogador ${id}`;
  return j.apelido ? `${j.nome} (${j.apelido})` : j.nome;
}

function pegarStat(
  partida: PartidaDia,
  jogadorId: number
): EstatisticaJogadorPartida {
  const statExistente = partida.statsJogadores.find(
    (s) => s.jogadorId === jogadorId
  );
  if (statExistente) return statExistente;
  return { jogadorId, gols: 0, chiliques: 0 };
}

function calcularPlacar(
  partida: PartidaDia,
  jogadores: JogadorDia[]
): { golsA: number; golsB: number } {
  let golsA = 0;
  let golsB = 0;

  partida.statsJogadores.forEach((stat) => {
    const jogador = jogadores.find((j) => j.id === stat.jogadorId);
    if (!jogador || !jogador.equipeId) return;

    if (jogador.equipeId === partida.equipeA) golsA += stat.gols;
    else if (jogador.equipeId === partida.equipeB) golsB += stat.gols;
  });

  return { golsA, golsB };
}

export default function DiaPartidasTab() {
  const [equipes] = useState<EquipeDia[]>(MOCK_EQUIPES);
  const [jogadores] = useState<JogadorDia[]>(MOCK_JOGADORES);
  const [partidas, setPartidas] = useState<PartidaDia[]>(MOCK_PARTIDAS);

  function jogadoresDaEquipe(equipeId: number) {
    return jogadores.filter((j) => j.equipeId === equipeId);
  }

  function criarPartida() {
    if (equipes.length < 2) {
      alert("É necessário pelo menos 2 equipes para criar uma partida.");
      return;
    }

    const nova: PartidaDia = {
      id: Date.now(),
      equipeA: equipes[0].id,
      equipeB: equipes[1].id,
      statsJogadores: [],
    };

    setPartidas((prev) => [...prev, nova]);
  }

  function removerPartida(id: number) {
    if (!confirm("Remover esta partida?")) return;
    setPartidas((prev) => prev.filter((p) => p.id !== id));
  }

  function atualizarStatJogador(
    idPartida: number,
    jogadorId: number,
    campo: "gols" | "chiliques",
    valor: number
  ) {
    const valorNormalizado = Math.max(0, Math.floor(valor) || 0);

    setPartidas((prev) =>
      prev.map((p) => {
        if (p.id !== idPartida) return p;

        const jaExiste = p.statsJogadores.some(
          (s) => s.jogadorId === jogadorId
        );

        let novasStats: EstatisticaJogadorPartida[];

        if (jaExiste) {
          novasStats = p.statsJogadores.map((s) => {
            if (s.jogadorId !== jogadorId) return s;
            return {
              ...s,
              [campo]: valorNormalizado,
            };
          });
        } else {
          novasStats = [
            ...p.statsJogadores,
            {
              jogadorId,
              gols: campo === "gols" ? valorNormalizado : 0,
              chiliques: campo === "chiliques" ? valorNormalizado : 0,
            },
          ];
        }

        // remove entradas 0/0 (opcional)
        novasStats = novasStats.filter(
          (s) => s.gols > 0 || s.chiliques > 0
        );

        return { ...p, statsJogadores: novasStats };
      })
    );
  }

  return (
    <div>
      <button onClick={criarPartida}>+ Nova partida</button>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {partidas.map((p) => {
          const equipeA = equipes.find((e) => e.id === p.equipeA);
          const equipeB = equipes.find((e) => e.id === p.equipeB);
          const jogadoresA = jogadoresDaEquipe(p.equipeA);
          const jogadoresB = jogadoresDaEquipe(p.equipeB);

          const { golsA, golsB } = calcularPlacar(p, jogadores);

          return (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
              }}
            >
              {/* Cabeçalho: placar calculado automaticamente */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div>
                    <strong>{equipeA?.nome}</strong>
                    <div style={{ fontSize: 11, color: "#666" }}>Time A</div>
                  </div>

                  <div style={{ fontSize: 18, fontWeight: "bold" }}>
                    {golsA} <span style={{ fontSize: 16 }}>x</span> {golsB}
                  </div>

                  <div>
                    <strong>{equipeB?.nome}</strong>
                    <div style={{ fontSize: 11, color: "#666" }}>Time B</div>
                  </div>
                </div>

                <button
                  style={{ color: "red", fontSize: 12 }}
                  onClick={() => removerPartida(p.id)}
                >
                  Remover partida
                </button>
              </div>

              {/* Tabelas de jogadores por time */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {/* Time A */}
                <div>
                  <h4 style={{ margin: "4px 0", fontSize: 13 }}>
                    {equipeA?.nome}
                  </h4>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 4,
                          }}
                        >
                          Jogador
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 4,
                            width: 60,
                          }}
                        >
                          Gols
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 4,
                            width: 80,
                          }}
                        >
                          Chiliques
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {jogadoresA.map((j) => {
                        const stat = pegarStat(p, j.id);
                        return (
                          <tr key={j.id}>
                            <td
                              style={{
                                padding: "4px 2px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {nomeJogador(jogadores, j.id)}
                            </td>
                            <td
                              style={{
                                padding: "4px 2px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                              }}
                            >
                              <input
                                type="number"
                                min={0}
                                value={stat.gols}
                                onChange={(e) =>
                                  atualizarStatJogador(
                                    p.id,
                                    j.id,
                                    "gols",
                                    Number(e.target.value)
                                  )
                                }
                                style={{ width: 40, textAlign: "center" }}
                              />
                            </td>
                            <td
                              style={{
                                padding: "4px 2px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                              }}
                            >
                              <input
                                type="number"
                                min={0}
                                value={stat.chiliques}
                                onChange={(e) =>
                                  atualizarStatJogador(
                                    p.id,
                                    j.id,
                                    "chiliques",
                                    Number(e.target.value)
                                  )
                                }
                                style={{ width: 40, textAlign: "center" }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Time B */}
                <div>
                  <h4 style={{ margin: "4px 0", fontSize: 13 }}>
                    {equipeB?.nome}
                  </h4>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 4,
                          }}
                        >
                          Jogador
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 4,
                            width: 60,
                          }}
                        >
                          Gols
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 4,
                            width: 80,
                          }}
                        >
                          Chiliques
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {jogadoresB.map((j) => {
                        const stat = pegarStat(p, j.id);
                        return (
                          <tr key={j.id}>
                            <td
                              style={{
                                padding: "4px 2px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {nomeJogador(jogadores, j.id)}
                            </td>
                            <td
                              style={{
                                padding: "4px 2px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                              }}
                            >
                              <input
                                type="number"
                                min={0}
                                value={stat.gols}
                                onChange={(e) =>
                                  atualizarStatJogador(
                                    p.id,
                                    j.id,
                                    "gols",
                                    Number(e.target.value)
                                  )
                                }
                                style={{ width: 40, textAlign: "center" }}
                              />
                            </td>
                            <td
                              style={{
                                padding: "4px 2px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                              }}
                            >
                              <input
                                type="number"
                                min={0}
                                value={stat.chiliques}
                                onChange={(e) =>
                                  atualizarStatJogador(
                                    p.id,
                                    j.id,
                                    "chiliques",
                                    Number(e.target.value)
                                  )
                                }
                                style={{ width: 40, textAlign: "center" }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
