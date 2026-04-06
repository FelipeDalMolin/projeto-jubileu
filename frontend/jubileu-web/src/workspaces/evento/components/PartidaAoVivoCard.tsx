import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { WorkspaceAulaPartida } from "../../../types/workspaceAula";

export function PartidaAoVivoCard({
  partida,
  eventoStatus,
}: {
  partida: WorkspaceAulaPartida | null;
  eventoStatus: string;
}) {
  if (!partida) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Partida Ao Vivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma partida registrada no evento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Partida Ao Vivo</CardTitle>
          <Badge variant={partida.status === "EM_ANDAMENTO" ? "success" : "outline"}>
            {partida.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm">Partida #{partida.id}</div>
        <div className="grid grid-cols-3 items-center gap-2 rounded-md bg-slate-100 p-2 text-center">
          <div className="text-sm font-semibold">{partida.timeAId}</div>
          <div className="text-lg font-bold">
            {partida.golsTimeA} x {partida.golsTimeB}
          </div>
          <div className="text-sm font-semibold">{partida.timeBId}</div>
        </div>
        <p className="text-xs text-muted-foreground">
          Evento {eventoStatus}; edicao de lances somente quando evento e partida estiverem EM_ANDAMENTO.
        </p>
      </CardContent>
    </Card>
  );
}
