import type {
  Evento,
  EventoParticipante,
  Lance,
  LancePayload,
  SeedPartidaPayload,
  SeedPartidaResponse,
} from "../types/evento";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function buildUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function safeText(resp: Response) {
  try {
    return await resp.text();
  } catch {
    return "";
  }
}

export type AuthHeaders = {
  userId: string;
  role?: "admin" | "treinador" | "auxiliar" | "user";
  jogadorId?: number;
};

function authHeaders(auth: AuthHeaders): HeadersInit {
  return {
    "X-User-Id": auth.userId,
    "X-Role": auth.role ?? "user",
    ...(auth.jogadorId != null ? { "X-Jogador-Id": String(auth.jogadorId) } : {}),
  };
}

async function postJson<T>(
  path: string,
  auth: AuthHeaders,
  body?: unknown,
  extraHeaders?: HeadersInit,
): Promise<T> {
  const resp = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(auth),
      ...(extraHeaders ?? {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}

async function getJson<T>(path: string, auth: AuthHeaders): Promise<T> {
  const resp = await fetch(buildUrl(path), {
    method: "GET",
    headers: authHeaders(auth),
  });
  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}

export async function rsvpEvento(eventoId: number, auth: AuthHeaders): Promise<EventoParticipante> {
  const data = await postJson<{ participante: EventoParticipante }>(`/api/eventos/${eventoId}/rsvp`, auth);
  return data.participante;
}

export async function checkinEvento(eventoId: number, auth: AuthHeaders): Promise<EventoParticipante> {
  const data = await postJson<{ participante: EventoParticipante }>(`/api/eventos/${eventoId}/checkin`, auth);
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

export async function criarLancePartida(
  partidaId: number,
  payload: LancePayload,
  auth: AuthHeaders,
): Promise<Lance> {
  const data = await postJson<{ lance: Lance }>(`/api/partidas/${partidaId}/lances`, auth, payload);
  return data.lance;
}

