import { useParams } from "react-router-dom";
import WorkspaceEventoPage from "../../workspaces/evento/WorkspaceEventoPage";

export default function AulaPage() {
  const { dataIso, aulaId } = useParams<{ dataIso: string; aulaId: string }>();

  return <WorkspaceEventoPage dataIso={dataIso} eventoId={aulaId} source="aula_legacy" />;
}
