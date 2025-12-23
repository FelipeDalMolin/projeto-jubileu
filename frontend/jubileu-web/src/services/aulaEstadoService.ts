// src/services/aulaEstadoService.ts
import type { AulaEstadoDTO, AulaEstadoResponse } from "../types/aulaEstado";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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
 * Obtém o estado agregado da aula.
 *
 * Regras:
 * - 200 → há dados (data.version sempre presente)
 * - 204 → nenhuma alteração desde since_version
 * - erro → exceção
 */
export async function obterEstadoAula(
  dataIso: string,
  aulaId: string | number,
  sinceVersion?: number,
  options?: {
    includeStats?: boolean;
  },
): Promise<AulaEstadoResponse> {
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
      `/dias/${dataIso}/aulas/${aulaId}/estado${query ? `?${query}` : ""}`,
    ),
  );

  if (resp.status === 204) {
    return { status: 204 };
  }

  if (!resp.ok) {
    throw new Error(
      `Erro ao obter estado da aula: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data: AulaEstadoDTO = await resp.json();

  // Garantia mínima de contrato
  if (typeof data.version !== "number") {
    throw new Error("Estado da aula inválido: campo 'version' ausente");
  }

  return { status: 200, data };
}
