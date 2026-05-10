import { useMemo, useState, type ChangeEvent } from "react";

import {
  atualizarStatsJogadorPartida,
  criarPartidaNoEvento,
  encerrarPartidaNoEvento,
  iniciarPartidaNoEvento,
  removerPartidaDoEvento,
} from "../../services/diasService";

import type { PresencaJogadorDia } from "../../types/dia";
import type {
  WorkspaceEventoEquipes,
  WorkspaceEventoPartida,
} from "../../types/workspaceEvento";

type PartidaEvento = {
  id: string;
  ordem: number;
  status: "PLANEJADA" | "EM_ANDAMENTO" | "ENCERRADA";
  timeAId: string;
  timeBId: string;
  golsTimeA: number;
  golsTimeB: number;
};

type StatsJogador = {
  gols: number;
  assistencias: number;
  chiliques: number;
  faltas: number;
};

type StatsPartidas = Record<string, Record<number, StatsJogador>>;

const DEFAULT_STATS: StatsJogador = {
  gols: 0,
  assistencias: 0,
  chiliques: 0,
  faltas: 0,
};

type Props = {
  dataIso: string;
  eventoId: number;
  equipes: WorkspaceEventoEquipes;
  partidas: WorkspaceEventoPartida[];
  onRefresh: () => Promise<void>;
  mode?: "full" | "history";
  title?: string;
};

export default function WorkspacePartidasPanel({
  dataIso,
  eventoId,
  equipes,
  partidas,
  onRefresh,
  mode = "full",
  title = "Partidas",
}: Props) {
  const [stats, setStats] = useState<StatsPartidas>({});
  const [novoTimeAId, setNovoTimeAId] = useState<string>("");
  const [novoTimeBId, setNovoTimeBId] = useState<string>("");

  const times = useMemo(() => equipes.times ?? [], [equipes.times]);
  const jogadores = equipes.jogadores ?? [];
  const isReadOnly = mode === "history";

  const timeIds = useMemo(() => times.map((t) => t.id), [times]);
  const selectedTimeAId = timeIds.includes(novoTimeAId) ? novoTimeAId : timeIds[0] ?? "";
  const selectedTimeBId =
    timeIds.includes(novoTimeBId) && novoTimeBId !== selectedTimeAId
      ? novoTimeBId
      : timeIds.find((id) => id !== selectedTimeAId) ?? "";

  const partidasUi = useMemo<PartidaEvento[]>(
    () =>
      (partidas ?? []).map((p) => ({
        id: String(p.id),
        ordem: p.ordem ?? 0,
        status: p.status ?? "PLANEJADA",
        timeAId: p.timeAId ?? "",
        timeBId: p.timeBId ?? "",
        golsTimeA: p.golsTimeA ?? 0,
        golsTimeB: p.golsTimeB ?? 0,
      })),
    [partidas],
  );

  const jogadoresPorTime = (timeId: string) =>
    jogadores.filter((j) => j.timeId === timeId);

  const handleAdicionarPartida = () => {
    if (isReadOnly) return;
    if (times.length < 2) return;
    if (!selectedTimeAId || !selectedTimeBId) return;
    if (selectedTimeAId === selectedTimeBId) return;

    const criar = async () => {
      try {
        await criarPartidaNoEvento(dataIso, eventoId, {
          timeAId: selectedTimeAId,
          timeBId: selectedTimeBId,
        });
        setNovoTimeAId("");
        setNovoTimeBId("");
        await onRefresh();
      } catch (err) {
        console.error(err);
        alert("Erro ao criar partida. Recarregando estado do servidor.");
        await onRefresh();
      }
    };

    void criar();
  };

  const handleRemoverPartida = (partidaId: string) => {
    if (isReadOnly) return;
    const remover = async () => {
      try {
        await removerPartidaDoEvento(dataIso, eventoId, partidaId);
        await onRefresh();
      } catch (err) {
        console.error(err);
        alert("Erro ao remover partida. Recarregando estado do servidor.");
        await onRefresh();
      }
    };
    void remover();
  };

  const handleIniciarPartida = (partidaId: string) => {
    if (isReadOnly) return;
    const iniciar = async () => {
      try {
        await iniciarPartidaNoEvento(dataIso, eventoId, partidaId);
        await onRefresh();
      } catch (err) {
        console.error(err);
        alert("Erro ao iniciar partida. Recarregando estado do servidor.");
        await onRefresh();
      }
    };
    void iniciar();
  };

  const handleEncerrarPartida = (partidaId: string) => {
    if (isReadOnly) return;
    const encerrar = async () => {
      try {
        await encerrarPartidaNoEvento(dataIso, eventoId, partidaId);
        await onRefresh();
      } catch (err) {
        console.error(err);
        alert("Erro ao encerrar partida. Recarregando estado do servidor.");
        await onRefresh();
      }
    };
    void encerrar();
  };

  const handleAlterarStat = (
    partidaId: string,
    jogadorId: number,
    campo: keyof StatsJogador,
    valor: number,
  ) => {
    if (isReadOnly) return;
    setStats((prev) => {
      const statsPartida = prev[partidaId] ?? {};
      const statsJogador: StatsJogador = statsPartida[jogadorId] ?? { ...DEFAULT_STATS };
      const atualizado = { ...statsJogador, [campo]: valor };

      return {
        ...prev,
        [partidaId]: {
          ...statsPartida,
          [jogadorId]: atualizado,
        },
      };
    });

    const persistir = async () => {
      const current = stats[partidaId]?.[jogadorId] ?? { ...DEFAULT_STATS, [campo]: valor };
      const payload = {
        gols: campo === "gols" ? valor : current.gols ?? 0,
        assistencias: campo === "assistencias" ? valor : current.assistencias ?? 0,
        chiliques: campo === "chiliques" ? valor : current.chiliques ?? 0,
        faltas: campo === "faltas" ? valor : current.faltas ?? 0,
      };
      try {
        await atualizarStatsJogadorPartida(
          dataIso,
          eventoId,
          partidaId,
          jogadorId,
          payload,
        );
        await onRefresh();
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar estatisticas. Recarregando estado do servidor.");
        await onRefresh();
      }
    };

    void persistir();
  };

  const getStat = (
    partidaId: string,
    jogadorId: number,
    campo: keyof StatsJogador,
  ): number => {
    return stats[partidaId]?.[jogadorId]?.[campo] ?? 0;
  };

  return (
    <div className="mb-4">
      <h3 className="h5">{title}</h3>

      {times.length < 2 && !isReadOnly ? (
        <p className="text-muted">
          Para criar partidas, e necessario ter pelo menos <strong>2 equipes</strong>.
        </p>
      ) : (
        <>
          {!isReadOnly ? (
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <span>Nova partida:</span>
            <select
              className="form-select form-select-sm"
              style={{ maxWidth: 160 }}
              value={selectedTimeAId}
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
              value={selectedTimeBId}
              onChange={(e) => setNovoTimeBId(e.target.value)}
            >
              <option value="">Time B</option>
              {times.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={handleAdicionarPartida}
            >
              Adicionar partida
            </button>

            <small className="text-muted">
              Monte na ordem real (ex.: vencedor continua).
            </small>
            </div>
          ) : null}
          {!isReadOnly && times.length >= 2 ? (
            <p className="text-muted" style={{ fontSize: 12 }}>
              Use os times montados na aba <strong>Presenca & Equipes</strong>, escolha o confronto e clique em
              <strong> Adicionar partida</strong>. Depois clique em <strong>Iniciar</strong> na partida criada.
            </p>
          ) : null}
          {partidasUi.length === 0 ? (
            <p className="text-muted">
              {isReadOnly
                ? "Nenhuma partida encerrada ainda."
                : "Nenhuma partida cadastrada ainda."}
            </p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {partidasUi.map((p) => {
                const timeA = times.find((t) => t.id === p.timeAId);
                const timeB = times.find((t) => t.id === p.timeBId);

                const jogadoresA = timeA ? jogadoresPorTime(timeA.id) : [];
                const jogadoresB = timeB ? jogadoresPorTime(timeB.id) : [];

                return (
                  <div key={p.id} className="border rounded p-2" style={{ fontSize: 13 }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Partida {p.ordem}</strong>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className={`badge ${
                            p.status === "EM_ANDAMENTO"
                              ? "bg-success"
                              : p.status === "ENCERRADA"
                                ? "bg-secondary"
                                : "bg-warning text-dark"
                          }`}
                        >
                          {p.status}
                        </span>
                        {!isReadOnly && p.status === "PLANEJADA" ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleIniciarPartida(p.id)}
                          >
                            Iniciar
                          </button>
                        ) : null}
                        {!isReadOnly && p.status === "EM_ANDAMENTO" ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleEncerrarPartida(p.id)}
                          >
                            Encerrar
                          </button>
                        ) : null}
                        {!isReadOnly ? (
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-danger p-0"
                            onClick={() => handleRemoverPartida(p.id)}
                          >
                            Remover
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span>{timeA?.nome ?? "Time A"}</span>
                      <span className="badge bg-secondary">{p.golsTimeA}</span>
                      <span> x </span>
                      <span className="badge bg-secondary">{p.golsTimeB}</span>
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
                          readOnly={isReadOnly}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <TabelaSumulaTime
                          titulo={timeB?.nome ?? "Time B"}
                          partidaId={p.id}
                          jogadores={jogadoresB}
                          getStat={getStat}
                          onAlterarStat={handleAlterarStat}
                          readOnly={isReadOnly}
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
  );
}

type TabelaSumulaTimeProps = {
  titulo: string;
  partidaId: string;
  jogadores: PresencaJogadorDia[];
  getStat: (partidaId: string, jogadorId: number, campo: keyof StatsJogador) => number;
  onAlterarStat: (partidaId: string, jogadorId: number, campo: keyof StatsJogador, valor: number) => void;
  readOnly?: boolean;
};

function TabelaSumulaTime({
  titulo,
  partidaId,
  jogadores,
  getStat,
  onAlterarStat,
  readOnly = false,
}: TabelaSumulaTimeProps) {
  const campos: (keyof StatsJogador)[] = ["gols", "assistencias", "chiliques", "faltas"];

  const labels: Record<keyof StatsJogador, string> = {
    gols: "G",
    assistencias: "A",
    chiliques: "Ch",
    faltas: "F",
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    jogadorId: number,
    campo: keyof StatsJogador,
  ) => {
    const valor = Number(e.target.value) || 0;
    if (readOnly) return;
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
                      disabled={readOnly}
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
