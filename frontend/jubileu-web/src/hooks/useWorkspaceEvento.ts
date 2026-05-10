import { useCallback, useEffect, useRef, useState } from "react";

import { obterWorkspaceEvento } from "../services/workspaceEventoService";
import type { WorkspaceEvento } from "../types/workspaceEvento";

type Params = {
  dataIso?: string;
  eventoId?: string;
  enabled?: boolean;
  intervalMs?: number;
  manualControl?: boolean;
};

function toEventoIdNumberOrNull(eventoId?: string): number | null {
  if (!eventoId) return null;
  const n = Number(eventoId);
  return Number.isFinite(n) ? n : null;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useWorkspaceEvento({
  dataIso,
  eventoId,
  enabled = true,
  intervalMs = 2500,
  manualControl = false,
}: Params) {
  const [workspace, setWorkspace] = useState<WorkspaceEvento | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastVersionRef = useRef<number | undefined>(undefined);

  const eventoIdNum = toEventoIdNumberOrNull(eventoId);

  const fetchWorkspace = useCallback(
    async (sinceVersion?: number) => {
      if (!dataIso || eventoIdNum === null) return false;
      const resp = await obterWorkspaceEvento(dataIso, eventoIdNum, sinceVersion);
      if (resp.status === 204) return false;
      setWorkspace(resp.data);
      lastVersionRef.current = resp.data.meta.version;
      return true;
    },
    [dataIso, eventoIdNum],
  );

  useEffect(() => {
    setWorkspace(null);
    lastVersionRef.current = undefined;
  }, [dataIso, eventoId]);

  useEffect(() => {
    if (!enabled || manualControl || !dataIso) return;
    if (eventoIdNum === null) {
      setError("Evento invalido");
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      if (cancelled) return;
      try {
        setLoading((current) => current || !workspace);
        await fetchWorkspace(lastVersionRef.current);
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Erro ao carregar workspace do evento"));
      } finally {
        if (!cancelled) {
          setLoading(false);
          timer = window.setTimeout(tick, intervalMs);
        }
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [dataIso, enabled, eventoIdNum, fetchWorkspace, intervalMs, manualControl, workspace]);

  return {
    workspace,
    loading,
    error,
    refresh: () => fetchWorkspace(undefined),
  };
}
