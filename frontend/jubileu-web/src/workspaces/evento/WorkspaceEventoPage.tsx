import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "../../components/ui/button";
import WorkspaceEquipesPanel from "../../components/evento/WorkspaceEquipesPanel";
import WorkspacePartidasPanel from "../../components/evento/WorkspacePartidasPanel";
import { useAuthSession } from "../../hooks/useAuthSession";
import {
  criarPartidaNoEvento,
  criarTimeNoEvento,
  encerrarPartidaNoEvento,
  iniciarPartidaNoEvento,
  moverJogadorNoEvento,
} from "../../services/diasService";
import {
  listarLancesEvento,
  listarParticipantesEvento,
  listarPresentesEvento,
  atualizarConfiguracaoRotacaoEvento,
  mapLanceToTimelineItem,
  obterEstadoRotacaoEvento,
  previewSorteioRotacaoEvento,
  confirmarSorteioRotacaoEvento,
  criarProximaPartidaEvento,
  type AuthHeaders,
} from "../../services/eventosService";
import { obterWorkspaceEvento } from "../../services/workspaceEventoService";
import type { RotacaoPreview } from "../../types/rotacao";
import type { WorkspaceEvento } from "../../types/workspaceEvento";
import { EventoBottomTabs } from "./components/EventoBottomTabs";
import { EventoContextBar } from "./components/EventoContextBar";
import { EventoHeader } from "./components/EventoHeader";
import { EventoPresenceActionsCard } from "./components/EventoPresenceActionsCard";
import { FilaChegadaPanel } from "./components/FilaChegadaPanel";
import { ParticipantesPanel } from "./components/ParticipantesPanel";
import { PartidaAoVivoCard } from "./components/PartidaAoVivoCard";
import { QuickAddLance } from "./components/QuickAddLance";
import { SeedPartidaCard } from "./components/SeedPartidaCard";
import { TimelineLances } from "./components/TimelineLances";
import { TimesPanel } from "./components/TimesPanel";
import { EventoStatusActions } from "./components/EventoStatusActions";
import { RotacaoFilaPanel } from "./components/RotacaoFilaPanel";
import { resolveEventoCapabilities } from "./capabilities";

type Props = {
  dataIso?: string;
  eventoId?: string;
  source: "evento";
};

function toEventoIdNumberOrNull(eventoId?: string): number | null {
  if (!eventoId) return null;
  const n = Number(eventoId);
  return Number.isFinite(n) ? n : null;
}

function toRequestAuth(
  auth: ReturnType<typeof useAuthSession>["getRequestAuth"],
): AuthHeaders | null {
  const current = auth();
  if (!current) return null;
  return {
    userId: current.userId,
    role: current.role,
    jogadorId: current.jogadorId,
    accessToken: current.accessToken,
  };
}

function retryAuthenticatedChannel(failureCount: number, error: Error): boolean {
  if (error.message.startsWith("401")) return false;
  return failureCount < 1;
}

export default function WorkspaceEventoPage({ dataIso, eventoId, source }: Props) {
  const navigate = useNavigate();
  const auth = useAuthSession();
  const [selectedTab, setSelectedTab] = useState("presenca");
  const [selectedHistoryPartidaId, setSelectedHistoryPartidaId] = useState<number | null>(null);
  const requestAuth = toRequestAuth(auth.getRequestAuth);
  const eventoIdNum = toEventoIdNumberOrNull(eventoId);
  const workspaceCacheRef = useRef<WorkspaceEvento | null>(null);

  const workspaceQuery = useQuery({
    queryKey: ["workspace-evento", dataIso, eventoIdNum],
    enabled: Boolean(dataIso && eventoIdNum !== null),
    queryFn: async () => {
      if (!dataIso || eventoIdNum === null) return null;
      const resp = await obterWorkspaceEvento(
        dataIso,
        eventoIdNum,
        workspaceCacheRef.current?.meta.version,
      );
      if (resp.status === 204) {
        return workspaceCacheRef.current;
      }
      workspaceCacheRef.current = resp.data;
      return resp.data;
    },
    refetchInterval: () => (document.hidden ? false : 4000),
  });

  const workspace = workspaceQuery.data ?? null;
  const workspaceLegacy = workspace;

  const caps = useMemo(() => {
    if (!workspace || !auth.user) return null;
    return resolveEventoCapabilities({
      tipo: workspace.meta.tipo,
      status: workspace.meta.status,
      role: auth.user.role,
    });
  }, [auth.user, workspace]);

  const partidaEmAndamento = useMemo(() => {
    if (!workspaceLegacy) return null;
    return workspaceLegacy.partidas.find((partida) => partida.status === "EM_ANDAMENTO") ?? null;
  }, [workspaceLegacy]);
  const partidaEmFoco = useMemo(() => {
    if (!workspaceLegacy) return null;
    return partidaEmAndamento ?? workspaceLegacy.partidas[0] ?? null;
  }, [partidaEmAndamento, workspaceLegacy]);

  const partidasEncerradas = useMemo(() => {
    if (!workspaceLegacy) return [];
    return workspaceLegacy.partidas.filter((p) => p.status === "ENCERRADA");
  }, [workspaceLegacy]);
  const ultimaPartidaEncerrada = useMemo(
    () => [...partidasEncerradas].sort((a, b) => b.ordem - a.ordem)[0] ?? null,
    [partidasEncerradas],
  );
  const partidasPanelMode = "history" as const;
  const partidasParaPainel = partidasEncerradas;

  const isJogoLivre = workspace?.meta.tipo === "JOGO_LIVRE";
  const hasPartidaAoVivo = Boolean(partidaEmAndamento);
  const hasAnyPartida = Boolean(workspaceLegacy?.partidas.length);

  const participantesQuery = useQuery({
    queryKey: ["evento-participantes", eventoIdNum],
    enabled: Boolean(
      requestAuth &&
        eventoIdNum &&
        (selectedTab === "presenca" || selectedTab === "partida-atual") &&
        isJogoLivre &&
        caps?.has("participants_view"),
    ),
    queryFn: async () => {
      if (!requestAuth || !eventoIdNum) return { participants: [], presentes: [] };
      const [participants, presentes] = await Promise.all([
        listarParticipantesEvento(eventoIdNum, requestAuth),
        listarPresentesEvento(eventoIdNum, requestAuth),
      ]);
      return { participants, presentes };
    },
    retry: retryAuthenticatedChannel,
    refetchInterval: () => (document.hidden ? false : 3000),
  });

  const timelineQuery = useQuery({
    queryKey: ["evento-timeline", eventoIdNum, partidaEmAndamento?.id ?? null],
    enabled: Boolean(
      requestAuth &&
        eventoIdNum &&
        selectedTab === "partida-atual" &&
        partidaEmAndamento &&
        caps?.has("lances"),
    ),
    queryFn: async () => {
      if (!requestAuth || !eventoIdNum || !partidaEmAndamento) return [];
      const lances = await listarLancesEvento(eventoIdNum, requestAuth, {
        partidaId: partidaEmAndamento.id,
        limit: 200,
      });
      return lances.map(mapLanceToTimelineItem);
    },
    retry: retryAuthenticatedChannel,
    refetchInterval: () => (document.hidden ? false : 2200),
  });

  const historyTimelineQuery = useQuery({
    queryKey: ["evento-partidas-history-lances", eventoIdNum, selectedHistoryPartidaId],
    enabled: Boolean(
      requestAuth &&
        eventoIdNum &&
        selectedTab === "historico" &&
        selectedHistoryPartidaId !== null,
    ),
    queryFn: async () => {
      if (!requestAuth || !eventoIdNum || selectedHistoryPartidaId == null) return [];
      const lances = await listarLancesEvento(eventoIdNum, requestAuth, {
        partidaId: selectedHistoryPartidaId,
        limit: 200,
      });
      return lances.map(mapLanceToTimelineItem);
    },
    retry: retryAuthenticatedChannel,
    refetchInterval: () => (document.hidden ? false : 3000),
  });

  const rotacaoQuery = useQuery({
    queryKey: ["evento-rotacao-estado", eventoIdNum],
    enabled: Boolean(
      requestAuth &&
        eventoIdNum &&
        (selectedTab === "equipes" || selectedTab === "fila" || selectedTab === "partida-atual"),
    ),
    queryFn: async () => {
      if (!requestAuth || !eventoIdNum) return null;
      return await obterEstadoRotacaoEvento(eventoIdNum, requestAuth);
    },
    retry: retryAuthenticatedChannel,
    refetchInterval: () => (document.hidden ? false : 3000),
  });

  const previewSorteioMutation = useMutation({
    mutationFn: async ({ grupoId }: { grupoId: string }) => {
      if (!requestAuth || !eventoIdNum) throw new Error("Sessao invalida para sorteio");
      return await previewSorteioRotacaoEvento(
        eventoIdNum,
        { grupo_alvo_id: grupoId, partida_origem_id: partidaEmAndamento?.id ?? null },
        requestAuth,
      );
    },
  });

  const confirmSorteioMutation = useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      if (!requestAuth || !eventoIdNum) throw new Error("Sessao invalida para confirmacao");
      return await confirmarSorteioRotacaoEvento(eventoIdNum, token, requestAuth);
    },
    onSuccess: async () => {
      await Promise.all([rotacaoQuery.refetch(), workspaceQuery.refetch()]);
    },
  });

  const startPartidaMutation = useMutation({
    mutationFn: async ({ partidaId }: { partidaId: number }) => {
      if (!dataIso || eventoIdNum === null) throw new Error("Evento invalido");
      return await iniciarPartidaNoEvento(dataIso, eventoIdNum, partidaId);
    },
    onSuccess: async () => {
      await Promise.all([workspaceQuery.refetch(), timelineQuery.refetch()]);
      setSelectedTab("partida-atual");
    },
  });

  const endPartidaMutation = useMutation({
    mutationFn: async ({ partidaId }: { partidaId: number }) => {
      if (!dataIso || eventoIdNum === null) throw new Error("Evento invalido");
      return await encerrarPartidaNoEvento(dataIso, eventoIdNum, partidaId);
    },
    onSuccess: async () => {
      await Promise.all([workspaceQuery.refetch(), timelineQuery.refetch(), rotacaoQuery.refetch()]);
      setSelectedTab("fila");
    },
  });

  const salvarDuracaoMutation = useMutation({
    mutationFn: async ({ duracaoSegundos }: { duracaoSegundos: number }) => {
      if (!requestAuth || !eventoIdNum) throw new Error("Sessao invalida para atualizar duracao");
      return await atualizarConfiguracaoRotacaoEvento(
        eventoIdNum,
        {
          duracao_partida_segundos: duracaoSegundos,
          ...(rotacaoQuery.data?.version != null ? { expected_version: rotacaoQuery.data.version } : {}),
        },
        requestAuth,
      );
    },
    onSuccess: async () => {
      await rotacaoQuery.refetch();
    },
  });

  const createAndStartPartidaMutation = useMutation({
    mutationFn: async () => {
      if (!dataIso || eventoIdNum === null || !workspaceLegacy) {
        throw new Error("Evento invalido");
      }

      const timesOrdenados = [...workspaceLegacy.equipes.times].sort(
        (a, b) => b.jogadoresIds.length - a.jogadoresIds.length,
      );
      if (timesOrdenados.length < 2) {
        throw new Error("Monte ao menos 2 equipes antes de criar partida.");
      }

      const partida = await criarPartidaNoEvento(dataIso, eventoIdNum, {
        timeAId: timesOrdenados[0].id,
        timeBId: timesOrdenados[1].id,
      });
      await iniciarPartidaNoEvento(dataIso, eventoIdNum, partida.id);
      return partida;
    },
    onSuccess: async () => {
      await Promise.all([workspaceQuery.refetch(), timelineQuery.refetch(), rotacaoQuery.refetch()]);
      setSelectedTab("partida-atual");
    },
  });

  const createNextPartidaMutation = useMutation({
    mutationFn: async ({
      partidaOrigemId,
      timeAId,
      timeBId,
      clientCommandId,
    }: {
      partidaOrigemId: number;
      timeAId: string;
      timeBId: string;
      clientCommandId: string;
    }) => {
      if (!requestAuth || !eventoIdNum || !rotacaoQuery.data) throw new Error("Rotacao indisponivel");
      return await criarProximaPartidaEvento(
        eventoIdNum,
        {
          partida_origem_id: partidaOrigemId,
          time_a_id: Number(timeAId),
          time_b_id: Number(timeBId),
          expected_rotation_version: rotacaoQuery.data.version,
          client_command_id: clientCommandId,
        },
        requestAuth,
      );
    },
    onSuccess: async () => {
      await Promise.all([workspaceQuery.refetch(), rotacaoQuery.refetch(), timelineQuery.refetch()]);
      setSelectedTab("partida-atual");
    },
  });

  const participanteItems = participantesQuery.data?.participants ?? [];
  const presentesItems = participantesQuery.data?.presentes ?? [];

  const jogadorNomeById = useMemo(() => {
    if (!workspaceLegacy) return {};
    return workspaceLegacy.equipes.jogadores.reduce<Record<number, string>>((acc, item) => {
      acc[item.jogadorId] = item.nome;
      return acc;
    }, {});
  }, [workspaceLegacy]);

  const timesDaPartidaAtual = useMemo(() => {
    if (!workspaceLegacy || !partidaEmAndamento) return [];
    return workspaceLegacy.equipes.times
      .filter((time) => time.id === partidaEmAndamento.timeAId || time.id === partidaEmAndamento.timeBId)
      .map((time) => ({ id: time.id, nome: time.nome }));
  }, [workspaceLegacy, partidaEmAndamento]);

  const jogadoresDaPartidaAtual = useMemo(() => {
    if (!workspaceLegacy || !partidaEmAndamento) return [];
    const idsTimesAtivos = new Set([partidaEmAndamento.timeAId, partidaEmAndamento.timeBId]);
    return workspaceLegacy.equipes.jogadores.filter((j) => j.timeId && idsTimesAtivos.has(j.timeId));
  }, [workspaceLegacy, partidaEmAndamento]);
  const partidaAtivaTimeIds = useMemo(() => {
    if (!partidaEmAndamento) return [];
    return [partidaEmAndamento.timeAId, partidaEmAndamento.timeBId];
  }, [partidaEmAndamento]);

  const primeiraPartidaPlanejada =
    workspaceLegacy?.partidas.find((p) => p.status === "PLANEJADA") ?? null;
  const proximosTimesCompletos = rotacaoQuery.data?.indicadores.proximos_times_completos ?? 0;
  const jogadoresAguardandoComplemento =
    rotacaoQuery.data?.indicadores.jogadores_aguardando_complemento ?? 0;
  const sugestaoPartida = (() => {
    if (!workspaceLegacy) return null;
    const timesOrdenados = [...workspaceLegacy.equipes.times].sort(
      (a, b) => b.jogadoresIds.length - a.jogadoresIds.length,
    );
    if (timesOrdenados.length < 2) return null;
    return {
      timeA: timesOrdenados[0],
      timeB: timesOrdenados[1],
    };
  })();

  if (!dataIso || eventoIdNum === null) {
    return (
      <main className="mx-auto max-w-7xl p-4" data-testid="page-evento">
        <Button variant="ghost" className="mb-3" onClick={() => navigate("/dias")}>
          Voltar
        </Button>
        <h1 className="text-xl font-semibold">Parametros invalidos</h1>
        <p className="text-sm text-muted-foreground">Data ou evento nao informado na URL.</p>
      </main>
    );
  }

  if (workspaceQuery.isLoading && !workspace) {
    return (
      <main className="mx-auto max-w-7xl p-4" data-testid="page-evento">
        <Button variant="ghost" className="mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
          Voltar
        </Button>
        <h1 className="text-xl font-semibold">Evento</h1>
        <p className="text-sm text-muted-foreground">Carregando dados do evento...</p>
      </main>
    );
  }

  if (!workspace || !workspaceLegacy || !caps) {
    return (
      <main className="mx-auto max-w-7xl p-4" data-testid="page-evento">
        <Button variant="ghost" className="mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
          Voltar
        </Button>
        <h1 className="text-xl font-semibold">Evento nao encontrado</h1>
        <p className="text-sm text-muted-foreground">Nao foi possivel localizar o evento selecionado.</p>
      </main>
    );
  }

  const currentStep =
    workspace.meta.status === "ENCERRADO" || workspace.meta.status === "CANCELADO"
      ? "historico"
      : partidaEmAndamento
        ? "partida-atual"
        : workspace.kpis.presentes === 0
          ? "presenca"
          : workspace.equipes.times.length < 2
            ? "equipes"
            : "fila";
  const stepLabels: Record<string, string> = {
    presenca: "Presenca",
    equipes: "Equipes",
    fila: "Fila",
    "partida-atual": "Partida Atual",
    historico: "Historico",
  };
  const pendencias = [
    workspace.kpis.presentes === 0 ? "Confirme ao menos uma presenca." : null,
    workspace.equipes.times.length < 2 ? "Monte ao menos duas equipes." : null,
    !partidaEmAndamento && workspace.meta.status === "EM_ANDAMENTO"
      ? "Nenhuma partida esta em andamento."
      : null,
  ].filter((item): item is string => Boolean(item));

  const tabMap = {
    presenca: {
      id: "presenca",
      label: "Presenca",
      content: (
        <div className="space-y-4">
          <div className="rounded-md bg-slate-100 p-2 text-sm text-slate-600">
            Confirme quem participa antes de organizar as equipes.
          </div>

          <EventoStatusActions
            auth={requestAuth}
            caps={caps}
            eventoId={eventoIdNum}
            status={workspace.meta.status}
            onChanged={async () => {
              await Promise.all([workspaceQuery.refetch(), rotacaoQuery.refetch(), timelineQuery.refetch()]);
            }}
          />

          {isJogoLivre ? (
            <div className="space-y-4">
              <EventoPresenceActionsCard
                auth={requestAuth}
                caps={caps}
                eventoId={eventoIdNum}
                eventoStatus={workspace.meta.status}
                participants={participanteItems}
                onChanged={async () => {
                  await Promise.all([participantesQuery.refetch(), workspaceQuery.refetch(), rotacaoQuery.refetch()]);
                }}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <ParticipantesPanel
                  participants={participanteItems}
                  isLoading={participantesQuery.isLoading}
                  error={participantesQuery.error instanceof Error ? participantesQuery.error.message : null}
                />
                <FilaChegadaPanel presentes={presentesItems} />
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-slate-100 p-2 text-sm text-slate-600">
              Para AULA, a presenca usa a lista persistida da turma.
            </div>
          )}

          {!isJogoLivre ? (
            <WorkspaceEquipesPanel
              dataIso={workspaceLegacy.meta.data_iso}
              eventoId={eventoIdNum}
              meta={workspaceLegacy.meta}
              equipes={workspaceLegacy.equipes}
              showEventStatusCard={false}
              mode="presence"
              onRefresh={async () => {
                await workspaceQuery.refetch();
              }}
            />
          ) : null}

          <div className="flex justify-end">
            <Button onClick={() => setSelectedTab("equipes")}>Avancar para Equipes</Button>
          </div>
        </div>
      ),
    },
    equipes: {
      id: "equipes",
      label: "Equipes",
      content: (
        <div className="space-y-4">
          <WorkspaceEquipesPanel
            dataIso={workspaceLegacy.meta.data_iso}
            eventoId={eventoIdNum}
            meta={workspaceLegacy.meta}
            equipes={workspaceLegacy.equipes}
            showEventStatusCard={false}
            mode="teams"
            teamSizeRef={rotacaoQuery.data?.team_size_ref ?? null}
            onSaveTeamSizeRef={async (nextTeamSizeRef) => {
              if (!requestAuth || !eventoIdNum) throw new Error("Sessao invalida para atualizar configuracao");
              await atualizarConfiguracaoRotacaoEvento(
                eventoIdNum,
                {
                  team_size_ref: nextTeamSizeRef,
                  ...(rotacaoQuery.data?.version != null ? { expected_version: rotacaoQuery.data.version } : {}),
                },
                requestAuth,
              );
              await rotacaoQuery.refetch();
            }}
            onRefresh={async () => {
              await Promise.all([workspaceQuery.refetch(), rotacaoQuery.refetch()]);
            }}
          />
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setSelectedTab("presenca")}>Voltar para Presenca</Button>
            <Button onClick={() => setSelectedTab("fila")}>Avancar para Fila</Button>
          </div>
        </div>
      ),
    },
    fila: {
      id: "fila",
      label: "Fila",
      content: (
        <div className="space-y-4">
          <RotacaoFilaPanel
            estado={rotacaoQuery.data ?? null}
            jogadorNomeById={jogadorNomeById}
            times={workspaceLegacy.equipes.times}
            partidaAtivaTimeIds={partidaAtivaTimeIds}
            onSaveQueues={async ({ fila_jogadores_ids, proximos_times }) => {
              if (!requestAuth || !eventoIdNum) throw new Error("Sessao invalida para atualizar fila");
              await atualizarConfiguracaoRotacaoEvento(
                eventoIdNum,
                {
                  fila_jogadores_ids,
                  proximos_times,
                  ...(rotacaoQuery.data?.version != null ? { expected_version: rotacaoQuery.data.version } : {}),
                },
                requestAuth,
              );
              await rotacaoQuery.refetch();
            }}
            onPreview={async (grupoId: string): Promise<RotacaoPreview> => {
              const result = await previewSorteioMutation.mutateAsync({ grupoId });
              await rotacaoQuery.refetch();
              return result;
            }}
            onConfirm={async (token: string) => {
              await confirmSorteioMutation.mutateAsync({ token });
            }}
            ultimaPartidaEncerrada={ultimaPartidaEncerrada}
            onCreateNextMatch={async (payload) => await createNextPartidaMutation.mutateAsync(payload)}
            onConvertLegacyGroup={async (grupo) => {
              const time = await criarTimeNoEvento(workspaceLegacy.meta.data_iso, String(eventoIdNum), {
                nome: `Time convertido ${workspaceLegacy.equipes.times.length + 1}`,
              });
              for (const jogadorEventoId of grupo.jogadores_ids) {
                await moverJogadorNoEvento(
                  workspaceLegacy.meta.data_iso,
                  eventoIdNum,
                  jogadorEventoId,
                  time.id,
                );
              }
              const refreshedRotation = await rotacaoQuery.refetch();
              if (!requestAuth || !refreshedRotation.data) throw new Error("Rotacao indisponivel apos conversao");
              await atualizarConfiguracaoRotacaoEvento(
                eventoIdNum,
                {
                  fila_jogadores_ids: [...refreshedRotation.data.fila_jogadores_ids],
                  proximos_times: refreshedRotation.data.proximos_times.map((item) =>
                    item.grupo_id === grupo.grupo_id
                      ? { grupo_id: `time:${time.id}`, jogadores_ids: [...grupo.jogadores_ids] }
                      : { grupo_id: item.grupo_id, jogadores_ids: [...item.jogadores_ids] },
                  ),
                  expected_version: refreshedRotation.data.version,
                },
                requestAuth,
              );
              await Promise.all([workspaceQuery.refetch(), rotacaoQuery.refetch()]);
              return { ...time, jogadoresIds: [...grupo.jogadores_ids] };
            }}
          />
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setSelectedTab("equipes")}>Voltar para Equipes</Button>
            <Button onClick={() => setSelectedTab("partida-atual")}>Ver Partida Atual</Button>
          </div>
        </div>
      ),
    },
    "partida-atual": {
      id: "partida-atual",
      label: "Partida Atual",
      content: (
        <div className="space-y-4">
          {isJogoLivre && !hasAnyPartida ? (
            <SeedPartidaCard
              auth={requestAuth}
              caps={caps}
              eventoId={eventoIdNum}
              presentesCount={presentesItems.length}
              onSeeded={async () => {
                await Promise.all([workspaceQuery.refetch(), participantesQuery.refetch(), timelineQuery.refetch()]);
              }}
            />
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {hasPartidaAoVivo ? (
              <TimelineLances
                items={timelineQuery.data ?? []}
                isLoading={timelineQuery.isLoading}
                error={timelineQuery.error instanceof Error ? timelineQuery.error.message : null}
              />
            ) : (
              <div className="rounded-md border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">Nenhuma partida em andamento.</p>
                <p className="mb-3">
                  A aba Partida Atual exibe apenas a execução da partida ativa. Inicie uma partida para abrir
                  cronometro e lances.
                </p>
                <div className="mb-3 rounded-md border border-dashed bg-slate-50 p-2 text-xs text-slate-700">
                  Complete os proximos times na aba <strong>Fila</strong>.
                  {jogadoresAguardandoComplemento > 0 ? (
                    <div className="mt-1 text-amber-700">
                      Ha {jogadoresAguardandoComplemento} jogador(es) aguardando complemento na fila.
                    </div>
                  ) : null}
                </div>
                {primeiraPartidaPlanejada ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void startPartidaMutation.mutateAsync({ partidaId: primeiraPartidaPlanejada.id })}
                      disabled={startPartidaMutation.isPending}
                    >
                      Iniciar partida planejada #{primeiraPartidaPlanejada.id}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedTab("fila")}>
                      Completar proximos times na Fila
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedTab("historico")}>
                      Consultar Historico
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs">
                      Nenhuma partida planejada. Crie e inicie agora com as equipes persistidas.
                    </div>
                    {proximosTimesCompletos < 2 ? (
                      <div className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                        Ainda nao ha 2 proximos times completos na fila para o proximo confronto.
                      </div>
                    ) : (
                      <div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-800">
                        A fila ja tem {proximosTimesCompletos} grupo(s) completo(s) para proximas partidas.
                      </div>
                    )}
                    {sugestaoPartida ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          onClick={() => void createAndStartPartidaMutation.mutateAsync()}
                          disabled={createAndStartPartidaMutation.isPending}
                        >
                          Criar + iniciar: {sugestaoPartida.timeA.nome} x {sugestaoPartida.timeB.nome}
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedTab("fila")}>
                          Completar proximos times (Fila)
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedTab("historico")}>
                          Consultar partidas anteriores
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setSelectedTab("fila")}>
                          Completar proximos times (Fila)
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedTab("historico")}>
                          Consultar Historico
                        </Button>
                      </div>
                    )}
                    {createAndStartPartidaMutation.error instanceof Error ? (
                      <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">
                        {createAndStartPartidaMutation.error.message}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <PartidaAoVivoCard
              partidaAtiva={partidaEmAndamento}
              partidaFallback={partidaEmFoco}
              eventoStatus={workspace.meta.status}
              duracaoPartidaSegundos={rotacaoQuery.data?.duracao_partida_segundos}
              canManagePartida={caps.has("event_admin_actions")}
              onEncerrarPartida={
                partidaEmAndamento
                  ? async () => {
                      await endPartidaMutation.mutateAsync({ partidaId: partidaEmAndamento.id });
                    }
                  : undefined
              }
              onSalvarDuracao={async (duracaoSegundos) => {
                await salvarDuracaoMutation.mutateAsync({ duracaoSegundos });
              }}
            />
            <QuickAddLance
              auth={requestAuth}
              caps={caps}
              eventoStatus={workspace.meta.status}
              partidaStatus={partidaEmAndamento?.status ?? null}
              partidaId={partidaEmAndamento?.id ?? null}
              partidaInicioAt={partidaEmAndamento?.inicio_at ?? null}
              jogadores={jogadoresDaPartidaAtual}
              times={timesDaPartidaAtual}
              onSubmitted={async () => {
                await Promise.all([timelineQuery.refetch(), workspaceQuery.refetch()]);
              }}
            />
          </div>
          </div>
        </div>
      ),
    },
    historico: {
      id: "historico",
      label: "Historico",
      content: (
        <div className="space-y-4">
          <WorkspacePartidasPanel
            dataIso={workspaceLegacy.meta.data_iso}
            eventoId={eventoIdNum}
            equipes={workspaceLegacy.equipes}
            partidas={partidasParaPainel}
            mode={partidasPanelMode}
            title="Historico de Partidas Encerradas"
            onRefresh={async () => {
              await workspaceQuery.refetch();
            }}
          />
          {partidasEncerradas.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Lances por partida encerrada</div>
              <div className="flex flex-wrap gap-2">
                {partidasEncerradas.map((partida) => (
                  <Button
                    key={`hist-${partida.id}`}
                    size="sm"
                    variant={selectedHistoryPartidaId === partida.id ? "default" : "outline"}
                    onClick={() => setSelectedHistoryPartidaId(partida.id)}
                  >
                    Partida #{partida.id}
                  </Button>
                ))}
              </div>
              {selectedHistoryPartidaId ? (
                <TimelineLances
                  items={historyTimelineQuery.data ?? []}
                  isLoading={historyTimelineQuery.isLoading}
                  error={historyTimelineQuery.error instanceof Error ? historyTimelineQuery.error.message : null}
                />
              ) : null}
            </div>
          ) : null}
          <TimesPanel equipes={workspaceLegacy.equipes} />
        </div>
      ),
    },
  } as const;

  const tabItems = ["presenca", "equipes", "fila", "partida-atual", "historico"].map(
    (tabId) => tabMap[tabId as keyof typeof tabMap],
  );

  const hasAuthIssue = [
    participantesQuery.error,
    timelineQuery.error,
    historyTimelineQuery.error,
    rotacaoQuery.error,
    previewSorteioMutation.error,
    confirmSorteioMutation.error,
  ].some((err) => err instanceof Error && err.message.startsWith("401"));

  return (
    <main className="mx-auto max-w-7xl p-4" data-testid="page-evento">
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(`/dias/${dataIso}`)}>
          Voltar para o dia
        </Button>
      </div>

      <EventoHeader meta={workspace.meta} header={workspace.header} source={source} />
      <EventoContextBar
        meta={workspace.meta}
        kpis={workspace.kpis}
        partidaAtivaId={partidaEmAndamento?.id ?? null}
      />

      <section className="mb-4 grid gap-3 rounded-md border bg-white p-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Etapa operacional atual</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{stepLabels[currentStep]}</div>
          <p className="mt-1 text-xs text-slate-500">Derivada do estado persistido; a aba aberta nao altera o progresso.</p>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Pendencias e avisos</div>
          {pendencias.length === 0 && workspace.warnings.length === 0 ? (
            <p className="mt-1 text-sm text-emerald-700">Nenhuma pendencia operacional detectada.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm text-amber-800">
              {pendencias.map((item) => <li key={item}>• {item}</li>)}
              {workspace.warnings.map((warning) => <li key={`${warning.code}-${warning.message}`}>• {warning.message}</li>)}
            </ul>
          )}
        </div>
      </section>

      {hasAuthIssue ? (
        <div className="mb-3 rounded-md bg-amber-50 p-2 text-sm text-amber-800">
          Sessao invalida ou expirada para endpoints canonicos. Refaca login em /login.
        </div>
      ) : null}

      {workspaceQuery.error instanceof Error ? (
        <div className="mb-4 rounded-md bg-amber-50 p-2 text-sm text-amber-700">
          {workspaceQuery.error.message}
        </div>
      ) : null}

      <EventoBottomTabs items={tabItems} value={selectedTab} onValueChange={setSelectedTab} />
    </main>
  );
}
