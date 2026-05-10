import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { WorkspaceEventoEquipes } from "../../../types/workspaceEvento";

export function TimesPanel({ equipes }: { equipes: WorkspaceEventoEquipes }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Times</CardTitle>
      </CardHeader>
      <CardContent>
        {equipes.times.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem times montados.</p>
        ) : (
          <div className="space-y-2">
            {equipes.times.map((time) => (
              <div key={time.id} className="rounded-md border border-border p-2">
                <div className="text-sm font-semibold">{time.nome}</div>
                <div className="text-xs text-muted-foreground">{time.caracteristica ?? "Sem caracteristica"}</div>
                <div className="mt-1 text-xs">Jogadores: {time.jogadoresIds.join(", ") || "-"}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
