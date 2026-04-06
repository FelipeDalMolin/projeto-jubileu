import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { WorkspaceAulaHeader, WorkspaceAulaMeta } from "../../../types/workspaceAula";

function statusVariant(status: WorkspaceAulaMeta["status"]) {
  if (status === "EM_ANDAMENTO") return "success";
  if (status === "PLANEJADA") return "warning";
  if (status === "CANCELADA") return "danger";
  return "secondary";
}

export function EventoHeader({
  meta,
  header,
  source,
}: {
  meta: WorkspaceAulaMeta;
  header: WorkspaceAulaHeader;
  source: "evento" | "aula_legacy";
}) {
  return (
    <Card className="mb-4 overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white">
      <CardHeader className="pb-2">
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="outline" className="border-slate-300/40 bg-slate-900/30 text-slate-100">
            {source === "aula_legacy" ? "LEGACY /aulas" : "EVENTO CANONICO"}
          </Badge>
          <Badge variant={statusVariant(meta.status)}>{meta.status}</Badge>
        </div>
        <CardTitle className="text-2xl font-bold">{header.titulo}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-slate-100 md:grid-cols-4">
        <div>
          <span className="opacity-80">Evento ID</span>
          <p className="font-semibold">#{meta.id}</p>
        </div>
        <div>
          <span className="opacity-80">Data</span>
          <p className="font-semibold">{meta.data_iso}</p>
        </div>
        <div>
          <span className="opacity-80">Janela</span>
          <p className="font-semibold">
            {header.horario_inicio} - {header.horario_fim}
          </p>
        </div>
        <div>
          <span className="opacity-80">Tipo</span>
          <p className="font-semibold">{meta.tipo}</p>
        </div>
      </CardContent>
    </Card>
  );
}
