import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "../../components/ui/button";
import WorkspaceEquipesPanel from "../../components/aula/WorkspaceEquipesPanel";
import WorkspacePartidasPanel from "../../components/aula/WorkspacePartidasPanel";
import { useAuthSession } from "../../hooks/useAuthSession";
import { criarPartidaNaAula, encerrarPartidaNaAula, iniciarPartidaNaAula } from "../../services/diasService";
import {
  listarLancesEvento,
  listarParticipantesEvento,
  listarPresentesEvento,
  atualizarConfiguracaoRotacaoEvento,
  mapLanceToTimelineItem,
  obterEstadoRotacaoEvento,
  previewSorteioRotacaoEvento,
  confirmarSorteioRotacaoEvento,
  type AuthHeaders,
} from "../../services/eventosService";
import { obterWorkspaceAula } from "../../services/workspaceAulaService";
import type { RotacaoPreview } from "../../types/rotacao";
import type { WorkspaceAula } from "../../types/workspaceAula";
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
import { toWorkspaceEvento } from "./workspaceEventoAdapter";

type Props = {
  dataIso?: string;
  eventoId?: string;
  source: "evento" | "aula_legacy";
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

export default function WorkspaceEventoPage({ dataIso, eventoId, source }: Props) {
  const navigate = useNavigate();
  const auth = useAuthSession();
  const [activeTab, setActiveTab] = useState("presenca-equipes");
  const [selectedHistoryPartidaId, setSelectedHistoryPartidaId] = useState<number | null>(null);
  const requestAuth = toRequestAuth(auth.getRequestAuth);
  const eventoIdNum = toEventoIdNumberOrNull(eventoId);
  const workspaceCacheRef = useRef<WorkspaceAula | null>(null);

  const workspaceQuery = useQuery({
    queryKey: ["workspace-evento", dataIso, eventoIdNum],
    enabled: Boolean(dataIso && eventoIdNum !== null),
    queryFn: async () => {
      if (!dataIso || eventoIdNum === null) return null;
      const resp = await obterWorkspaceAula(
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

  const workspaceLegacy = workspaceQuery.data ?? null;
  const workspace = useMemo(
    () => (workspaceLegacy ? toWorkspaceEvento(workspaceLegacy) : null),
    [workspaceLegacy],
  );

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
  const partidasPanelMode = workspace?.meta.status === "EM_ANDAMENTO" ? "full" : "history";
  const partidasParaPainel = partidasPanelMode === "full" ? (workspaceLegacy?.partidas ?? []) : partidasEncerradas;

  const isJogoLivre = workspace?.meta.tipo === "JOGO_LIVRE";
  const hasPartidaAoVivo = Boolean(partidaEmAndamento);
  const hasAnyPartida = Boolean(workspaceLegacy?.partidas.length);

  const participantesQuery = useQuery({
    queryKey: ["evento-participantes", eventoIdNum],
    enabled: Boolean(
      requestAuth &&
        eventoIdNum &&
        activeTab === "presenca-equipes" &&
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
    refetchInterval: () => (document.hidden ? false : 3000),
  });

  const timelineQuery = useQuery({
    queryKey: ["evento-timeline", eventoIdNum, partidaEmAndamento?.id ?? null],
    enabled: Boolean(
      requestAuth &&
        eventoIdNum &&
        activeTab === "ao-vivo" &&
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
    refetchInterval: () => (document.hidden ? false : 2200),
  });

  const historyTimelineQuery = useQuery({
    queryKey: ["evento-partidas-history-lances", eventoIdNum, selectedHistoryPartidaId],
    enabled: Boolean(
      requestAuth &&
        eventoIdNum &&
        activeTab === "partidas" &&
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
    refetchInterval: () => (document.hidden ? false : 3000),
  });

  const rotacaoQuery = useQuery({
    queryKey: ["evento-rotacao-estado", eventoIdNum],
    enabled: Boolean(
      requestAuth &&
        eventoIdNum &&
        (activeTab === "presenca-equipes" || activeTab === "ao-vivo"),
    ),
    queryFn: async () => {
      if (!requestAuth || !eventoIdNum) return null;
      return await obterEstadoRotacaoEvento(eventoIdNum, requestAuth);
    },
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
      return await iniciarPartidaNaAula(dataIso, eventoIdNum, partidaId);
    },
    onSuccess: async () => {
      await Promise.all([workspaceQuery.refetch(), timelineQuery.refetch()]);
    },
  });

  const endPartidaMutation = useMutation({
    mutationFn: async ({ partidaId }: { partidaId: number }) => {
      if (!dataIso || eventoIdNum === null) throw new Error("Evento invalido");
      return await encerrarPartidaNaAula(dataIso, eventoIdNum, partidaId);
    },
    onSuccess: async () => {
      await Promise.all([workspaceQuery.refetch(), timelineQuery.refetch(), rotacaoQuery.refetch()]);
    },
  });

  const salvarDuracaoMutation = useMutation({
    mutationFn: async ({ duracaoSegundos }: { duracaoSegundos: number }) => {
      if (!requestAuth || !eventoIdNum) throw new Error("Sessao invalida para atualizar duracao");
      return await atualizarConfiguracaoRotacaoEvento(
        eventoIdNum,
        { duracao_partida_segundos: duracaoSegundos },
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

      const partida = await criarPartidaNaAula(dataIso, eventoIdNum, {
        timeAId: timesOrdenados[0].id,
        timeBId: timesOrdenados[1].id,
      });
      await iniciarPartidaNaAula(dataIso, eventoIdNum, partida.id);
      return partida;
    },
    onSuccess: async () => {
      await Promise.all([workspaceQuery.refetch(), timelineQuery.refetch(), rotacaoQuery.refetch()]);
      setActiveTab("ao-vivo");
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
      <main className="mx-auto max-w-7xl p-4">
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
      <main className="mx-auto max-w-7xl p-4">
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
      <main className="mx-auto max-w-7xl p-4">
        <Button variant="ghost" className="mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
          Voltar
        </Button>
        <h1 className="text-xl font-semibold">Evento nao encontrado</h1>
        <p className="text-sm text-muted-foreground">Nao foi possivel localizar o evento selecionado.</p>
      </main>
    );
  }

  const tabMap = {
    "presenca-equipes": {
      id: "presenca-equipes",
      label: "Presenca & Equipes",
      content: (
        <div className="space-y-4">
          <div className="rounded-md bg-slate-100 p-2 text-sm text-slate-600">
            Presenca/check-in e montagem de equipes ficam unificados nesta aba para preparo operacional.
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
              Para eventos do tipo AULA, participantes/check-in canonicos nao se aplicam.
              Use a lista de jogadores da turma abaixo para presenca e montagem.
            </div>
          )}

          <WorkspaceEquipesPanel
            dataIso={workspaceLegacy.meta.data_iso}
            aulaId={eventoIdNum}
            meta={workspaceLegacy.meta}
            equipes={workspaceLegacy.equipes}
            showEventStatusCard={false}
            teamSizeRef={rotacaoQuery.data?.team_size_ref ?? null}
            onSaveTeamSizeRef={async (nextTeamSizeRef) => {
              if (!requestAuth || !eventoIdNum) throw new Error("Sessao invalida para atualizar configuracao");
              await atualizarConfiguracaoRotacaoEvento(
                eventoIdNum,
                { team_size_ref: nextTeamSizeRef },
                requestAuth,
              );
              await rotacaoQuery.refetch();
            }}
            onRefresh={async () => {
              await Promise.all([workspaceQuery.refetch(), rotacaoQuery.refetch()]);
            }}
          />

          <RotacaoFilaPanel
            estado={rotacaoQuery.data ?? null}
            jogadorNomeById={jogadorNomeById}
            times={workspaceLegacy.equipes.times}
            partidaAtivaTimeIds={partidaAtivaTimeIds}
            onSaveQueues={async ({ fila_jogadores_ids, proximos_times }) => {
              if (!requestAuth || !eventoIdNum) throw new Error("Sessao invalida para atualizar fila");
              await atualizarConfiguracaoRotacaoEvento(
                eventoIdNum,
                { fila_jogadores_ids, proximos_times },
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
          />
        </div>
      ),
    },
    "ao-vivo": {
      id: "ao-vivo",
      label: "Partida Atual",
      content: (
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
                  Complete os proximos times em <strong>Presenca & Equipes &gt; Fila / Proximos Times</strong>.
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
                    <Button variant="outline" onClick={() => setActiveTab("presenca-equipes")}>
                      Completar proximos times na Fila
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("partidas")}>
                      Ir para Partidas
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs">
                      Nenhuma partida planejada. Voce pode criar na aba Partidas ou criar+iniciar agora com as equipes montadas.
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
                        <Button variant="outline" onClick={() => setActiveTab("presenca-equipes")}>
                          Completar proximos times (Fila)
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab("partidas")}>
                          Escolher manualmente em Partidas
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setActiveTab("presenca-equipes")}>
                          Completar proximos times (Fila)
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab("partidas")}>
                          Ir para Partidas para criar confronto
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
      ),
    },
    partidas: {
      id: "partidas",
      label: "Partidas",
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
          <WorkspacePartidasPanel
            dataIso={workspaceLegacy.meta.data_iso}
            aulaId={eventoIdNum}
            equipes={workspaceLegacy.equipes}
            partidas={partidasParaPainel}
            mode={partidasPanelMode}
            title={partidasPanelMode === "full" ? "Partidas do Evento" : "Historico de Partidas Encerradas"}
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

  const tabItems = ["presenca-equipes", "ao-vivo", "partidas"].map((tabId) => tabMap[tabId]);

  const hasAuthIssue = [
    participantesQuery.error,
    timelineQuery.error,
    historyTimelineQuery.error,
    rotacaoQuery.error,
    previewSorteioMutation.error,
    confirmSorteioMutation.error,
  ].some((err) => err instanceof Error && err.message.startsWith("401"));

  return (
    <main className="mx-auto max-w-7xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(`/dias/${dataIso}`)}>
          Voltar para o dia
        </Button>
        {source === "aula_legacy" ? (
          <span className="text-xs text-muted-foreground">Compat mode: /aulas</span>
        ) : null}
      </div>

      <EventoHeader meta={workspace.meta} header={workspace.header} source={source} />
      <EventoContextBar
        meta={workspace.meta}
        kpis={workspace.kpis}
        partidaAtivaId={partidaEmAndamento?.id ?? null}
      />

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

      <EventoBottomTabs items={tabItems} value={activeTab} onValueChange={setActiveTab} />
    </main>
  );
}
