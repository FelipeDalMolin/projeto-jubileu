import { useCallback, useEffect, useRef, useState } from "react";

import {
  listarParticipantesEvento,
  listarPresentesEvento,
  type AuthHeaders,
} from "../../../services/eventosService";
import type { EventoParticipante } from "../../../types/evento";
import { useLancesTimeline } from "./useLancesTimeline";

type Params = {
  eventoId: number;
  partidaId?: number | null;
  auth: AuthHeaders | null;
  timelineEnabled: boolean;
  participantsEnabled: boolean;
  manualControl?: boolean;
};

export function useEventoLiveData({
  eventoId,
  partidaId,
  auth,
  timelineEnabled,
  participantsEnabled,
  manualControl = false,
}: Params) {
  const [participants, setParticipants] = useState<EventoParticipante[]>([]);
  const [presentes, setPresentes] = useState<EventoParticipante[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const backoffRef = useRef(0);
  const unauthorizedRef = useRef(0);

  const timeline = useLancesTimeline({
    eventoId,
    partidaId,
    auth,
    enabled: timelineEnabled,
    intervalMs: 1800,
    manualControl,
  });

  const refreshParticipants = useCallback(
    async (forceLoading = false): Promise<boolean> => {
      if (!auth || !participantsEnabled || document.hidden) return false;
      if (forceLoading) setIsLoadingParticipants(true);
      try {
        const [all, checkedIn] = await Promise.all([
          listarParticipantesEvento(eventoId, auth),
          listarPresentesEvento(eventoId, auth),
        ]);
        setParticipants(all);
        setPresentes(checkedIn);
        setParticipantsError(null);
        backoffRef.current = 0;
        unauthorizedRef.current = 0;
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao carregar participantes";
        setParticipantsError(message);
        backoffRef.current = Math.min(backoffRef.current + 1, 5);
        if (message.startsWith("401")) {
          unauthorizedRef.current += 1;
        } else {
          unauthorizedRef.current = 0;
        }
        return false;
      } finally {
        setIsLoadingParticipants(false);
      }
    },
    [auth, eventoId, participantsEnabled],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!participantsEnabled) {
      setParticipants([]);
      setPresentes([]);
      setParticipantsError(null);
      setIsLoadingParticipants(false);
      backoffRef.current = 0;
      unauthorizedRef.current = 0;
    }
  }, [participantsEnabled]);

  useEffect(() => {
    if (manualControl) return;
    if (!auth || !participantsEnabled) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled || !mountedRef.current) return;
      if (unauthorizedRef.current >= 3) return;
      await refreshParticipants(false);
      timerRef.current = setTimeout(tick, 3000 + backoffRef.current * 1000);
    };

    if (unauthorizedRef.current < 3) {
      void refreshParticipants(true);
      timerRef.current = setTimeout(tick, 3000);
    }
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [auth, manualControl, participantsEnabled, refreshParticipants]);

  const refreshParticipantsOnly = useCallback(async (): Promise<boolean> => {
    return await refreshParticipants(true);
  }, [refreshParticipants]);

  const refreshTimelineOnly = useCallback(async (): Promise<boolean> => {
    return await timeline.forceRefresh();
  }, [timeline]);

  const pollParticipantsOnly = useCallback(async (): Promise<boolean> => {
    return await refreshParticipants(false);
  }, [refreshParticipants]);

  const pollTimelineOnly = useCallback(async (): Promise<boolean> => {
    return await timeline.poll();
  }, [timeline]);

  const forceRefresh = useCallback(async () => {
    await Promise.all([refreshParticipantsOnly(), refreshTimelineOnly()]);
  }, [refreshParticipantsOnly, refreshTimelineOnly]);

  return {
    participants,
    presentes,
    isLoadingParticipants,
    participantsError,
    timelineItems: timeline.items,
    timelineLoading: timeline.isLoading,
    timelineError: timeline.error,
    refreshParticipantsOnly,
    refreshTimelineOnly,
    pollParticipantsOnly,
    pollTimelineOnly,
    forceRefresh,
  };
}
