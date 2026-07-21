import { useMemo, useState, type ChangeEvent } from "react";

import {
  atualizarStatsJogadorPartida,
  criarPartidaNoEvento,
  encerrarPartidaNoEvento,
  iniciarPartidaNoEvento,
  removerPartidaDoEvento,
} from "../../services/diasService";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { SelectField } from "../ui/form";
import { StatusBadge } from "../ui/status-badge";

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
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="text-sm text-slate-600">
          Organize o confronto, acompanhe o placar e consulte a sumula de cada equipe.
        </p>
      </div>

      {times.length < 2 && !isReadOnly ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          Para criar partidas, e necessario ter pelo menos <strong>2 equipes</strong>.
        </div>
      ) : (
        <>
          {!isReadOnly ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Nova partida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:items-end">
                  <SelectField label="Equipe A" value={selectedTimeAId} onChange={(e) => setNovoTimeAId(e.target.value)}>
                    <option value="">Selecione</option>
                    {times.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </SelectField>
                  <span className="hidden pb-2 text-sm font-semibold text-slate-500 sm:block">x</span>
                  <SelectField label="Equipe B" value={selectedTimeBId} onChange={(e) => setNovoTimeBId(e.target.value)}>
                    <option value="">Selecione</option>
                    {times.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </SelectField>
                  <Button data-testid="button-criar-partida" type="button" onClick={handleAdicionarPartida}>
                    Adicionar partida
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Use os times montados em Presenca &amp; Equipes e mantenha a ordem real, por exemplo quando o vencedor continua.
                </p>
              </CardContent>
            </Card>
          ) : null}
          {partidasUi.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              {isReadOnly
                ? "Nenhuma partida encerrada ainda."
                : "Nenhuma partida cadastrada ainda."}
            </div>
          ) : (
            <div className="space-y-3">
              {partidasUi.map((p) => {
                const timeA = times.find((t) => t.id === p.timeAId);
                const timeB = times.find((t) => t.id === p.timeBId);

                const jogadoresA = timeA ? jogadoresPorTime(timeA.id) : [];
                const jogadoresB = timeB ? jogadoresPorTime(timeB.id) : [];

                return (
                  <Card key={p.id}>
                    <CardHeader className="gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle>Partida {p.ordem}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={p.status} />
                        {!isReadOnly && p.status === "PLANEJADA" ? (
                          <Button type="button" size="sm" onClick={() => handleIniciarPartida(p.id)}>Iniciar</Button>
                        ) : null}
                        {!isReadOnly && p.status === "EM_ANDAMENTO" ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => handleEncerrarPartida(p.id)}>Encerrar</Button>
                        ) : null}
                        {!isReadOnly ? (
                          <Button type="button" size="sm" variant="danger" onClick={() => handleRemoverPartida(p.id)}>Remover</Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center gap-3 rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-900">
                        <span>{timeA?.nome ?? "Time A"}</span>
                        <span className="rounded-md bg-slate-900 px-2.5 py-1 text-white">{p.golsTimeA}</span>
                        <span className="text-slate-400">x</span>
                        <span className="rounded-md bg-slate-900 px-2.5 py-1 text-white">{p.golsTimeB}</span>
                        <span>{timeB?.nome ?? "Time B"}</span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <TabelaSumulaTime
                          titulo={timeA?.nome ?? "Time A"}
                          partidaId={p.id}
                          jogadores={jogadoresA}
                          getStat={getStat}
                          onAlterarStat={handleAlterarStat}
                          readOnly={isReadOnly}
                        />
                        <TabelaSumulaTime
                          titulo={timeB?.nome ?? "Time B"}
                          partidaId={p.id}
                          jogadores={jogadoresB}
                          getStat={getStat}
                          onAlterarStat={handleAlterarStat}
                          readOnly={isReadOnly}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
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
    <div className="min-w-0">
      <h4 className="mb-2 text-sm font-semibold text-slate-900">{titulo}</h4>

      {jogadores.length === 0 ? (
        <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
          Nenhum jogador neste time.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 font-semibold">Jogador</th>
              {campos.map((c) => (
                <th key={c} className="w-12 px-1 py-2 text-center font-semibold">
                  {labels[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jogadores.map((j) => (
              <tr key={j.jogadorId}>
                <td className="px-2 py-1.5 font-medium text-slate-700">{j.nome}</td>
                {campos.map((c) => (
                  <td key={c} className="px-1 py-1.5 text-center">
                    <input
                      type="number"
                      min={0}
                      className="h-8 w-10 rounded-md border border-slate-200 bg-white px-1 text-center text-xs disabled:bg-slate-50"
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
        </div>
      )}
    </div>
  );
}
