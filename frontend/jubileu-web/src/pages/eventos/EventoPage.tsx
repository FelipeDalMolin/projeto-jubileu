import { useParams } from "react-router-dom";
import WorkspaceEventoPage from "../../workspaces/evento/WorkspaceEventoPage";

export default function EventoPage() {
  const { dataIso, eventoId } = useParams<{ dataIso: string; eventoId: string }>();

  return <WorkspaceEventoPage dataIso={dataIso} eventoId={eventoId} source="evento" />;
}
