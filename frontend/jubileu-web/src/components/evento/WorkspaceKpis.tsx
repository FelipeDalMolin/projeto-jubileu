import type { WorkspaceEventoKpis } from "../../types/workspaceEvento";

type Props = {
  kpis: WorkspaceEventoKpis;
};

export default function WorkspaceKpis({ kpis }: Props) {
  return (
    <p className="text-muted mb-3" style={{ fontSize: 12 }}>
      Presentes: {kpis.presentes}/{kpis.total_jogadores} - Gols: {kpis.gols_total}
    </p>
  );
}
