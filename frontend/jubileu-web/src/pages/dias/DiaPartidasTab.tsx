import { useMemo, useState } from "react";
import type {
  AulaDia,
  EstatisticaJogadorPartida,
  PresencaJogadorDia,
  TimeDia,
} from "../../types/dia";
import type { PartidaEstado } from "../../types/aulaEstado";
import {
  criarPartida,
  atualizarPartida,
  deletarPartida,
} from "../../services/partidasService";
import { useAulaEstadoPolling } from "../../hooks/useAulaEstadoPolling";

type Props = {
  dataIso: string;
  aula: AulaDia;
};

type CampoStat = keyof Pick<
  EstatisticaJogadorPartida,
  "gols" | "assistencias" | "defesas" | "chiliques" | "faltas"
>;

const normalizeTimeId = (id: string) => (id.startsWith("time-") ? id : `time-${id}`);

function normalizarPartidas(partidas: PartidaEstado[]) {
  return partidas.map((p) => ({
    ...p,
    timeAId: normalizeTimeId(p.timeAId),
    timeBId: normalizeTimeId(p.timeBId),
    estatisticas: p.estatisticas ?? [],
  }));
}

function normalizarEquipes(
  jogadores: PresencaJogadorDia[],
  times: TimeDia[],
): { jogadores: PresencaJogadorDia[]; times: TimeDia[] } {
  const timesNorm = times.map((t) => ({ ...t, id: normalizeTimeId(t.id) }));
  const jogadoresNorm = jogadores.map((j) => ({
    ...j,
    timeId: j.timeId ? normalizeTimeId(j.timeId) : undefined,
  }));
  return { jogadores: jogadoresNorm, times: timesNorm };
}

function normalizarStat(valor: number) {
  return Math.max(0, Math.floor(Number(valor) || 0));
}

export default function DiaPartidasTab({ dataIso, aula }: Props) {
  const [salvando, setSalvando] = useState(false);

  const { estado, setEstado, loading, error, refreshNow } = useAulaEstadoPolling({
    dataIso,
    aulaId: Number(aula.id),
    enabled: true,
  });

  const equipes = useMemo(() => {
    const eq = estado?.equipes ?? { jogadores: aula.jogadores ?? [], times: aula.times ?? [] };
    return normalizarEquipes(eq.jogadores ?? [], eq.times ?? []);
  }, [estado, aula.jogadores, aula.times]);

  const partidas = useMemo(() => {
    return normalizarPartidas(estado?.partidas ?? []);
  }, [estado?.partidas]);

  const jogadoresPorTime = useMemo(() => {
    const map: Record<string, PresencaJogadorDia[]> = {};
    for (const j of equipes.jogadores) {
      if (!j.timeId) continue;
      if (!map[j.timeId]) map[j.timeId] = [];
      map[j.timeId].push(j);
    }
    return map;
  }, [equipes.jogadores]);

  const timesPorId = useMemo(
    () => Object.fromEntries(equipes.times.map((t) => [t.id, t])),
    [equipes.times],
  );

  async function handleCriarPartida() {
    if (equipes.times.length < 2) {
      alert("Crie pelo menos 2 times para registrar partidas.");
      return;
    }

    const timeA = equipes.times[0];
    const timeB = equipes.times[1];

    try {
      setSalvando(true);
      const nova = await criarPartida(dataIso, aula.id, {
        timeAId: timeA.id,
        timeBId: timeB.id,
        estatisticas: [],
      });
      const novaNorm = {
        ...nova,
        timeAId: normalizeTimeId(nova.timeAId),
        timeBId: normalizeTimeId(nova.timeBId),
        estatisticas: nova.estatisticas ?? [],
      };

      setEstado((prev) =>
        prev
          ? { ...prev, partidas: [...prev.partidas, novaNorm] }
          : prev,
      );
      await refreshNow();
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

    const anterior = partidas;
    setEstado((prev) =>
      prev
        ? { ...prev, partidas: prev.partidas.filter((p) => p.id !== id) }
        : prev,
    );

    try {
      await deletarPartida(dataIso, aula.id, String(id));
      await refreshNow();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Erro ao remover partida.");
      setEstado((prev) =>
        prev
          ? { ...prev, partidas: anterior }
          : prev,
      );
    }
  }

  async function persistirPartida(partida: PartidaEstado) {
    setSalvando(true);
    try {
      await atualizarPartida(dataIso, aula.id, String(partida.id), {
        ordem: partida.ordem,
        timeAId: partida.timeAId,
        timeBId: partida.timeBId,
        estatisticas: partida.estatisticas ?? [],
      });
      await refreshNow();
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
    let partidaAtualizada: PartidaEstado | null = null;

    setEstado((prev) => {
      if (!prev) return prev;
      const partidasAtualizadas = prev.partidas.map((p) => {
        if (p.id !== partidaId) return p;
        const estatisticas = (p.estatisticas ?? []) as EstatisticaJogadorPartida[];
        const statExistente = estatisticas.find(
          (s) => s.jogadorAulaId === jogadorId,
        );

        let novasStats: EstatisticaJogadorPartida[];
        if (statExistente) {
          novasStats = estatisticas.map((s) =>
            s.jogadorAulaId === jogadorId ? { ...s, [campo]: novoValor } : s,
          );
        } else {
          novasStats = [
            ...estatisticas,
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
        const partidaNova = { ...p, estatisticas: novasStats };
        partidaAtualizada = partidaNova;
        return partidaNova;
      });

      return { ...prev, partidas: partidasAtualizadas };
    });

    if (partidaAtualizada) {
      void persistirPartida(partidaAtualizada);
    }
  };

  if (loading && !estado) {
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
            const placar = { golsA: p.golsTimeA, golsB: p.golsTimeB };
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
                        partidaStats={p.estatisticas ?? []}
                        onAlterarStat={handleAlterarStat}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <TabelaSumulaTime
                        titulo={timeB?.nome ?? "Time B"}
                        partidaId={p.id}
                        jogadores={jogadoresB}
                        partidaStats={p.estatisticas ?? []}
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

      {error && (
        <div className="text-danger" style={{ fontSize: 12 }}>
          {error}
        </div>
      )}
    </div>
  );
}

type TabelaProps = {
  titulo: string;
  partidaId: number;
  jogadores: PresencaJogadorDia[];
  partidaStats: EstatisticaJogadorPartida[];
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
  partidaStats,
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

  const getStatValue = (
    jogadorId: number,
    campo: CampoStat,
  ) => {
    const stat = partidaStats.find((s) => s.jogadorAulaId === jogadorId);
    return stat ? stat[campo] : 0;
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
                      value={getStatValue(j.jogadorId, c)}
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
