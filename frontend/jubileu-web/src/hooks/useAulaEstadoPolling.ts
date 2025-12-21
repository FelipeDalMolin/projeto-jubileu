import { useCallback, useEffect, useRef, useState } from "react";
import type { AulaEstadoDTO } from "../types/aulaEstado";
import { obterEstadoAula } from "../services/aulaEstadoService";

type Params = {
  dataIso: string;
  aulaId: number;
  enabled: boolean;
  intervalMs?: number;
};

export function useAulaEstadoPolling({
  dataIso,
  aulaId,
  enabled,
  intervalMs = 2000,
}: Params) {
  const [estado, setEstado] = useState<AulaEstadoDTO | null>(null);
  const [lastVersion, setLastVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [failStreak, setFailStreak] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setEstado(null);
    setLastVersion(null);
    setError(null);
    setFailStreak(0);
  }, [dataIso, aulaId]);

  const tick = useCallback(async () => {
    if (!enabled || !mountedRef.current) return;
    if (document.hidden) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void tick();
      }, intervalMs);
      return;
    }

    setLoading((prev) => prev || !estado);
    let nextFailStreak = failStreak;

    try {
      const resp = await obterEstadoAula(
        dataIso,
        aulaId,
        lastVersion ?? undefined,
        true,
      );

      if (resp.status === 200) {
        setEstado(resp.data);
        setLastVersion(resp.data.version);
        setError(null);
        nextFailStreak = 0;
      }
    } catch (err: any) {
      const msg = err?.message ?? "Erro ao carregar estado da aula";
      setError(msg);
      nextFailStreak = failStreak + 1;
    } finally {
      setFailStreak(nextFailStreak);
      if (mountedRef.current) {
        setLoading(false);
        const backoff = nextFailStreak > 0 ? 5000 : intervalMs;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          void tick();
        }, backoff);
      }
    }
  }, [
    aulaId,
    dataIso,
    enabled,
    intervalMs,
    lastVersion,
    estado,
    failStreak,
  ]);

  useEffect(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void tick();
    }, 0);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, tick]);

  const refreshNow = useCallback(async () => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    await tick();
  }, [enabled, tick]);

  return {
    estado,
    setEstado,
    lastVersion,
    loading,
    error,
    refreshNow,
  };
}
