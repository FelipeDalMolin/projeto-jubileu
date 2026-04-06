import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { EventoParticipante } from "../../../types/evento";

export function FilaChegadaPanel({ presentes }: { presentes: EventoParticipante[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Fila de Chegada</CardTitle>
      </CardHeader>
      <CardContent>
        {presentes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem check-ins ainda.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {presentes.map((item) => (
              <li key={item.id} className="rounded border border-border p-2">
                #{item.arrival_seq ?? "-"} - jogador #{item.jogador_id}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
