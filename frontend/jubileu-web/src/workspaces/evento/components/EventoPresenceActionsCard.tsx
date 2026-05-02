import { useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  checkinEvento,
  checkinEventoJogador,
  desfazerCheckinEvento,
  desfazerRsvpEvento,
  rsvpEvento,
  type AuthHeaders,
} from "../../../services/eventosService";
import type { EventoParticipante, EventoStatus } from "../../../types/evento";
import type { EventoCapability } from "../capabilities";

type Props = {
  auth: AuthHeaders | null;
  caps: Set<EventoCapability>;
  eventoId: number;
  eventoStatus: EventoStatus;
  participants: EventoParticipante[];
  onChanged: () => Promise<void>;
};

export function EventoPresenceActionsCard({
  auth,
  caps,
  eventoId,
  eventoStatus,
  participants,
  onChanged,
}: Props) {
  const [manualJogadorId, setManualJogadorId] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const selfParticipant = useMemo(() => {
    if (!auth?.jogadorId) return null;
    return participants.find((item) => item.jogador_id === auth.jogadorId) ?? null;
  }, [auth?.jogadorId, participants]);

  const hasSelfJogador = Boolean(auth?.jogadorId);
  const canRsvp = Boolean(auth && caps.has("rsvp") && hasSelfJogador);
  const canSelfCheckin = Boolean(auth && caps.has("checkin_self") && hasSelfJogador);
  const canManualCheckin = Boolean(auth && caps.has("checkin_manual"));

  const canRsvpNow = canRsvp && (eventoStatus === "PLANEJADO" || eventoStatus === "EM_ANDAMENTO");
  const canCheckinNow = canSelfCheckin && eventoStatus === "EM_ANDAMENTO";
  const canManualNow = canManualCheckin && eventoStatus === "EM_ANDAMENTO";

  async function runAction(action: string, fn: () => Promise<void>) {
    setError(null);
    setInfo(null);
    setLoadingAction(action);
    try {
      await fn();
      await onChanged();
      setInfo("Acao executada com sucesso.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha na acao de presenca");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleManualCheckin() {
    if (!auth) return;
    const jogadorId = Number(manualJogadorId);
    if (!Number.isFinite(jogadorId) || jogadorId <= 0) {
      setError("Informe um jogador_id valido para check-in manual.");
      return;
    }
    await runAction("manual", async () => {
      await checkinEventoJogador(eventoId, jogadorId, auth);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Acoes de Presenca</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!hasSelfJogador ? (
          <div className="rounded-md bg-amber-50 p-2 text-sm text-amber-700">
            Sessao sem `jogadorId`: acoes self de RSVP/check-in estao bloqueadas.
          </div>
        ) : null}
        {eventoStatus !== "EM_ANDAMENTO" ? (
          <div className="rounded-md bg-slate-100 p-2 text-sm text-slate-600">
            Check-in so e permitido em `EM_ANDAMENTO`.
          </div>
        ) : null}

        {selfParticipant ? (
          <div className="rounded-md border border-border p-2 text-sm">
            Seu status no evento: <strong>{selfParticipant.status}</strong>
          </div>
        ) : null}

        {error ? <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
        {info ? <div className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">{info}</div> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => void runAction("rsvp", async () => auth && (await rsvpEvento(eventoId, auth)))}
            disabled={!auth || !canRsvpNow || loadingAction !== null}
          >
            RSVP
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              void runAction("cancel-rsvp", async () => auth && (await desfazerRsvpEvento(eventoId, auth)))
            }
            disabled={!auth || !canRsvpNow || loadingAction !== null}
          >
            Cancelar RSVP
          </Button>
          <Button
            size="sm"
            onClick={() => void runAction("checkin", async () => auth && (await checkinEvento(eventoId, auth)))}
            disabled={!auth || !canCheckinNow || loadingAction !== null}
          >
            Check-in
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              void runAction("checkout", async () => auth && (await desfazerCheckinEvento(eventoId, auth)))
            }
            disabled={!auth || !canCheckinNow || loadingAction !== null}
          >
            Desfazer check-in
          </Button>
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <Input
            placeholder="jogador_id para check-in manual"
            value={manualJogadorId}
            onChange={(e) => setManualJogadorId(e.target.value)}
            disabled={!canManualNow || loadingAction !== null}
          />
          <Button
            size="sm"
            onClick={() => void handleManualCheckin()}
            disabled={!canManualNow || loadingAction !== null}
          >
            Check-in manual
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

