import type { WorkspaceAulaKpis } from "../../types/workspaceAula";

type Props = {
  kpis: WorkspaceAulaKpis;
};

export default function WorkspaceKpis({ kpis }: Props) {
  return (
    <p className="text-muted mb-3" style={{ fontSize: 12 }}>
      Presentes: {kpis.presentes}/{kpis.total_jogadores} - Gols: {kpis.gols_total}
    </p>
  );
}
