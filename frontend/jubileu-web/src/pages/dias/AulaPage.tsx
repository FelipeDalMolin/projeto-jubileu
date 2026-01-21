import { useNavigate, useParams } from "react-router-dom";

import WorkspaceEquipesPanel from "../../components/aula/WorkspaceEquipesPanel";
import WorkspaceHeader from "../../components/aula/WorkspaceHeader";
import WorkspaceKpis from "../../components/aula/WorkspaceKpis";
import WorkspacePartidasPanel from "../../components/aula/WorkspacePartidasPanel";
import WorkspaceWarnings from "../../components/aula/WorkspaceWarnings";
import { useWorkspaceAula } from "../../hooks/useWorkspaceAula";

function toAulaIdNumberOrNull(aulaId?: string): number | null {
  if (!aulaId) return null;
  const n = Number(aulaId);
  return Number.isFinite(n) ? n : null;
}

export default function AulaPage() {
  const { dataIso, aulaId } = useParams<{ dataIso: string; aulaId: string }>();
  const navigate = useNavigate();
  const aulaIdNum = toAulaIdNumberOrNull(aulaId);

  const { workspace, isLoading, error, refresh } = useWorkspaceAula({
    dataIso,
    aulaId,
  });

  if (!dataIso || aulaIdNum === null) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate("/dias")}>
          Voltar
        </button>
        <h1>Parametros invalidos</h1>
        <p>Data ou aula nao informadas na URL.</p>
      </main>
    );
  }

  if (isLoading && !workspace) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
          Voltar
        </button>
        <h1>Aula</h1>
        <p>Carregando dados da aula...</p>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
          Voltar
        </button>
        <h1>Aula nao encontrada</h1>
        <p>Nao foi possivel localizar a aula selecionada.</p>
      </main>
    );
  }

  return (
    <main className="container py-3">
      <button className="btn btn-link p-0 mb-3" onClick={() => navigate(`/dias/${dataIso}`)}>
        Voltar para o dia
      </button>

      <WorkspaceHeader meta={workspace.meta} header={workspace.header} />
      <WorkspaceKpis kpis={workspace.kpis} />
      {error && <div className="alert alert-warning py-2">{error}</div>}
      <WorkspaceWarnings warnings={workspace.warnings} />

      <WorkspaceEquipesPanel
        dataIso={workspace.meta.data_iso}
        aulaId={aulaIdNum}
        meta={workspace.meta}
        equipes={workspace.equipes}
        onRefresh={refresh}
      />

      <WorkspacePartidasPanel
        dataIso={workspace.meta.data_iso}
        aulaId={aulaIdNum}
        equipes={workspace.equipes}
        partidas={workspace.partidas}
        onRefresh={refresh}
      />
    </main>
  );
}
