import { useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  cancelEvento,
  endEvento,
  startEvento,
  type AuthHeaders,
} from "../../../services/eventosService";
import type { EventoStatus } from "../../../types/evento";
import type { EventoCapability } from "../capabilities";

export function EventoStatusActions({
  auth,
  caps,
  eventoId,
  status,
  onChanged,
}: {
  auth: AuthHeaders | null;
  caps: Set<EventoCapability>;
  eventoId: number;
  status: EventoStatus;
  onChanged: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdmin = useMemo(() => Boolean(auth && caps.has("event_admin_actions")), [auth, caps]);

  async function doAction(action: "start" | "end" | "cancel") {
    if (!auth) return;
    setError(null);
    setLoading(true);
    try {
      if (action === "start") await startEvento(eventoId, auth);
      if (action === "end") await endEvento(eventoId, auth);
      if (action === "cancel") await cancelEvento(eventoId, auth);
      await onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha na atualizacao de status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Status do Evento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm">
          Atual: <strong>{status}</strong>
        </div>
        {error ? <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
        {!canAdmin ? (
          <div className="rounded bg-slate-100 p-2 text-sm text-slate-600">
            Sem permissao administrativa para alterar status.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void doAction("start")}
              disabled={loading || status !== "PLANEJADO"}
            >
              Iniciar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void doAction("end")}
              disabled={loading || status !== "EM_ANDAMENTO"}
            >
              Encerrar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => void doAction("cancel")}
              disabled={loading || status !== "PLANEJADO"}
            >
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
