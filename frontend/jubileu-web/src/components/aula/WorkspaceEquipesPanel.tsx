import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";

import {
  atualizarStatusJogadorNaAula,
  criarTimeNaAula,
  deletarTimeNaAula,
  moverJogadorNaAula,
  salvarEstadoEquipesAula,
} from "../../services/diasService";
import { encerrarAula, iniciarAula } from "../../services/aulaLifecycleService";

import type {
  PresencaJogadorDia,
  StatusPresenca,
  TimeDia,
} from "../../types/dia";
import type {
  WorkspaceAulaEquipes,
  WorkspaceAulaMeta,
} from "../../types/workspaceAula";

type Props = {
  dataIso: string;
  aulaId: number;
  meta: WorkspaceAulaMeta;
  equipes: WorkspaceAulaEquipes;
  onRefresh: () => Promise<void>;
};

export default function WorkspaceEquipesPanel({
  dataIso,
  aulaId,
  meta,
  equipes,
  onRefresh,
}: Props) {
  const [jogadores, setJogadores] = useState<PresencaJogadorDia[]>([]);
  const [times, setTimes] = useState<TimeDia[]>([]);
  const [filtroNome, setFiltroNome] = useState<string>("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    setJogadores(equipes.jogadores ?? []);
    setTimes(equipes.times ?? []);
  }, [equipes.jogadores, equipes.times]);

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
      await atualizarStatusJogadorNaAula(dataIso, aulaId, jogadorId, novoStatus);
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
      await criarTimeNaAula(dataIso, aulaId, { nome });
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
      await moverJogadorNaAula(dataIso, aulaId, jogadorId, destinoTimeId);
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
      await deletarTimeNaAula(dataIso, aulaId, timeId);
      await onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao remover time. Recarregando estado do servidor.");
      await onRefresh();
    }
  };

  const handleSalvarEstadoEquipes = async () => {
    try {
      await salvarEstadoEquipesAula(dataIso, aulaId, jogadores, times);
      alert("Estado das equipes salvo com sucesso!");
      await onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar estado das equipes. Veja o console para detalhes.");
    }
  };

  const handleIniciarAula = async () => {
    if (presentesCount === 0) {
      setStatusError("Selecione ao menos um jogador presente antes de iniciar.");
      return;
    }
    setStatusLoading(true);
    setStatusError(null);
    try {
      await iniciarAula(dataIso, aulaId);
      await onRefresh();
    } catch (err: any) {
      setStatusError(err?.message ?? "Erro ao iniciar a aula.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleEncerrarAula = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      await encerrarAula(dataIso, aulaId);
      await onRefresh();
    } catch (err: any) {
      setStatusError(err?.message ?? "Erro ao encerrar a aula.");
    } finally {
      setStatusLoading(false);
    }
  };

  const statusLabel =
    meta.status === "EM_ANDAMENTO"
      ? "EM ANDAMENTO"
      : meta.status === "CONCLUIDA"
        ? "ENCERRADA"
        : meta.status;

  return (
    <div className="row">
      {/* COLUNA ESQUERDA */}
      <section className="col-12 col-lg-4 mb-4">
        <h3 className="h5">Jogadores da turma</h3>

        <section className="mb-3">
          <h3 className="h6 mb-2">Painel de status da aula</h3>
          <div className="border rounded p-2">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <strong>Status atual:</strong> {statusLabel}
              </div>
            </div>

            {statusError && (
              <div className="alert alert-warning py-2 mb-2">{statusError}</div>
            )}

            {meta.status === "PLANEJADA" && (
              <>
                {presentesCount === 0 && (
                  <div className="alert alert-info py-2 mb-2">
                    Nenhum jogador marcado como presente.
                  </div>
                )}
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={handleIniciarAula}
                    disabled={statusLoading || presentesCount === 0}
                  >
                    Iniciar aula
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    disabled
                    title="Acao ainda nao disponivel"
                  >
                    Cancelar aula
                  </button>
                </div>
              </>
            )}

            {meta.status === "EM_ANDAMENTO" && (
              <button
                type="button"
                className="btn btn-sm btn-warning"
                onClick={handleEncerrarAula}
                disabled={statusLoading}
              >
                Encerrar aula
              </button>
            )}
          </div>
        </section>

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
                Marcar todos como SO TREINOU
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
              Jogadores em algum time sao <strong>presentes em jogo</strong>.
              Para quem nao entrar, selecione <em>So treino</em>, <em>Faltou</em>{" "}
              ou <em>Atestado</em>.
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
            Arraste jogadores da lista para montar os times. Para tirar alguem, clique no x.
          </p>

          {times.length === 0 ? (
            <p className="text-muted">
              Nenhuma equipe cadastrada. Clique em <strong>Adicionar equipe</strong>.
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
                        "Defina uma caracteristica (ex.: mais experiente, mais leve, etc.)"
                      }
                      onDrop={(e) => onAreaDrop(e, time.id)}
                      onDragOver={onAreaDragOver}
                      onRemove={() => handleRemoverTime(time.id)}
                    >
                      <input
                        type="text"
                        className="form-control form-control-sm mb-2"
                        placeholder="Caracteristica do time..."
                        value={time.caracteristica ?? ""}
                        onChange={(e) => handleChangeCaracteristica(time.id, e)}
                      />

                      <div className="d-flex flex-wrap gap-1">
                        {jogadoresTime.map((j) => (
                          <ChipJogador key={j.jogadorId} jogador={j} onRemover={handleRemoverDoTime} />
                        ))}

                        {jogadoresTime.length === 0 && (
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            Arraste jogadores para ca
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

        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-success" onClick={handleSalvarEstadoEquipes}>
            Salvar estado das equipes
          </button>
        </div>
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
        <option value="so_treino">So treinou</option>
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
  onRemove?: () => void;
  children: ReactNode;
};

function DropArea({ titulo, descricao, onDrop, onDragOver, onRemove, children }: DropAreaProps) {
  return (
    <div className="border rounded p-2 h-100" onDrop={onDrop} onDragOver={onDragOver}>
      <div className="d-flex justify-content-between align-items-start mb-1">
        <div className="d-flex flex-column">
          <strong>{titulo}</strong>
          <small className="text-muted">{descricao}</small>
        </div>
        {onRemove && (
          <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={onRemove}>
            Remover
          </button>
        )}
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
        x
      </button>
    </span>
  );
}
