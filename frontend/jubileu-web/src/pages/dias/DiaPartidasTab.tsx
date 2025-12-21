import { useEffect, useMemo, useState } from "react";
import type {
  AulaDia,
  EstatisticaJogadorPartida,
  PartidaAula,
  PresencaJogadorDia,
  TimeDia,
} from "../../types/dia";
import {
  listarPartidas,
  criarPartida,
  atualizarPartida,
  deletarPartida,
} from "../../services/partidasService";

type Props = {
  dataIso: string;
  aula: AulaDia;
  jogadores: PresencaJogadorDia[];
  times: TimeDia[];
};

type CampoStat = keyof Pick<
  EstatisticaJogadorPartida,
  "gols" | "assistencias" | "defesas" | "chiliques" | "faltas"
>;

function calcularPlacar(
  partida: PartidaAula,
  jogadores: PresencaJogadorDia[],
) {
  let golsA = 0;
  let golsB = 0;

  for (const estat of partida.estatisticas) {
    const jogador = jogadores.find(
      (j) => j.jogadorId === estat.jogadorAulaId,
    );
    if (!jogador || !jogador.timeId) continue;
    if (jogador.timeId === partida.timeAId) {
      golsA += estat.gols;
    } else if (jogador.timeId === partida.timeBId) {
      golsB += estat.gols;
    }
  }

  return { golsA, golsB };
}

function normalizarStat(valor: number) {
  return Math.max(0, Math.floor(Number(valor) || 0));
}

export default function DiaPartidasTab({
  dataIso,
  aula,
  jogadores,
  times,
}: Props) {
  const [partidas, setPartidas] = useState<PartidaAula[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const timesPorId = useMemo(
    () => Object.fromEntries(times.map((t) => [t.id, t])),
    [times],
  );

  useEffect(() => {
    let ativo = true;
    setCarregando(true);

    listarPartidas(dataIso, aula.id)
      .then((lista) => {
        if (!ativo) return;
        setPartidas(lista);
      })
      .catch((err) => {
        console.error(err);
        if (ativo) setPartidas([]);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [dataIso, aula.id]);

  const jogadoresPorTime = useMemo(() => {
    const map: Record<string, PresencaJogadorDia[]> = {};
    for (const j of jogadores) {
      if (!j.timeId) continue;
      if (!map[j.timeId]) map[j.timeId] = [];
      map[j.timeId].push(j);
    }
    return map;
  }, [jogadores]);

  async function handleCriarPartida() {
    if (times.length < 2) {
      alert("Crie pelo menos 2 times para registrar partidas.");
      return;
    }

    const timeA = times[0];
    const timeB = times[1];

    try {
      setSalvando(true);
      const nova = await criarPartida(dataIso, aula.id, {
        timeAId: timeA.id,
        timeBId: timeB.id,
        estatisticas: [],
      });
      setPartidas((prev) => [...prev, nova]);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Erro ao criar partida.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemoverPartida(id: number) {
    const confirmar = window.confirm("Remover esta partida?");
    if (!confirmar) return;
    const anterior = [...partidas];
    setPartidas((prev) => prev.filter((p) => p.id !== id));

    try {
      await deletarPartida(dataIso, aula.id, String(id));
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Erro ao remover partida.");
      setPartidas(anterior);
    }
  }

  async function persistirPartida(partida: PartidaAula) {
    setSalvando(true);
    try {
      const atualizada = await atualizarPartida(
        dataIso,
        aula.id,
        String(partida.id),
        {
          ordem: partida.ordem,
          timeAId: partida.timeAId,
          timeBId: partida.timeBId,
          estatisticas: partida.estatisticas,
        },
      );

      setPartidas((prev) =>
        prev.map((p) => (p.id === partida.id ? atualizada : p)),
      );
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Erro ao salvar estatisticas da partida.");
    } finally {
      setSalvando(false);
    }
  }

  const handleAlterarStat = (
    partidaId: number,
    jogadorId: number,
    campo: CampoStat,
    valor: number,
  ) => {
    const novoValor = normalizarStat(valor);
    let partidaAtualizada: PartidaAula | null = null;

    setPartidas((prev) =>
      prev.map((p) => {
        if (p.id !== partidaId) return p;
        const statExistente = p.estatisticas.find(
          (s) => s.jogadorAulaId === jogadorId,
        );

        let novasStats: EstatisticaJogadorPartida[];
        if (statExistente) {
          novasStats = p.estatisticas.map((s) =>
            s.jogadorAulaId === jogadorId ? { ...s, [campo]: novoValor } : s,
          );
        } else {
          novasStats = [
            ...p.estatisticas,
            {
              jogadorAulaId: jogadorId,
              gols: 0,
              assistencias: 0,
              defesas: 0,
              chiliques: 0,
              faltas: 0,
              [campo]: novoValor,
            },
          ];
        }

        partidaAtualizada = { ...p, estatisticas: novasStats };
        return partidaAtualizada;
      }),
    );

    if (partidaAtualizada) {
      void persistirPartida(partidaAtualizada);
    }
  };

  if (carregando) {
    return <p>Carregando partidas...</p>;
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button
          className="btn btn-primary"
          onClick={handleCriarPartida}
          disabled={salvando}
        >
          + Nova partida
        </button>
        {salvando && <span className="text-muted">Salvando...</span>}
      </div>

      {partidas.length === 0 ? (
        <p className="text-muted">Nenhuma partida cadastrada.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {partidas.map((p) => {
            const jogadoresA = jogadoresPorTime[p.timeAId] ?? [];
            const jogadoresB = jogadoresPorTime[p.timeBId] ?? [];
            const placar = calcularPlacar(p, jogadores);
            const timeA = timesPorId[p.timeAId];
            const timeB = timesPorId[p.timeBId];

            return (
              <div key={p.id} className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <strong>{timeA?.nome ?? "Time A"}</strong>
                      <span>
                        {placar.golsA} <span className="text-muted">x</span>{" "}
                        {placar.golsB}
                      </span>
                      <strong>{timeB?.nome ?? "Time B"}</strong>
                    </div>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleRemoverPartida(p.id)}
                      disabled={salvando}
                    >
                      Remover
                    </button>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <TabelaSumulaTime
                        titulo={timeA?.nome ?? "Time A"}
                        partidaId={p.id}
                        jogadores={jogadoresA}
                        getStat={(partidaId, jogadorId, campo) => {
                          const partida = partidas.find(
                            (pp) => pp.id === partidaId,
                          );
                          const stat = partida?.estatisticas.find(
                            (s) => s.jogadorAulaId === jogadorId,
                          );
                          return stat ? stat[campo] : 0;
                        }}
                        onAlterarStat={handleAlterarStat}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <TabelaSumulaTime
                        titulo={timeB?.nome ?? "Time B"}
                        partidaId={p.id}
                        jogadores={jogadoresB}
                        getStat={(partidaId, jogadorId, campo) => {
                          const partida = partidas.find(
                            (pp) => pp.id === partidaId,
                          );
                          const stat = partida?.estatisticas.find(
                            (s) => s.jogadorAulaId === jogadorId,
                          );
                          return stat ? stat[campo] : 0;
                        }}
                        onAlterarStat={handleAlterarStat}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type TabelaProps = {
  titulo: string;
  partidaId: number;
  jogadores: PresencaJogadorDia[];
  getStat: (
    partidaId: number,
    jogadorId: number,
    campo: CampoStat,
  ) => number;
  onAlterarStat: (
    partidaId: number,
    jogadorId: number,
    campo: CampoStat,
    valor: number,
  ) => void;
};

function TabelaSumulaTime({
  titulo,
  partidaId,
  jogadores,
  getStat,
  onAlterarStat,
}: TabelaProps) {
  const campos: CampoStat[] = [
    "gols",
    "assistencias",
    "defesas",
    "chiliques",
    "faltas",
  ];

  const labels: Record<CampoStat, string> = {
    gols: "G",
    assistencias: "A",
    defesas: "D",
    chiliques: "Ch",
    faltas: "F",
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
                <th
                  key={c}
                  className="text-center"
                  style={{ width: 40, fontSize: 11 }}
                >
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
                      onChange={(e) =>
                        onAlterarStat(
                          partidaId,
                          j.jogadorId,
                          c,
                          Number(e.target.value),
                        )
                      }
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
