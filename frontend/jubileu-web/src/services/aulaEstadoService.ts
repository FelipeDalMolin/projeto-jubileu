import type { AulaEstadoDTO, AulaEstadoResponse } from "../types/aulaEstado";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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

export async function obterEstadoAula(
  dataIso: string,
  aulaId: number,
  sinceVersion?: number,
  includeStats = true,
): Promise<AulaEstadoResponse> {
  const params = new URLSearchParams();
  if (sinceVersion !== undefined) {
    params.set("since_version", String(sinceVersion));
  }
  if (includeStats) {
    params.set("include_stats", "true");
  }

  const query = params.toString();
  const resp = await fetch(
    url(
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
  return { status: 200, data };
}
