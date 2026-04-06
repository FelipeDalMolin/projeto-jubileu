import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { EventoParticipante } from "../../../types/evento";

export function ParticipantesPanel({
  participants,
  isLoading,
  error,
}: {
  participants: EventoParticipante[];
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Participantes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && participants.length === 0 ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!isLoading && !error && participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum participante.</p>
        ) : null}
        <ul className="space-y-1 text-sm">
          {participants.map((item) => (
            <li key={item.id} className="rounded border border-border p-2">
              jogador #{item.jogador_id} - <strong>{item.status}</strong>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
