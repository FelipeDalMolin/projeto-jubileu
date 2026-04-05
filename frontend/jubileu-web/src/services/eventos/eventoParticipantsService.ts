import type { EventoParticipante } from "../../types/evento";
import { getJson, type AuthHeaders } from "./http";

export async function listarParticipantesEvento(
  eventoId: number,
  auth: AuthHeaders,
): Promise<EventoParticipante[]> {
  const data = await getJson<{ items: EventoParticipante[] }>(`/api/eventos/${eventoId}/participants`, auth);
  return data.items ?? [];
}

export async function listarPresentesEvento(
  eventoId: number,
  auth: AuthHeaders,
): Promise<EventoParticipante[]> {
  const data = await getJson<{ items: EventoParticipante[] }>(
    `/api/eventos/${eventoId}/presentes?order=arrival`,
    auth,
  );
  return data.items ?? [];
}
