import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import WorkspaceEquipesPanel from "../../components/aula/WorkspaceEquipesPanel";
import WorkspaceHeader from "../../components/aula/WorkspaceHeader";
import WorkspaceKpis from "../../components/aula/WorkspaceKpis";
import WorkspacePartidasPanel from "../../components/aula/WorkspacePartidasPanel";
import WorkspaceWarnings from "../../components/aula/WorkspaceWarnings";
import { useAuthSession } from "../../hooks/useAuthSession";
import { useWorkspaceEvento } from "../../hooks/useWorkspaceEvento";
import type { AuthHeaders } from "../../services/eventosService";
import { resolveEventoCapabilities } from "./capabilities";
import EventoActionsPanel from "./panels/EventoActionsPanel";

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
  const requestAuth = toRequestAuth(auth.getRequestAuth);
  const eventoIdNum = toEventoIdNumberOrNull(eventoId);

  const { workspace, isLoading, error, refresh } = useWorkspaceEvento({
    dataIso,
    eventoId,
  });

  const caps = useMemo(() => {
    if (!workspace || !auth.user) return null;
    return resolveEventoCapabilities({
      tipo: workspace.meta.tipo,
      status: workspace.meta.status,
      role: auth.user.role,
    });
  }, [auth.user, workspace]);

  if (!dataIso || eventoIdNum === null) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate("/dias")}>
          Voltar
        </button>
        <h1>Parametros invalidos</h1>
        <p>Data ou evento nao informado na URL.</p>
      </main>
    );
  }

  if (isLoading && !workspace) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
          Voltar
        </button>
        <h1>Evento</h1>
        <p>Carregando dados do evento...</p>
      </main>
    );
  }

  if (!workspace || !caps) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
          Voltar
        </button>
        <h1>Evento nao encontrado</h1>
        <p>Nao foi possivel localizar o evento selecionado.</p>
      </main>
    );
  }

  return (
    <main className="container py-3">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <button className="btn btn-link p-0" onClick={() => navigate(`/dias/${dataIso}`)}>
          Voltar para o dia
        </button>
        {source === "aula_legacy" && <small className="text-muted">Rota legada /aulas em compatibilidade</small>}
      </div>

      <WorkspaceHeader meta={workspace.meta} header={workspace.header} />
      <WorkspaceKpis kpis={workspace.kpis} />
      {error && <div className="alert alert-warning py-2">{error}</div>}
      <WorkspaceWarnings warnings={workspace.warnings} />

      <EventoActionsPanel
        eventoId={eventoIdNum}
        caps={caps}
        auth={requestAuth}
        defaultPartidaId={workspace.partidas[0]?.id ?? null}
        onRefreshWorkspace={refresh}
      />

      {caps.has("workspace_equipes") && (
        <WorkspaceEquipesPanel
          dataIso={workspace.meta.data_iso}
          aulaId={eventoIdNum}
          meta={workspace.meta}
          equipes={workspace.equipes}
          onRefresh={refresh}
        />
      )}

      {caps.has("workspace_partidas") && (
        <WorkspacePartidasPanel
          dataIso={workspace.meta.data_iso}
          aulaId={eventoIdNum}
          equipes={workspace.equipes}
          partidas={workspace.partidas}
          onRefresh={refresh}
        />
      )}
    </main>
  );
}
