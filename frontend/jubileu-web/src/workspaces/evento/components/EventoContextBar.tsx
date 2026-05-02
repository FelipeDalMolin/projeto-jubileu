import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import type { WorkspaceEventoKpis, WorkspaceEventoMeta } from "../../../types/workspaceEvento";

export function EventoContextBar({
  meta,
  kpis,
  partidaAtivaId,
}: {
  meta: WorkspaceEventoMeta;
  kpis: WorkspaceEventoKpis;
  partidaAtivaId: number | null;
}) {
  return (
    <Card className="mb-4">
      <CardContent className="grid gap-3 pt-4 md:grid-cols-5">
        <div>
          <div className="text-xs text-muted-foreground">Turma ID</div>
          <div className="text-sm font-semibold">{meta.turma_id}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Versao workspace</div>
          <div className="text-sm font-semibold">{meta.version}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Presentes</div>
          <div className="text-sm font-semibold">{kpis.presentes}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Jogadores</div>
          <div className="text-sm font-semibold">{kpis.total_jogadores}</div>
        </div>
        <div className="flex items-center justify-end">
          {partidaAtivaId ? (
            <Badge variant="success">Partida ao vivo #{partidaAtivaId}</Badge>
          ) : (
            <Badge variant="outline">Sem partida ativa</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
