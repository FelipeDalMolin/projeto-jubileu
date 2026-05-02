import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/button";
import WorkspaceEquipesPanel from "../../components/aula/WorkspaceEquipesPanel";
import WorkspacePartidasPanel from "../../components/aula/WorkspacePartidasPanel";
import { useAuthSession } from "../../hooks/useAuthSession";
import { useWorkspaceEvento } from "../../hooks/useWorkspaceEvento";
import type { AuthHeaders } from "../../services/eventosService";
import { EventoBottomTabs } from "./components/EventoBottomTabs";
import { EventoContextBar } from "./components/EventoContextBar";
import { EventoHeader } from "./components/EventoHeader";
import { EventoPresenceActionsCard } from "./components/EventoPresenceActionsCard";
import { FilaChegadaPanel } from "./components/FilaChegadaPanel";
import { ParticipantesPanel } from "./components/ParticipantesPanel";
import { PartidaAoVivoCard } from "./components/PartidaAoVivoCard";
import { QuickAddLance } from "./components/QuickAddLance";
import { TimelineLances } from "./components/TimelineLances";
import { TimesPanel } from "./components/TimesPanel";
import { EventoStatusActions } from "./components/EventoStatusActions";
import { resolveEventoCapabilities } from "./capabilities";
import { useEventoLiveData } from "./hooks/useEventoLiveData";
import { useEventoPagePollingController } from "./hooks/useEventoPagePollingController";

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
  const requestAuth = toRequestAuth(auth.getRequestAuth);
  const eventoIdNum = toEventoIdNumberOrNull(eventoId);

  const { workspace, workspaceLegacy, isLoading, error, refresh, poll } = useWorkspaceEvento({
    dataIso,
    eventoId,
    enabled: false,
    manualControl: true,
  });

  const partidaAoVivo = useMemo(() => {
    if (!workspaceLegacy) return null;
    return (
      workspaceLegacy.partidas.find((partida) => partida.status === "EM_ANDAMENTO") ??
      workspaceLegacy.partidas[0] ??
      null
    );
  }, [workspaceLegacy]);

  const caps = useMemo(() => {
    if (!workspace || !auth.user) return null;
    return resolveEventoCapabilities({
      tipo: workspace.meta.tipo,
      status: workspace.meta.status,
      role: auth.user.role,
    });
  }, [auth.user, workspace]);

  const eventoTipo = workspace?.meta.tipo ?? null;
  const eventoStatus = workspace?.meta.status ?? null;

  const participantsPollingEnabled = activeTab === "presenca-equipes";
  const timelinePollingEnabled = activeTab === "ao-vivo";
  const isJogoLivre = eventoTipo === "JOGO_LIVRE";
  const hasPartidaAoVivo = Boolean(partidaAoVivo?.status === "EM_ANDAMENTO");

  const liveData = useEventoLiveData({
    eventoId: eventoIdNum ?? 0,
    partidaId: partidaAoVivo?.id ?? null,
    auth: requestAuth,
    timelineEnabled: Boolean(caps && requestAuth && eventoIdNum && timelinePollingEnabled && hasPartidaAoVivo),
    participantsEnabled: Boolean(
      caps &&
        requestAuth &&
        eventoIdNum &&
        participantsPollingEnabled &&
        isJogoLivre &&
        caps.has("participants_view"),
    ),
    manualControl: true,
  });

  useEffect(() => {
    if (!eventoIdNum) return;
    void refresh();
  }, [eventoIdNum, refresh]);

  const pollingConfig = useMemo(
    () => ({
      workspace: {
        enabled: Boolean(eventoIdNum),
        intervalMs: 4000,
        poll,
      },
      timeline: {
        enabled: Boolean(
          caps &&
            requestAuth &&
            eventoIdNum &&
            timelinePollingEnabled &&
            hasPartidaAoVivo &&
            caps.has("lances"),
        ),
        intervalMs: 2200,
        poll: liveData.pollTimelineOnly,
      },
      participants: {
        enabled: Boolean(
          caps &&
            requestAuth &&
            eventoIdNum &&
            participantsPollingEnabled &&
            isJogoLivre &&
            caps.has("participants_view"),
        ),
        intervalMs: 3000,
        poll: liveData.pollParticipantsOnly,
      },
    }),
    [
      caps,
      eventoIdNum,
      hasPartidaAoVivo,
      isJogoLivre,
      liveData.pollParticipantsOnly,
      liveData.pollTimelineOnly,
      participantsPollingEnabled,
      poll,
      requestAuth,
      timelinePollingEnabled,
    ],
  );

  useEventoPagePollingController(pollingConfig);

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

  if (isLoading && !workspace) {
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
    "ao-vivo": {
      id: "ao-vivo",
      label: "Ao Vivo",
      content: (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {hasPartidaAoVivo ? (
              <TimelineLances
                items={liveData.timelineItems}
                isLoading={liveData.timelineLoading}
                error={liveData.timelineError}
              />
            ) : (
              <div className="rounded-md border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">Pre-jogo</p>
                <ul className="list-disc pl-4">
                  <li>Marque presenca e organize equipes na aba Presenca & Equipes.</li>
                  <li>Crie a primeira partida na aba Partidas (ou seed para JOGO_LIVRE).</li>
                  <li>Inicie o evento para habilitar timeline e quick add de lances.</li>
                </ul>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <PartidaAoVivoCard partida={partidaAoVivo} eventoStatus={workspace.meta.status} />
            <EventoStatusActions
              auth={requestAuth}
              caps={caps}
              eventoId={eventoIdNum}
              status={eventoStatus ?? "PLANEJADO"}
              onChanged={async () => {
                await refresh();
                await liveData.forceRefresh();
              }}
            />
            <QuickAddLance
              auth={requestAuth}
              caps={caps}
              eventoStatus={eventoStatus ?? "PLANEJADO"}
              partidaStatus={partidaAoVivo?.status ?? null}
              partidaId={partidaAoVivo?.id ?? null}
              jogadores={workspaceLegacy.equipes.jogadores}
              times={workspaceLegacy.equipes.times.map((time) => ({ id: time.id, nome: time.nome }))}
              onSubmitted={liveData.forceRefresh}
            />
          </div>
        </div>
      ),
    },
    "presenca-equipes": {
      id: "presenca-equipes",
      label: "Presenca & Equipes",
      content: (
        <div className="space-y-4">
          <div className="rounded-md bg-slate-100 p-2 text-sm text-slate-600">
            Presenca/check-in e montagem de equipes ficam unificados nesta aba para operacao de jogo.
          </div>
          {isJogoLivre ? (
            <div className="space-y-4">
              <EventoPresenceActionsCard
                auth={requestAuth}
                caps={caps}
                eventoId={eventoIdNum}
                eventoStatus={eventoStatus ?? "PLANEJADO"}
                participants={liveData.participants}
                onChanged={async () => {
                  await liveData.refreshParticipantsOnly();
                  await refresh();
                }}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <ParticipantesPanel
                  participants={liveData.participants}
                  isLoading={liveData.isLoadingParticipants}
                  error={liveData.participantsError}
                />
                <FilaChegadaPanel presentes={liveData.presentes} />
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
            onRefresh={async () => {
              await refresh();
              await liveData.forceRefresh();
            }}
          />
        </div>
      ),
    },
    partidas: {
      id: "partidas",
      label: "Partidas",
      content: (
        <div className="space-y-4">
          <WorkspacePartidasPanel
            dataIso={workspaceLegacy.meta.data_iso}
            aulaId={eventoIdNum}
            equipes={workspaceLegacy.equipes}
            partidas={workspaceLegacy.partidas}
            onRefresh={async () => {
              await refresh();
              await liveData.forceRefresh();
            }}
          />
          <TimesPanel equipes={workspaceLegacy.equipes} />
        </div>
      ),
    },
  } as const;

  const tabOrder =
    workspace.meta.tipo === "AULA"
      ? (["presenca-equipes", "ao-vivo", "partidas"] as const)
      : (["ao-vivo", "presenca-equipes", "partidas"] as const);
  const tabItems = tabOrder.map((tabId) => tabMap[tabId]);

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
      <EventoContextBar meta={workspace.meta} kpis={workspace.kpis} partidaAtivaId={partidaAoVivo?.id ?? null} />

      {(liveData.timelineError?.startsWith("401") || liveData.participantsError?.startsWith("401")) && (
        <div className="mb-3 rounded-md bg-amber-50 p-2 text-sm text-amber-800">
          Sessao invalida ou expirada para endpoints canonicos. Refaça login em /login.
        </div>
      )}

      {error ? (
        <div className="mb-4 rounded-md bg-amber-50 p-2 text-sm text-amber-700">{error}</div>
      ) : null}

      <EventoBottomTabs items={tabItems} value={activeTab} onValueChange={setActiveTab} />
    </main>
  );
}
