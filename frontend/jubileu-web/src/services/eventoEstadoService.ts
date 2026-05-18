// src/services/eventoEstadoService.ts
import type { EventoEstadoDTO, EventoEstadoResponse } from "../types/eventoEstado";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";

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

/**
 * Obtém o estado agregado da evento.
 *
 * Regras:
 * - 200 → há dados (data.version sempre presente)
 * - 204 → nenhuma alteração desde since_version
 * - erro → exceção
 */
export async function obterEstadoEvento(
  dataIso: string,
  eventoId: string | number,
  sinceVersion?: number,
  options?: {
    includeStats?: boolean;
  },
): Promise<EventoEstadoResponse> {
  const params = new URLSearchParams();

  if (sinceVersion !== undefined) {
    params.set("since_version", String(sinceVersion));
  }

  if (options?.includeStats) {
    params.set("include_stats", "true");
  }

  const query = params.toString();

  const resp = await fetch(
    buildUrl(
      `/dias/${dataIso}/eventos/${eventoId}/estado${query ? `?${query}` : ""}`,
    ),
  );

  if (resp.status === 204) {
    return { status: 204 };
  }

  if (!resp.ok) {
    throw new Error(
      `Erro ao obter estado da evento: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data: EventoEstadoDTO = await resp.json();

  // Garantia mínima de contrato
  if (typeof data.version !== "number") {
    throw new Error("Estado da evento inválido: campo 'version' ausente");
  }

  return { status: 200, data };
}
