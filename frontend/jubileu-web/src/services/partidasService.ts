import type {
  EstatisticaJogadorPartida,
  PartidaEvento,
} from "../types/dia";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";

function url(path: string) {
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

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
  return typeof value === "object" && value !== null ? (value as ApiRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapEstatistica(raw: unknown): EstatisticaJogadorPartida {
  const api = asRecord(raw);
  return {
    id: api.id != null ? asNumber(api.id) : undefined,
    jogadorEventoId: asNumber(api.jogador_evento_id ?? api.jogadorEventoId ?? api.jogadorId),
    gols: asNumber(api.gols),
    assistencias: asNumber(api.assistencias),
    chiliques: asNumber(api.chiliques),
    faltas: asNumber(api.faltas),
    nota: api.nota != null ? asNumber(api.nota) : undefined,
  };
}

function mapPartida(raw: unknown): PartidaEvento {
  const api = asRecord(raw);
  return {
    id: asNumber(api.id),
    ordem: asNumber(api.ordem),
    timeAId: String(api.time_a_id ?? api.timeAId ?? ""),
    timeBId: String(api.time_b_id ?? api.timeBId ?? ""),
    golsTimeA: asNumber(api.gols_time_a ?? api.golsTimeA),
    golsTimeB: asNumber(api.gols_time_b ?? api.golsTimeB),
    estatisticas: asArray(api.estatisticas).map(mapEstatistica),
  };
}

type PartidaInput = {
  ordem?: number;
  timeAId: string;
  timeBId: string;
  estatisticas?: EstatisticaJogadorPartida[];
};

function parseTimeId(raw: string): number {
  const cleaned = raw.startsWith("time-") ? raw.slice(5) : raw;
  return Number(cleaned);
}

function toPayload(input: PartidaInput) {
  return {
    ordem: input.ordem,
    time_a_id: parseTimeId(input.timeAId),
    time_b_id: parseTimeId(input.timeBId),
    estatisticas: (input.estatisticas ?? []).map((e) => ({
      jogador_evento_id: e.jogadorEventoId,
      gols: e.gols ?? 0,
      assistencias: e.assistencias ?? 0,
      chiliques: e.chiliques ?? 0,
      faltas: e.faltas ?? 0,
      nota: e.nota ?? null,
    })),
  };
}

export async function listarPartidas(
  dataIso: string,
  eventoId: string,
): Promise<PartidaEvento[]> {
  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}/partidas`));
  if (!resp.ok) {
    throw new Error(
      `Erro ao listar partidas: ${resp.status} ${await safeText(resp)}`,
    );
  }
  const json = await resp.json();
  return (json ?? []).map(mapPartida);
}

export async function criarPartida(
  dataIso: string,
  eventoId: string,
  input: PartidaInput,
): Promise<PartidaEvento> {
  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}/partidas`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(input)),
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao criar partida: ${resp.status} ${await safeText(resp)}`,
    );
  }

  return mapPartida(await resp.json());
}

export async function atualizarPartida(
  dataIso: string,
  eventoId: string,
  partidaId: string,
  input: PartidaInput,
): Promise<PartidaEvento> {
  const resp = await fetch(
    url(`/api/dias/${dataIso}/eventos/${eventoId}/partidas/${partidaId}`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(input)),
    },
  );

  if (!resp.ok) {
    throw new Error(
      `Erro ao atualizar partida: ${resp.status} ${await safeText(resp)}`,
    );
  }

  return mapPartida(await resp.json());
}

export async function deletarPartida(
  dataIso: string,
  eventoId: string,
  partidaId: string,
): Promise<void> {
  const resp = await fetch(
    url(`/api/dias/${dataIso}/eventos/${eventoId}/partidas/${partidaId}`),
    { method: "DELETE" },
  );

  if (!resp.ok) {
    throw new Error(
      `Erro ao excluir partida: ${resp.status} ${await safeText(resp)}`,
    );
  }
}
