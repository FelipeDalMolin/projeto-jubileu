import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";

import {
  atualizarStatusJogadorNoEvento,
  criarTimeNoEvento,
  deletarTimeNoEvento,
  moverJogadorNoEvento,
  salvarEstadoEquipesEvento,
} from "../../services/diasService";
import { encerrarEvento, iniciarEvento } from "../../services/eventoLifecycleService";

import type {
  PresencaJogadorDia,
  StatusPresenca,
  TimeDia,
} from "../../types/dia";
import type {
  WorkspaceEventoEquipes,
  WorkspaceEventoMeta,
} from "../../types/workspaceEvento";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

type Props = {
  dataIso: string;
  eventoId: number;
  meta: WorkspaceEventoMeta;
  equipes: WorkspaceEventoEquipes;
  onRefresh: () => Promise<void>;
  teamSizeRef?: number | null;
  onSaveTeamSizeRef?: (teamSizeRef: number) => Promise<void>;
  showEventStatusCard?: boolean;
};

export default function WorkspaceEquipesPanel({
  dataIso,
  eventoId,
  meta,
  equipes,
  onRefresh,
  teamSizeRef = null,
  onSaveTeamSizeRef,
  showEventStatusCard = true,
}: Props) {
  const [jogadores, setJogadores] = useState<PresencaJogadorDia[]>([]);
  const [times, setTimes] = useState<TimeDia[]>([]);
  const [filtroNome, setFiltroNome] = useState<string>("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [teamSizeInput, setTeamSizeInput] = useState<string>(teamSizeRef != null ? String(teamSizeRef) : "8");

  useEffect(() => {
    setJogadores(equipes.jogadores ?? []);
    setTimes(equipes.times ?? []);
  }, [equipes.jogadores, equipes.times]);

  useEffect(() => {
    if (teamSizeRef != null) {
      setTeamSizeInput(String(teamSizeRef));
    }
  }, [teamSizeRef]);

  const presentesCount = useMemo(
    () => jogadores.filter((j) => j.status === "presente").length,
    [jogadores],
  );

  const jogadoresSemTimeLista = useMemo(
    () => jogadores.filter((j) => !j.timeId),
    [jogadores],
  );

  const jogadoresFiltrados = useMemo(() => {
    if (!filtroNome.trim()) return jogadoresSemTimeLista;
    const f = filtroNome.toLowerCase();
    return jogadoresSemTimeLista.filter((j) => j.nome.toLowerCase().includes(f));
  }, [filtroNome, jogadoresSemTimeLista]);

  const handleFiltroChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiltroNome(e.target.value);
  };

  const persistirStatusJogador = async (
    jogadorId: number,
    novoStatus: StatusPresenca,
  ) => {
    try {
      await atualizarStatusJogadorNoEvento(dataIso, eventoId, jogadorId, novoStatus);
      await onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status do jogador. Recarregando estado do servidor.");
      await onRefresh();
    }
  };

  const handleAlterarStatus = (jogadorId: number, novoStatus: StatusPresenca) => {
    setJogadores((prev) =>
      prev.map((j) => (j.jogadorId === jogadorId ? { ...j, status: novoStatus } : j)),
    );
    void persistirStatusJogador(jogadorId, novoStatus);
  };

  const handleMarcarTodosSoTreino = () => {
    setJogadores((prev) => prev.map((j) => ({ ...j, status: "so_treino" })));
  };

  const handleLimparStatus = () => {
    setJogadores((prev) =>
      prev.map((j) => ({
        ...j,
        status: j.timeId ? "presente" : "so_treino",
      })),
    );
  };

  const handleAdicionarEquipe = async () => {
    try {
      const idx = times.length + 1;
      const nome = `Time ${idx}`;
      await criarTimeNoEvento(dataIso, eventoId, { nome });
      await onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao criar equipe. Veja o console para detalhes.");
    }
  };

  const handleLimparEquipes = () => {
    setTimes([]);
    setJogadores((prev) => prev.map((j) => ({ ...j, timeId: undefined })));
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
      const atualizado: TimeDia = {
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

  const persistirMoverJogador = async (
    jogadorId: number,
    destinoTimeId: string | null,
  ) => {
    try {
      await moverJogadorNoEvento(dataIso, eventoId, jogadorId, destinoTimeId);
      await onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao mover jogador. Recarregando estado do servidor.");
      await onRefresh();
    }
  };

  const onJogadorDragStart = (
    e: DragEvent<HTMLSpanElement>,
    jogadorId: number,
  ) => {
    e.dataTransfer.setData("text/plain", String(jogadorId));
  };

  const onAreaDrop = (e: DragEvent<HTMLDivElement>, destinoTimeId: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    const jogadorId = Number(data);
    if (!Number.isNaN(jogadorId)) {
      moverJogadorParaTime(jogadorId, destinoTimeId);
      void persistirMoverJogador(jogadorId, destinoTimeId);
    }
  };

  const onAreaDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const jogadoresPorTime = (timeId: string) =>
    jogadores.filter((j) => j.timeId === timeId);

  const handleChangeCaracteristica = (
    timeId: string,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setTimes((prev) => prev.map((t) => (t.id === timeId ? { ...t, caracteristica: value } : t)));
  };

  const handleRemoverDoTime = (jogadorId: number) => {
    moverJogadorParaTime(jogadorId, null);
    void persistirMoverJogador(jogadorId, null);
  };

  const handleRemoverTime = async (timeId: string) => {
    const confirmado = window.confirm(
      "Remover este time? Os jogadores voltarao para a lista.",
    );
    if (!confirmado) return;

    setTimes((prev) => prev.filter((t) => t.id !== timeId));
    setJogadores((prev) =>
      prev.map((j) => (j.timeId === timeId ? { ...j, timeId: undefined } : j)),
    );

    try {
      await deletarTimeNoEvento(dataIso, eventoId, timeId);
      await onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao remover time. Recarregando estado do servidor.");
      await onRefresh();
    }
  };

  const handleSalvarEstadoEquipes = async () => {
    try {
      await salvarEstadoEquipesEvento(dataIso, eventoId, jogadores, times);
      alert("Estado das equipes salvo com sucesso!");
      await onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar estado das equipes. Veja o console para detalhes.");
    }
  };

  const handleIniciarEvento = async () => {
    if (presentesCount === 0) {
      setStatusError("Selecione ao menos um jogador presente antes de iniciar.");
      return;
    }
    setStatusLoading(true);
    setStatusError(null);
    try {
      await iniciarEvento(dataIso, eventoId);
      await onRefresh();
    } catch (err: unknown) {
      setStatusError(err instanceof Error ? err.message : "Erro ao iniciar a evento.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleEncerrarEvento = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      await encerrarEvento(dataIso, eventoId);
      await onRefresh();
    } catch (err: unknown) {
      setStatusError(err instanceof Error ? err.message : "Erro ao encerrar a evento.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSalvarTeamSizeRef = async () => {
    if (!onSaveTeamSizeRef) return;
    const parsed = Number(teamSizeInput);
    if (!Number.isFinite(parsed) || parsed < 1) {
      alert("Informe um valor valido (>= 1).");
      return;
    }
    try {
      await onSaveTeamSizeRef(parsed);
      await onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar sugestao de pessoas por equipe.");
    }
  };

  const statusLabel =
    meta.status === "EM_ANDAMENTO"
      ? "EM ANDAMENTO"
      : meta.status === "ENCERRADO"
        ? "ENCERRADA"
        : meta.status;

  return (
    <div data-testid="board-equipes" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <section className="space-y-4">
        {showEventStatusCard ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Status do Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <strong>Status atual:</strong> {statusLabel}
              </div>

              {statusError ? <div className="rounded-md bg-amber-50 p-2 text-sm text-amber-800">{statusError}</div> : null}

              {meta.status === "PLANEJADO" ? (
                <div className="space-y-2">
                  {presentesCount === 0 ? (
                    <div className="rounded-md bg-slate-100 p-2 text-sm text-slate-700">
                      Nenhum jogador marcado como presente.
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleIniciarEvento}
                      disabled={statusLoading || presentesCount === 0}
                    >
                      Iniciar evento
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled title="Acao ainda nao disponivel">
                      Cancelar evento
                    </Button>
                  </div>
                </div>
              ) : null}

              {meta.status === "EM_ANDAMENTO" ? (
                <Button type="button" size="sm" variant="secondary" onClick={handleEncerrarEvento} disabled={statusLoading}>
                  Encerrar evento
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Presenca da Turma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jogadores.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum jogador associado a esta turma ainda.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={handleMarcarTodosSoTreino}>
                    Marcar todos como Em branco
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleLimparStatus}>
                    Limpar status
                  </Button>
                </div>

                <Input
                  type="text"
                  placeholder="Filtrar por nome..."
                  value={filtroNome}
                  onChange={handleFiltroChange}
                />

                <div className="max-h-[420px] overflow-y-auto rounded-md border p-2">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <strong className="text-foreground">Jogador</strong>
                    <span>Status</span>
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

                <p className="text-xs text-muted-foreground">
                  Jogadores em algum time sao considerados <strong>presentes em jogo</strong>.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Montagem de Equipes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Arraste jogadores da lista para montar os times. Para tirar alguem, clique em remover.
              </p>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleAdicionarEquipe}>
                  + Adicionar equipe
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleLimparEquipes}>
                  Limpar equipes
                </Button>
              </div>
            </div>

            {onSaveTeamSizeRef ? (
              <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/20 p-2">
                <label className="text-xs text-muted-foreground">
                  Sugestao de pessoas por equipe
                  <Input
                    type="number"
                    min={1}
                    className="mt-1 w-32"
                    value={teamSizeInput}
                    onChange={(e) => setTeamSizeInput(e.target.value)}
                  />
                </label>
                <Button type="button" size="sm" variant="outline" onClick={handleSalvarTeamSizeRef}>
                  Salvar sugestao
                </Button>
              </div>
            ) : null}

            {times.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma equipe cadastrada. Clique em <strong>Adicionar equipe</strong>.
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {times.map((time) => {
                  const jogadoresTime = jogadoresPorTime(time.id);
                  return (
                    <DropArea
                      key={time.id}
                      titulo={time.nome}
                      descricao={
                        time.caracteristica ||
                        "Defina uma caracteristica (ex.: mais experiente, mais leve, etc.)"
                      }
                      onDrop={(e) => onAreaDrop(e, time.id)}
                      onDragOver={onAreaDragOver}
                      teamId={time.id}
                      onRemove={() => handleRemoverTime(time.id)}
                    >
                      <Input
                        type="text"
                        className="mb-2"
                        placeholder="Caracteristica do time..."
                        value={time.caracteristica ?? ""}
                        onChange={(e) => handleChangeCaracteristica(time.id, e)}
                      />

                      <div className="flex flex-wrap gap-1">
                        {jogadoresTime.map((j) => (
                          <ChipJogador key={j.jogadorId} jogador={j} onRemover={handleRemoverDoTime} />
                        ))}

                        {jogadoresTime.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Arraste jogadores para ca</span>
                        ) : null}
                      </div>
                    </DropArea>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" onClick={handleSalvarEstadoEquipes}>
                Salvar estado das equipes
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

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
    <div className="flex items-center justify-between border-b py-1 last:border-b-0">
      <span
        draggable
        onDragStart={(e) => onDragStart(e, jogador.jogadorId)}
        style={{ cursor: "grab" }}
        title="Arraste o nome para uma equipe"
        className="text-sm"
      >
        {jogador.nome}
      </span>

      <select
        className="w-[150px] rounded-md border border-input bg-background px-2 py-1 text-sm"
        value={jogador.status}
        onChange={handleChange}
      >
        <option value="so_treino">Em branco</option>
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
  teamId?: string;
  onRemove?: () => void;
  children: ReactNode;
};

function DropArea({ titulo, descricao, onDrop, onDragOver, teamId, onRemove, children }: DropAreaProps) {
  const onTeamDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (!teamId) return;
    e.dataTransfer.setData("application/x-jubileu-time-id", teamId);
    e.dataTransfer.setData("text/plain", `time:${teamId}`);
  };

  return (
    <div
      className="h-full rounded-md border bg-muted/20 p-3"
      onDrop={onDrop}
      onDragOver={onDragOver}
      draggable={Boolean(teamId)}
      onDragStart={onTeamDragStart}
      title={teamId ? "Arraste este time para a fila de times" : undefined}
    >
      <div className="mb-1 flex items-start justify-between">
        <div className="flex flex-col">
          <strong>{titulo}</strong>
          <small className="text-muted-foreground">{descricao}</small>
        </div>
        {onRemove ? (
          <button type="button" className="p-0 text-xs text-red-600 hover:underline" onClick={onRemove}>
            Remover
          </button>
        ) : null}
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
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 text-xs text-white">
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
        x
      </button>
    </span>
  );
}
