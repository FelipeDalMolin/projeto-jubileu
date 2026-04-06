import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  listarLancesEvento,
  mapLanceToTimelineItem,
  type AuthHeaders,
} from "../../../services/eventosService";
import type { LanceTimelineItem } from "../../../types/lanceTimeline";

type Params = {
  eventoId: number;
  partidaId?: number | null;
  auth: AuthHeaders | null;
  enabled?: boolean;
  intervalMs?: number;
  manualControl?: boolean;
};

export function useLancesTimeline({
  eventoId,
  partidaId,
  auth,
  enabled = true,
  intervalMs = 2200,
  manualControl = false,
}: Params) {
  const [items, setItems] = useState<LanceTimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const lastSinceRef = useRef<string | null>(null);
  const backoffRef = useRef(0);
  const unauthorizedRef = useRef(0);

  const normalizedAuth = useMemo(() => auth, [auth]);

  const scheduleNext = useCallback(
    (base: number) => {
      if (!mountedRef.current) return;
      const extra = backoffRef.current * 1000;
      timerRef.current = setTimeout(() => {
        void tick();
      }, base + extra);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const mergeItems = useCallback((current: LanceTimelineItem[], incoming: LanceTimelineItem[]) => {
    if (!incoming.length) return current;
    const map = new Map<number, LanceTimelineItem>();
    current.forEach((item) => map.set(item.id, item));
    incoming.forEach((item) => map.set(item.id, item));
    return Array.from(map.values()).sort((a, b) => {
      const byTime = a.createdAt.localeCompare(b.createdAt);
      return byTime !== 0 ? byTime : a.id - b.id;
    });
  }, []);

  const fetchOnce = useCallback(
    async (initial = false): Promise<boolean> => {
      if (!normalizedAuth || !enabled) return false;
      if (inFlightRef.current) return false;
      if (document.hidden) return false;

      inFlightRef.current = true;
      if (initial) setIsLoading(true);

      try {
        const lances = await listarLancesEvento(eventoId, normalizedAuth, {
          partidaId: partidaId ?? undefined,
          since: lastSinceRef.current ?? undefined,
          limit: 200,
        });
        const mapped = lances.map(mapLanceToTimelineItem);
        setItems((prev) => mergeItems(prev, mapped));
        const last = mapped[mapped.length - 1];
        if (last) {
          lastSinceRef.current = last.createdAt;
        }
        setError(null);
        backoffRef.current = 0;
        unauthorizedRef.current = 0;
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao carregar timeline";
        setError(message);
        backoffRef.current = Math.min(backoffRef.current + 1, 5);
        if (message.startsWith("401")) {
          unauthorizedRef.current += 1;
        } else {
          unauthorizedRef.current = 0;
        }
        return false;
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [enabled, eventoId, mergeItems, normalizedAuth, partidaId],
  );

  async function tick() {
    if (unauthorizedRef.current >= 3) return;
    await fetchOnce(false);
    scheduleNext(intervalMs);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setItems([]);
    setError(null);
    setIsLoading(false);
    lastSinceRef.current = null;
    backoffRef.current = 0;
    unauthorizedRef.current = 0;
  }, [eventoId, partidaId, normalizedAuth?.userId, normalizedAuth?.role, normalizedAuth?.jogadorId]);

  useEffect(() => {
    if (manualControl) return;
    if (!enabled || !normalizedAuth) return;
    if (unauthorizedRef.current < 3) {
      void fetchOnce(true);
      scheduleNext(intervalMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, fetchOnce, intervalMs, manualControl, normalizedAuth, scheduleNext]);

  const forceRefresh = useCallback(async (): Promise<boolean> => {
    lastSinceRef.current = null;
    setItems([]);
    return await fetchOnce(true);
  }, [fetchOnce]);

  const poll = useCallback(async (): Promise<boolean> => {
    return await fetchOnce(false);
  }, [fetchOnce]);

  return { items, isLoading, error, forceRefresh, poll };
}
