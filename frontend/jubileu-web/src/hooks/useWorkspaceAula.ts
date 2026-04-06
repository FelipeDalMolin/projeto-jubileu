import { useCallback, useEffect, useRef, useState } from "react";
import { obterWorkspaceAula } from "../services/workspaceAulaService";
import type { WorkspaceAula } from "../types/workspaceAula";

type Params = {
  dataIso?: string;
  aulaId?: string;
  enabled?: boolean;
  intervalMs?: number;
  manualControl?: boolean;
};

function toAulaIdNumberOrNull(aulaId?: string): number | null {
  if (!aulaId) return null;
  const n = Number(aulaId);
  return Number.isFinite(n) ? n : null;
}

export function useWorkspaceAula({
  dataIso,
  aulaId,
  enabled = true,
  intervalMs = 2500,
  manualControl = false,
}: Params) {
  const [workspace, setWorkspace] = useState<WorkspaceAula | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lastVersionRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const aulaIdNum = toAulaIdNumberOrNull(aulaId);

  const fetchWorkspace = useCallback(
    async (sinceVersion?: number, forceLoading?: boolean): Promise<boolean> => {
      if (!dataIso || aulaIdNum === null) return false;
      if (forceLoading) setIsLoading(true);
      try {
        const resp = await obterWorkspaceAula(dataIso, aulaIdNum, sinceVersion);
        if (resp.status === 200 && resp.data) {
          setWorkspace(resp.data);
          lastVersionRef.current = resp.data.meta?.version ?? null;
          setError(null);
          return true;
        }
        return true;
      } catch (err: any) {
        setError(err?.message ?? "Erro ao carregar workspace da aula");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [dataIso, aulaIdNum],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setWorkspace(null);
    setError(null);
    setIsLoading(false);
    lastVersionRef.current = null;
  }, [dataIso, aulaId]);

  useEffect(() => {
    if (manualControl) return;
    if (!enabled || !dataIso) return;
    if (aulaIdNum === null) {
      setError("Aula invalida");
      return;
    }

    const tick = async () => {
      if (!mountedRef.current) return;
      if (document.hidden) {
        timerRef.current = setTimeout(tick, intervalMs);
        return;
      }

      await fetchWorkspace(lastVersionRef.current ?? undefined);
      if (mountedRef.current) {
        timerRef.current = setTimeout(tick, intervalMs);
      }
    };

    void fetchWorkspace(undefined, true);
    timerRef.current = setTimeout(tick, intervalMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dataIso, aulaIdNum, enabled, intervalMs, fetchWorkspace, manualControl]);

  const refresh = useCallback(async () => {
    return await fetchWorkspace(undefined, true);
  }, [fetchWorkspace]);

  const poll = useCallback(async () => {
    return await fetchWorkspace(lastVersionRef.current ?? undefined, false);
  }, [fetchWorkspace]);

  return {
    workspace,
    isLoading,
    error,
    refresh,
    poll,
  };
}
