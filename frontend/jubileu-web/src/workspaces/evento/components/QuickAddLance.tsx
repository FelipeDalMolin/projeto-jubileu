import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { criarLancePartida, type AuthHeaders } from "../../../services/eventosService";
import type { PresencaJogadorDia } from "../../../types/dia";
import type { EventoStatus } from "../../../types/evento";
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
  partidaInicioAt,
  jogadores,
  times,
  onSubmitted,
}: {
  auth: AuthHeaders | null;
  caps: Set<EventoCapability>;
  eventoStatus: EventoStatus;
  partidaStatus: string | null;
  partidaId: number | null;
  partidaInicioAt?: string | null;
  jogadores: PresencaJogadorDia[];
  times: Array<{ id: string; nome: string }>;
  onSubmitted: () => Promise<void>;
}) {
  const [timeId, setTimeId] = useState("");
  const [tipo, setTipo] = useState("GOL");
  const [minute, setMinute] = useState("1");
  const [detalhe, setDetalhe] = useState("");
  const [jogadorId, setJogadorId] = useState("");
  const [jogadorSecundarioId, setJogadorSecundarioId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const canEdit = useMemo(
    () =>
      Boolean(auth) &&
      caps.has("lances") &&
      eventoStatus === "EM_ANDAMENTO" &&
      partidaStatus === "EM_ANDAMENTO" &&
      partidaId != null,
    [auth, caps, eventoStatus, partidaId, partidaStatus],
  );

  const jogadoresDoTime = useMemo(() => {
    if (!timeId) return [];
    return jogadores.filter((j) => j.timeId === timeId);
  }, [jogadores, timeId]);

  const minutoAtualSugerido = useMemo(() => {
    if (!partidaInicioAt || partidaStatus !== "EM_ANDAMENTO") return null;
    const inicioMs = new Date(partidaInicioAt).getTime();
    if (!Number.isFinite(inicioMs)) return null;
    return Math.max(1, Math.floor((nowMs - inicioMs) / 60000));
  }, [nowMs, partidaInicioAt, partidaStatus]);

  useEffect(() => {
    if (partidaStatus !== "EM_ANDAMENTO") return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [partidaStatus]);

  useEffect(() => {
    if (minutoAtualSugerido == null) return;
    setMinute(String(minutoAtualSugerido));
  }, [minutoAtualSugerido, partidaId]);

  useEffect(() => {
    if (!timeId) {
      setJogadorId("");
      setJogadorSecundarioId("");
      return;
    }
    if (jogadorId && !jogadoresDoTime.some((j) => String(j.jogadorId) === jogadorId)) {
      setJogadorId("");
    }
    if (
      jogadorSecundarioId &&
      !jogadoresDoTime.some((j) => String(j.jogadorId) === jogadorSecundarioId)
    ) {
      setJogadorSecundarioId("");
    }
  }, [timeId, jogadorId, jogadorSecundarioId, jogadoresDoTime]);

  async function submit() {
    if (!auth || !partidaId) return;
    setIsSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const parsedMinute = Number(minute);
      if (!Number.isFinite(parsedMinute) || parsedMinute < 0) {
      setError("Informe um minuto valido.");
      setIsSubmitting(false);
      return;
      }
      if (!timeId) {
        setError("Selecione a equipe do lance.");
        setIsSubmitting(false);
        return;
      }
      const parsed: Record<string, unknown> = { minute: parsedMinute };
      if (detalhe.trim()) parsed.note = detalhe.trim();
      if (jogadorSecundarioId) parsed.jogador_secundario_id = Number(jogadorSecundarioId);
      if (timeId) parsed.time_id = Number(timeId);
      await criarLancePartida(
        partidaId,
        {
          tipo,
          payload: parsed,
          jogador_id: jogadorId ? Number(jogadorId) : undefined,
          client_event_id: makeClientEventId(),
        },
        auth,
      );
      setInfo("Lance registrado");
      setDetalhe("");
      setJogadorId("");
      setJogadorSecundarioId("");
      try {
        await onSubmitted();
      } catch (refreshErr: unknown) {
        console.error(refreshErr);
        setInfo("Lance registrado. Falha ao atualizar tela; recarregue se necessario.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao registrar lance";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Gerencia de Lances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!canEdit ? (
          <div className="rounded-md bg-amber-50 p-2 text-sm text-amber-700">
            Edicao bloqueada: evento e partida precisam estar EM_ANDAMENTO e permissao de lance ativa.
          </div>
        ) : null}
        {error ? <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
        {info ? <div className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">{info}</div> : null}
        <div className="grid gap-2 md:grid-cols-1">
          <label className="text-xs text-muted-foreground">
            Equipe do lance
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={timeId}
              onChange={(e) => setTimeId(e.target.value)}
              disabled={!canEdit || isSubmitting}
            >
              <option value="">Selecione equipe</option>
              {times.map((time) => (
                <option key={`time-${time.id}`} value={time.id}>
                  {time.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Tipo de lance
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={!canEdit || isSubmitting}
            >
              <option value="GOL">GOL</option>
              <option value="ASSISTENCIA">ASSISTENCIA</option>
              <option value="FALTA">FALTA</option>
              <option value="CHILIQUE">CHILIQUE</option>
              <option value="CARTAO_AMARELO">CARTAO_AMARELO</option>
              <option value="CARTAO_VERMELHO">CARTAO_VERMELHO</option>
              <option value="OUTRO">OUTRO</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Minuto
            <Input
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              disabled={!canEdit || isSubmitting}
              placeholder="sugerido automaticamente"
            />
            <div className="mt-1 flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMinute((prev) => String(Math.max(0, Number(prev || "0") - 1)))}
                disabled={!canEdit || isSubmitting}
              >
                -1
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMinute((prev) => String(Math.max(0, Number(prev || "0") + 1)))}
                disabled={!canEdit || isSubmitting}
              >
                +1
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMinute(String(minutoAtualSugerido ?? 1))}
                disabled={!canEdit || isSubmitting || minutoAtualSugerido == null}
              >
                Usar atual {minutoAtualSugerido != null ? `(${minutoAtualSugerido})` : ""}
              </Button>
            </div>
          </label>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Jogador (opcional)
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={jogadorId}
              onChange={(e) => setJogadorId(e.target.value)}
              disabled={!canEdit || isSubmitting || !timeId}
            >
              <option value="">Sem jogador</option>
              {jogadoresDoTime.map((j) => (
                <option key={j.jogadorId} value={j.jogadorId}>
                  {j.nome} (#{j.jogadorId})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Jogador secundario (opcional)
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={jogadorSecundarioId}
              onChange={(e) => setJogadorSecundarioId(e.target.value)}
              disabled={!canEdit || isSubmitting || !timeId}
            >
              <option value="">Sem jogador secundario</option>
              {jogadoresDoTime.map((j) => (
                <option key={`sec-${j.jogadorId}`} value={j.jogadorId}>
                  {j.nome} (#{j.jogadorId})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-2 md:grid-cols-1">
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTimeId("");
                setTipo("GOL");
                setDetalhe("");
                setJogadorId("");
                setJogadorSecundarioId("");
              }}
              disabled={!canEdit || isSubmitting}
            >
              Preset Gol
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTipo("FALTA");
                setDetalhe("");
              }}
              disabled={!canEdit || isSubmitting}
            >
              Preset Falta
            </Button>
          </div>
        </div>
        <Input
          value={detalhe}
          onChange={(e) => setDetalhe(e.target.value)}
          disabled={!canEdit || isSubmitting}
          placeholder="Detalhe opcional (ex.: chute cruzado)"
        />
        <Button onClick={submit} disabled={!canEdit || isSubmitting}>
          {isSubmitting ? "Registrando..." : "Registrar lance"}
        </Button>
      </CardContent>
    </Card>
  );
}
