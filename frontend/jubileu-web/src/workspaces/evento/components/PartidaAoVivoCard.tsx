import { useEffect, useRef, useState } from "react";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { EventoStatus } from "../../../types/evento";
import type { WorkspaceEventoPartida } from "../../../types/workspaceEvento";

function parseDateMs(iso?: string | null): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  const ts = date.getTime();
  return Number.isFinite(ts) ? ts : null;
}

function formatSeconds(total: number) {
  const safe = Math.max(0, total);
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      void ctx.close();
    }, 200);
  } catch {
    // Keep UI functional even if audio is blocked.
  }
}

const SOUND_PREF_KEY = "jubileu.lance_alarm_sound_enabled";

export function PartidaAoVivoCard({
  partidaAtiva,
  partidaFallback,
  eventoStatus,
  duracaoPartidaSegundos,
  canManagePartida = false,
  onEncerrarPartida,
  onSalvarDuracao,
}: {
  partidaAtiva: WorkspaceEventoPartida | null;
  partidaFallback?: WorkspaceEventoPartida | null;
  eventoStatus: EventoStatus;
  duracaoPartidaSegundos?: number;
  canManagePartida?: boolean;
  onEncerrarPartida?: () => Promise<void>;
  onSalvarDuracao?: (duracaoSegundos: number) => Promise<void>;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SOUND_PREF_KEY) !== "0";
  });
  const [isTempoLivre, setIsTempoLivre] = useState(false);
  const [duracaoSelecionada, setDuracaoSelecionada] = useState<string>(() => String(duracaoPartidaSegundos ?? 600));
  const [isSavingDuracao, setIsSavingDuracao] = useState(false);
  const [isEndingPartida, setIsEndingPartida] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const alertedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const partida = partidaAtiva ?? partidaFallback ?? null;
  const inicioMs = parseDateMs(partida?.inicio_at ?? null);
  const elapsedSeconds =
    partida?.status === "EM_ANDAMENTO" && inicioMs
      ? Math.max(0, Math.floor((nowMs - inicioMs) / 1000))
      : 0;
  const limiteSegundos = Math.max(60, duracaoPartidaSegundos ?? 600);
  const restanteSegundos = Math.max(0, limiteSegundos - elapsedSeconds);
  const fimJanela = !isTempoLivre && elapsedSeconds >= limiteSegundos;
  const cronometroLabel =
    partida?.status === "EM_ANDAMENTO"
      ? isTempoLivre
        ? `${formatSeconds(elapsedSeconds)} / Livre`
        : `${formatSeconds(elapsedSeconds)} / ${formatSeconds(limiteSegundos)}`
      : "00:00";
  const progressPct =
    partida?.status === "EM_ANDAMENTO" && !isTempoLivre
      ? Math.min(100, Math.floor((elapsedSeconds / limiteSegundos) * 100))
      : 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SOUND_PREF_KEY, soundEnabled ? "1" : "0");
  }, [soundEnabled]);

  useEffect(() => {
    setDuracaoSelecionada(String(duracaoPartidaSegundos ?? 600));
  }, [duracaoPartidaSegundos]);

  useEffect(() => {
    if (!partida || partida.status !== "EM_ANDAMENTO") {
      alertedRef.current = false;
      return;
    }
    if (!fimJanela || alertedRef.current) return;
    alertedRef.current = true;
    if (soundEnabled) beep();
  }, [fimJanela, partida, soundEnabled]);

  async function handleSalvarDuracao() {
    if (!onSalvarDuracao || isTempoLivre) return;
    setActionError(null);
    const parsed = Number(duracaoSelecionada);
    if (!Number.isFinite(parsed) || parsed < 60) {
      setActionError("Duracao invalida: minimo 60 segundos.");
      return;
    }
    try {
      setIsSavingDuracao(true);
      await onSalvarDuracao(parsed);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Falha ao salvar duracao.");
    } finally {
      setIsSavingDuracao(false);
    }
  }

  async function handleEncerrarPartida() {
    if (!onEncerrarPartida) return;
    setActionError(null);
    try {
      setIsEndingPartida(true);
      await onEncerrarPartida();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Falha ao encerrar partida.");
    } finally {
      setIsEndingPartida(false);
    }
  }

  if (!partidaAtiva && !partidaFallback) {
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

  if (!partidaAtiva && partidaFallback) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Pre-jogo</CardTitle>
            <Badge variant="outline">{partidaFallback.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">Partida #{partidaFallback.id} pronta para iniciar.</div>
          <div className="grid grid-cols-3 items-center gap-2 rounded-md bg-slate-100 p-2 text-center">
            <div className="text-sm font-semibold">{partidaFallback.timeAId}</div>
            <div className="text-lg font-bold">
              {partidaFallback.golsTimeA} x {partidaFallback.golsTimeB}
            </div>
            <div className="text-sm font-semibold">{partidaFallback.timeBId}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            Evento {eventoStatus}; inicie a partida na aba Partidas para habilitar lances ao vivo.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!partida) return null;

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
        <div
          className={`rounded-md px-2 py-1 text-center text-sm font-semibold ${
            fimJanela ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
          }`}
        >
          Cronometro: {cronometroLabel}
          {partida.status === "EM_ANDAMENTO" ? (
            <span className="ml-2 text-xs">
              {fimJanela ? "Tempo encerrado" : `Restante: ${formatSeconds(restanteSegundos)}`}
            </span>
          ) : null}
        </div>
        <div className="h-2 w-full rounded bg-slate-200">
          <div
            className={`h-2 rounded ${fimJanela ? "bg-amber-500" : "bg-blue-500"}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {actionError ? <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">{actionError}</div> : null}
        <div className="rounded-md border bg-muted/20 p-2">
          <div className="mb-1 text-xs font-medium">Tempo da partida</div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-muted-foreground">
              Modo
              <select
                className="mt-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                value={isTempoLivre ? "livre" : "limitado"}
                onChange={(e) => setIsTempoLivre(e.target.value === "livre")}
              >
                <option value="limitado">Limitado</option>
                <option value="livre">Tempo livre</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Duracao
              <select
                className="mt-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                value={duracaoSelecionada}
                onChange={(e) => setDuracaoSelecionada(e.target.value)}
                disabled={isTempoLivre}
              >
                <option value="300">5 min</option>
                <option value="600">10 min</option>
                <option value="900">15 min</option>
                <option value="1200">20 min</option>
              </select>
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void handleSalvarDuracao()}
              disabled={!canManagePartida || isTempoLivre || isSavingDuracao || !onSalvarDuracao}
            >
              {isSavingDuracao ? "Salvando..." : "Salvar tempo"}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={soundEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setSoundEnabled((prev) => !prev)}
          >
            Alarme sonoro: {soundEnabled ? "ON" : "OFF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={beep}
            disabled={!soundEnabled}
          >
            Testar som
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void handleEncerrarPartida()}
            disabled={!canManagePartida || !onEncerrarPartida || partida.status !== "EM_ANDAMENTO" || isEndingPartida}
          >
            {isEndingPartida ? "Encerrando..." : "Encerrar partida"}
          </Button>
        </div>
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
