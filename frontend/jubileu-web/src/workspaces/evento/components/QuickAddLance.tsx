import { useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { criarLancePartida, type AuthHeaders } from "../../../services/eventosService";
import type { EventoCapability } from "../capabilities";

function makeClientEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `lance-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function QuickAddLance({
  auth,
  caps,
  eventoStatus,
  partidaStatus,
  partidaId,
  onSubmitted,
}: {
  auth: AuthHeaders | null;
  caps: Set<EventoCapability>;
  eventoStatus: string;
  partidaStatus: string | null;
  partidaId: number | null;
  onSubmitted: () => Promise<void>;
}) {
  const [tipo, setTipo] = useState("GOL");
  const [payload, setPayload] = useState("{\"minute\": 1}");
  const [jogadorId, setJogadorId] = useState("");
  const [clientEventId, setClientEventId] = useState(makeClientEventId());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canEdit = useMemo(
    () =>
      Boolean(auth) &&
      caps.has("lances") &&
      eventoStatus === "EM_ANDAMENTO" &&
      partidaStatus === "EM_ANDAMENTO" &&
      partidaId != null,
    [auth, caps, eventoStatus, partidaId, partidaStatus],
  );

  async function submit() {
    if (!auth || !partidaId) return;
    setIsSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      await criarLancePartida(
        partidaId,
        {
          tipo,
          payload: parsed,
          jogador_id: jogadorId ? Number(jogadorId) : undefined,
          client_event_id: clientEventId,
        },
        auth,
      );
      setInfo("Lance registrado");
      setClientEventId(makeClientEventId());
      await onSubmitted();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao registrar lance";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Quick Add Lance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!canEdit ? (
          <div className="rounded-md bg-amber-50 p-2 text-sm text-amber-700">
            Edicao bloqueada: evento e partida precisam estar EM_ANDAMENTO e permissao de lance ativa.
          </div>
        ) : null}
        {error ? <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
        {info ? <div className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">{info}</div> : null}
        <Input value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={!canEdit || isSubmitting} />
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            placeholder="jogador_id opcional"
            value={jogadorId}
            onChange={(e) => setJogadorId(e.target.value)}
            disabled={!canEdit || isSubmitting}
          />
          <Input
            value={clientEventId}
            onChange={(e) => setClientEventId(e.target.value)}
            disabled={!canEdit || isSubmitting}
          />
        </div>
        <Textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          disabled={!canEdit || isSubmitting}
          rows={3}
        />
        <Button onClick={submit} disabled={!canEdit || isSubmitting}>
          {isSubmitting ? "Registrando..." : "Registrar lance"}
        </Button>
      </CardContent>
    </Card>
  );
}
