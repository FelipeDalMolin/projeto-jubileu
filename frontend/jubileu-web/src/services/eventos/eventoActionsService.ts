import type {
  Evento,
  EventoParticipante,
  SeedPartidaPayload,
  SeedPartidaResponse,
} from "../../types/evento";
import { deleteJson, postJson, type AuthHeaders } from "./http";

export async function rsvpEvento(eventoId: number, auth: AuthHeaders): Promise<EventoParticipante> {
  const data = await postJson<{ participante: EventoParticipante }>(`/api/eventos/${eventoId}/rsvp`, auth);
  return data.participante;
}

export async function desfazerRsvpEvento(eventoId: number, auth: AuthHeaders): Promise<EventoParticipante> {
  const data = await deleteJson<{ participante: EventoParticipante }>(`/api/eventos/${eventoId}/rsvp`, auth);
  return data.participante;
}

export async function checkinEvento(eventoId: number, auth: AuthHeaders): Promise<EventoParticipante> {
  const data = await postJson<{ participante: EventoParticipante }>(`/api/eventos/${eventoId}/checkin`, auth);
  return data.participante;
}

export async function desfazerCheckinEvento(eventoId: number, auth: AuthHeaders): Promise<EventoParticipante> {
  const data = await deleteJson<{ participante: EventoParticipante }>(
    `/api/eventos/${eventoId}/checkin`,
    auth,
  );
  return data.participante;
}

export async function checkinEventoJogador(
  eventoId: number,
  jogadorId: number,
  auth: AuthHeaders,
): Promise<EventoParticipante> {
  const data = await postJson<{ participante: EventoParticipante }>(
    `/api/eventos/${eventoId}/participants/${jogadorId}/checkin`,
    auth,
  );
  return data.participante;
}

export async function startEvento(eventoId: number, auth: AuthHeaders): Promise<Evento> {
  const data = await postJson<{ evento: Evento }>(`/api/eventos/${eventoId}/start`, auth);
  return data.evento;
}

export async function endEvento(eventoId: number, auth: AuthHeaders): Promise<Evento> {
  const data = await postJson<{ evento: Evento }>(`/api/eventos/${eventoId}/end`, auth);
  return data.evento;
}

export async function cancelEvento(eventoId: number, auth: AuthHeaders): Promise<Evento> {
  const data = await postJson<{ evento: Evento }>(`/api/eventos/${eventoId}/cancel`, auth);
  return data.evento;
}

export async function seedPartidaEvento(
  eventoId: number,
  payload: SeedPartidaPayload,
  auth: AuthHeaders,
  idempotencyKey?: string,
): Promise<SeedPartidaResponse> {
  return await postJson<SeedPartidaResponse>(
    `/api/eventos/${eventoId}/partidas/seed`,
    auth,
    payload,
    idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  );
}
